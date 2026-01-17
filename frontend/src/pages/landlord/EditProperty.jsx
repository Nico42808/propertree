/**
 * Edit Property Page - Single page form for editing property details
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Container } from '../../components/layout';
import { Card, Button, Loading, Alert, Input, TextArea, Select, Checkbox } from '../../components/common';
import { Save, ArrowLeft, Upload, X, Plus, Minus, Home, Building, Hotel, Key, Castle, Building2, HomeIcon, Layers, Wifi, Car, Utensils, Tv, Wind, Waves, Dumbbell, Coffee } from 'lucide-react';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'villa', label: 'Villa', icon: Castle },
  { value: 'studio', label: 'Studio', icon: HomeIcon },
  { value: 'townhouse', label: 'Townhouse', icon: Hotel },
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'kitchen', label: 'Kitchen', icon: Utensils },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
];

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    property_type: '',
    title: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 1,
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    price_per_night: '',
    monthly_price: '',
    rental_terms: [],
    approval_type: 'landlord',
    amenities: [],
    photos: [],
  });

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/landlord/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperty(data);
        
        // Normalize photos - handle both formats
        const normalizedPhotos = (data.photos || []).map((photo, index) => {
          if (typeof photo === 'string') {
            return {
              id: `photo-${index}`,
              url: photo,
              preview: photo,
              isPrimary: index === 0
            };
          } else if (photo.url || photo.preview) {
            return {
              id: photo.id || `photo-${index}`,
              url: photo.url || photo.preview,
              preview: photo.preview || photo.url,
              isPrimary: photo.isPrimary || index === 0
            };
          }
          return photo;
        });

        setFormData({
          property_type: data.property_type || '',
          title: data.title || '',
          description: data.description || '',
          bedrooms: data.bedrooms || 1,
          bathrooms: parseFloat(data.bathrooms) || 1,
          max_guests: data.max_guests || 1,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
          price_per_night: data.price_per_night ? parseFloat(data.price_per_night).toString() : '',
          monthly_price: data.monthly_price ? parseFloat(data.monthly_price).toString() : '',
          rental_terms: Array.isArray(data.rental_terms) ? data.rental_terms : [],
          approval_type: data.approval_type || 'landlord',
          amenities: data.amenities || [],
          photos: normalizedPhotos,
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to load property:', errorData);
        toast.error('Failed to load property');
        navigate('/landlord/properties');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Error loading property');
      navigate('/landlord/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (name, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleDecimalChange = (name, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData(prev => {
      const current = prev.amenities || [];
      const updated = current.includes(amenityId)
        ? current.filter(id => id !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenities: updated };
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          isPrimary: formData.photos.length === 0,
        };
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, newPhoto]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId)
    }));
  };

  const handleSetPrimaryPhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.map(p => ({
        ...p,
        isPrimary: p.id === photoId
      }))
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Normalize photos for backend
      const normalizedPhotos = formData.photos.map(photo => {
        if (typeof photo === 'string') {
          return photo;
        } else if (photo.url) {
          return photo.url;
        } else if (photo.preview) {
          if (photo.preview.startsWith('data:')) {
            return photo.preview;
          }
          return photo.preview;
        }
        return photo;
      });

      const propertyData = {
        title: formData.title || 'Untitled Property',
        description: formData.description || 'No description provided',
        property_type: formData.property_type,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseFloat(formData.bathrooms) || 1,
        max_guests: parseInt(formData.max_guests) || 1,
        price_per_night: parseFloat(formData.price_per_night) || 0,
        monthly_price: formData.monthly_price !== '' ? parseFloat(formData.monthly_price) || 0 : null,
        approval_type: formData.approval_type || 'landlord',
        rental_terms: formData.rental_terms || [],
        amenities: formData.amenities || [],
        photos: normalizedPhotos,
        status: property?.status || 'draft'
      };

      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/landlord/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
      });

      if (response.ok) {
        toast.success('Property updated successfully!');
        navigate('/landlord/properties');
      } else {
        const errorData = await response.json();
        console.error('Error updating property:', errorData);
        toast.error(errorData.detail || 'Failed to update property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Error updating property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
        </div>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container>
        <Alert
          type="error"
          title="Property Not Found"
          message="The property you're trying to edit doesn't exist or you don't have permission to edit it."
        />
      </Container>
    );
  }

  const selectedPropertyType = PROPERTY_TYPES.find(t => t.value === formData.property_type);
  const hasShortTerm = (formData.rental_terms || []).includes('short_term');
  const hasMidOrLong = (formData.rental_terms || []).includes('mid_term') || (formData.rental_terms || []).includes('long_term');
  const showNightlyPrice = hasShortTerm;
  const showMonthlyPrice = !hasShortTerm || hasMidOrLong;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/landlord/properties')}
                leftIcon={<ArrowLeft />}
                className="mb-2"
              >
                Back to Properties
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
              <p className="text-gray-600 mt-1">{property.title}</p>
            </div>
            <Button
              variant="success"
              onClick={handleSave}
              leftIcon={<Save />}
              disabled={saving}
              size="lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <Card.Header>
                <Card.Title>Basic Information</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                <Input
                  label="Property Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Cozy apartment in downtown"
                  required
                />

                <TextArea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property..."
                  rows={6}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {PROPERTY_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.property_type === type.value;

                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, property_type: type.value }))}
                          className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-propertree-green bg-green-50'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          <Icon
                            className={`w-8 h-8 mx-auto mb-2 ${
                              isSelected ? 'text-propertree-green' : 'text-gray-600'
                            }`}
                          />
                          <p className={`font-medium text-sm ${isSelected ? 'text-propertree-green' : 'text-gray-900'}`}>
                            {type.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Property Details */}
            <Card>
              <Card.Header>
                <Card.Title>Property Details</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Bedrooms <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleNumberChange('bedrooms', Math.max(0, formData.bedrooms - 1))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green disabled:opacity-50"
                        disabled={formData.bedrooms <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => handleNumberChange('bedrooms', e.target.value)}
                        className="w-16 text-center border-2 border-gray-300 rounded-lg px-2 py-2 font-semibold"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleNumberChange('bedrooms', formData.bedrooms + 1)}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Bathrooms <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecimalChange('bathrooms', Math.max(0.5, formData.bathrooms - 0.5))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green disabled:opacity-50"
                        disabled={formData.bathrooms <= 0.5}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.bathrooms}
                        onChange={(e) => handleDecimalChange('bathrooms', e.target.value)}
                        className="w-16 text-center border-2 border-gray-300 rounded-lg px-2 py-2 font-semibold"
                        min="0.5"
                      />
                      <button
                        type="button"
                        onClick={() => handleDecimalChange('bathrooms', formData.bathrooms + 0.5)}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Max Guests <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleNumberChange('max_guests', Math.max(1, formData.max_guests - 1))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green disabled:opacity-50"
                        disabled={formData.max_guests <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={formData.max_guests}
                        onChange={(e) => handleNumberChange('max_guests', e.target.value)}
                        className="w-16 text-center border-2 border-gray-300 rounded-lg px-2 py-2 font-semibold"
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={() => handleNumberChange('max_guests', formData.max_guests + 1)}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-propertree-green"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Location */}
            <Card>
              <Card.Header>
                <Card.Title>Location</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, Number, Details"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                    required
                  />

                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="NY"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="United States"
                    required
                  />

                  <Input
                    label="Postal Code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="10001"
                    required
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Photos */}
            <Card>
              <Card.Header>
                <Card.Title>Photos</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-propertree-green transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-900 font-medium mb-1">Click to upload</p>
                    <p className="text-sm text-gray-500">JPG, PNG or GIF (max. 10MB per photo)</p>
                  </label>
                </div>

                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.preview || photo.url}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        
                        {photo.isPrimary && (
                          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 space-x-2">
                            {!photo.isPrimary && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSetPrimaryPhoto(photo.id)}
                              >
                                Set Primary
                              </Button>
                            )}
                            <button
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Amenities */}
            <Card>
              <Card.Header>
                <Card.Title>Amenities</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {AMENITIES.map(amenity => {
                    const Icon = amenity.icon;
                    const isSelected = formData.amenities.includes(amenity.id);
                    
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity.id)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isSelected ? 'border-propertree-green bg-green-50' : 'border-gray-300'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-propertree-green' : 'text-gray-600'}`} />
                        <p className={`font-medium text-sm ${isSelected ? 'text-propertree-green' : 'text-gray-900'}`}>
                          {amenity.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <Card.Header>
                <Card.Title>Pricing</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                {showNightlyPrice && (
                  <Input
                    label="Price per Night (€)"
                    type="number"
                    name="price_per_night"
                    value={formData.price_per_night}
                    onChange={handleChange}
                    placeholder="150.00"
                    step="0.01"
                    required
                  />
                )}
                {showMonthlyPrice && (
                  <Input
                    label="Price per Month (€)"
                    type="number"
                    name="monthly_price"
                    value={formData.monthly_price}
                    onChange={handleChange}
                    placeholder="3000.00"
                    step="0.01"
                    required={!hasShortTerm}
                  />
                )}
              </Card.Body>
            </Card>

            {/* Booking Approval */}
            <Card>
              <Card.Header>
                <Card.Title>Booking Approval</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-3">
                <Select
                  label="Approval Type"
                  name="approval_type"
                  value={formData.approval_type}
                  onChange={handleChange}
                  required
                >
                  <option value="landlord">Landlord Approval</option>
                  <option value="admin">Admin Approval</option>
                </Select>
                <p className="text-xs text-gray-600">
                  {formData.approval_type === 'landlord'
                    ? 'You will review and approve all booking requests'
                    : 'Platform admins will review and approve booking requests'}
                </p>
              </Card.Body>
            </Card>

            {/* Status Info */}
            <Card>
              <Card.Header>
                <Card.Title>Status</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.status === 'approved' ? 'bg-green-100 text-green-800' :
                      property.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      property.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {property.status === 'rejected' && property.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {property.rejection_reason}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Help Text */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your changes will be saved immediately. If the property is approved, changes will be visible to tenants.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Save Button (Mobile) */}
        <div className="lg:hidden mt-6">
          <Button
            variant="success"
            onClick={handleSave}
            leftIcon={<Save />}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default EditProperty;
