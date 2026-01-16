/**
 * Admin Properties - View and approve/reject properties
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Home, Search, Filter, CheckCircle, XCircle, 
  Eye, Clock, MapPin, Euro, Trash2, Plus, X
} from 'lucide-react';
  import { formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../components/layout';
import { Card, Button, Input, Badge, Modal, Loading, EmptyState, Select } from '../../components/common';
import { toast } from 'react-hot-toast';

const Properties = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [countryFilter, setCountryFilter] = useState(searchParams.get('country') || '');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [filterOptions, setFilterOptions] = useState({ countries: [], cities: [] });
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [statusFilter, countryFilter, cityFilter]);

  useEffect(() => {
    fetchFilterOptions();
  }, [countryFilter]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const params = new URLSearchParams();
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (countryFilter) {
        params.append('country', countryFilter);
      }
      if (cityFilter) {
        params.append('city', cityFilter);
      }
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/properties/all${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const params = new URLSearchParams();
      if (countryFilter) {
        params.append('country', countryFilter);
      }
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/properties/filter-options${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (countryFilter && data.cities) {
          // If country is selected, use the cities array directly
          setFilterOptions({
            countries: data.countries || filterOptions.countries,
            cities: data.cities || []
          });
        } else if (data.cities_by_country) {
          // If no country selected, get all cities grouped by country
          const allCities = Object.values(data.cities_by_country).flat();
          setFilterOptions({
            countries: data.countries || [],
            cities: allCities
          });
        } else {
          setFilterOptions({
            countries: data.countries || [],
            cities: []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleApprove = async (propertyId) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        toast.success('Property approved successfully!');
        fetchProperties();
      } else {
        toast.error('Failed to approve property');
      }
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Error approving property');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/admin/properties/${selectedProperty.id}/reject/`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );
      
      if (response.ok) {
        toast.success('Property rejected');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedProperty(null);
        fetchProperties();
      } else {
        toast.error('Failed to reject property');
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error('Error rejecting property');
    }
  };

  const openRejectModal = (property) => {
    setSelectedProperty(property);
    setShowRejectModal(true);
  };

  const openDeleteModal = (property) => {
    setSelectedProperty(property);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedProperty) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok || response.status === 204) {
        toast.success('Property deleted successfully!');
        setShowDeleteModal(false);
        setSelectedProperty(null);
        fetchProperties();
      } else {
        toast.error('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Error deleting property');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_approval: { variant: 'warning', label: 'Pending' },
      approved: { variant: 'success', label: 'Active' },
      rejected: { variant: 'danger', label: 'Rejected' },
      draft: { variant: 'secondary', label: 'Draft' },
      booked: { variant: 'info', label: 'Booked' },
    };
    
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getNightlyPrice = (property) => {
    const nightly = Number(property?.price_per_night);
    if (Number.isNaN(nightly) || nightly <= 0) {
      return null;
    }
    return nightly;
  };

  const getMonthlyPrice = (property) => {
    const rawMonthly = property?.monthly_price;
    if (rawMonthly !== null && rawMonthly !== undefined && rawMonthly !== '') {
      const monthly = Number(rawMonthly);
      return Number.isNaN(monthly) ? null : monthly;
    }
    const nightly = getNightlyPrice(property);
    return nightly ? nightly * 30 : null;
  };

  const clearFilters = () => {
    setCountryFilter('');
    setCityFilter('');
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasActiveFilters = countryFilter || cityFilter || searchQuery || statusFilter !== 'all';

  const filteredProperties = properties.filter(property => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      property.title?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.owner_name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-2">Review, approve, or remove property listings</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus />}
          onClick={() => navigate('/admin/properties/new')}
        >
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="Search properties by title, city, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Country Filter */}
            <div className="w-full md:w-48">
              <Select
                name="country"
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCityFilter(''); // Reset city when country changes
                }}
                options={[
                  { value: '', label: 'All Countries' },
                  ...filterOptions.countries.map(country => ({ value: country, label: country }))
                ]}
                placeholder="All Countries"
                disabled={loadingFilters}
              />
            </div>

            {/* City Filter */}
            <div className="w-full md:w-48">
              <Select
                name="city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Cities' },
                  ...filterOptions.cities.map(city => ({ value: city, label: city }))
                ]}
                placeholder={countryFilter ? 'All Cities' : 'Select Country First'}
                disabled={loadingFilters || !countryFilter}
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<X className="w-4 h-4" />}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending_approval' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending_approval')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={<Home className="w-16 h-16" />}
          title="No properties found"
          message={statusFilter === 'pending_approval' 
            ? "No properties pending approval" 
            : "No properties match your filters"}
        />
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => {
            const nightlyPrice = getNightlyPrice(property);
            const monthlyPrice = getMonthlyPrice(property);

            return (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <Card.Body>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Property Image */}
                  <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {(() => {
                      let imageUrl = null;
                      if (property.primary_photo) {
                        imageUrl = property.primary_photo;
                      } else if (property.photos && property.photos.length > 0) {
                        const firstPhoto = property.photos[0];
                        if (typeof firstPhoto === 'string') {
                          imageUrl = firstPhoto;
                        } else if (firstPhoto && typeof firstPhoto === 'object') {
                          imageUrl = firstPhoto.preview || firstPhoto.url;
                        }
                      }
                      
                      return imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    <div className="image-placeholder w-full h-full flex items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                    {!property.primary_photo && (!property.photos || property.photos.length === 0) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {property.title}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {property.city}, {property.state}, {property.country}
                        </p>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {property.property_type?.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bedrooms</p>
                        <p className="font-semibold text-gray-900">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Max Guests</p>
                        <p className="font-semibold text-gray-900">{property.max_guests}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Price/Night</p>
                        <p className="font-semibold text-gray-900 flex items-center">
                            {nightlyPrice !== null ? formatCurrency(nightlyPrice) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Price/Month</p>
                        <p className="font-semibold text-gray-900 flex items-center">
                          {monthlyPrice !== null ? formatCurrency(monthlyPrice) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <p>Owner: <span className="font-medium">{property.owner_name || property.landlord_name || 'N/A'}</span></p>
                          <p>Submitted: {new Date(property.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye />}
                            onClick={() => window.open(`/properties/${property.id}`, '_blank')}
                          >
                            View
                          </Button>

                          {property.status === 'pending_approval' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                leftIcon={<CheckCircle />}
                                onClick={() => handleApprove(property.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                leftIcon={<XCircle />}
                                onClick={() => openRejectModal(property)}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 />}
                            onClick={() => openDeleteModal(property)}
                          >
                            Delete
                          </Button>

                          {property.status === 'rejected' && property.rejection_reason && (
                            <div className="text-sm text-red-600 w-full mt-2">
                              Reason: {property.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedProperty(null);
        }}
        title="Reject Property"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting <strong>{selectedProperty?.title}</strong>:
          </p>
          
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            rows="4"
            placeholder="Explain why this property is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedProperty(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Property
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProperty(null);
        }}
        title="Delete Property"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedProperty?.title}</strong>?
          </p>
          <p className="text-sm text-red-600">
            This action cannot be undone. All associated data will be permanently removed.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProperty(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Property
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default Properties;
