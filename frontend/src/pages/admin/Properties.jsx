/**
 * Admin Properties - View and approve/reject properties
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Home, Search, CheckCircle, XCircle, Eye, MapPin, Trash2, Plus, X,
} from 'lucide-react';
import { Container } from '../../components/layout';
import { Card, Button, Input, Badge, Modal, Loading, EmptyState, Select } from '../../components/common';
import { toast } from 'react-hot-toast';

const Properties = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (countryFilter) params.append('country', countryFilter);
      if (cityFilter) params.append('city', cityFilter);
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/properties/all${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error Loading Properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const params = new URLSearchParams();
      if (countryFilter) params.append('country', countryFilter);
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/properties/filter-options${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (countryFilter && data.cities) {
          setFilterOptions({ countries: data.countries || filterOptions.countries, cities: data.cities || [] });
        } else if (data.cities_by_country) {
          setFilterOptions({ countries: data.countries || [], cities: Object.values(data.cities_by_country).flat() });
        } else {
          setFilterOptions({ countries: data.countries || [], cities: [] });
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
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (response.ok) {
        toast.success('Property Approved Successfully!');
        fetchProperties();
      } else {
        toast.error('Failed to Approve Property');
      }
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Error Approving Property');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please Provide a Rejection Reason');
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/admin/properties/${selectedProperty.id}/reject/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );
      if (response.ok) {
        toast.success('Property Rejected');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedProperty(null);
        fetchProperties();
      } else {
        toast.error('Failed to Reject Property');
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error('Error Rejecting Property');
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty) return;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (response.ok || response.status === 204) {
        toast.success('Property Deleted Successfully!');
        setShowDeleteModal(false);
        setSelectedProperty(null);
        fetchProperties();
      } else {
        toast.error('Failed to Delete Property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Error Deleting Property');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_approval: { variant: 'warning', label: 'Pending' },
      approved: { variant: 'success', label: 'Active' },
      rejected: { variant: 'danger', label: 'Rejected' },
      draft: { variant: 'secondary', label: 'Draft' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const clearFilters = () => {
    setCountryFilter('');
    setCityFilter('');
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasActiveFilters = countryFilter || cityFilter || searchQuery || statusFilter !== 'all';
  const filteredProperties = properties.filter((property) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return property.title?.toLowerCase().includes(query)
      || property.city?.toLowerCase().includes(query)
      || property.owner_name?.toLowerCase().includes(query);
  });

  if (loading) return <Container className="py-8"><Loading /></Container>;

  return (
    <Container className="py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-2">Review, Approve, or Remove Property Listings</p>
        </div>
        <Button variant="primary" leftIcon={<Plus />} onClick={() => navigate('/admin/properties/new')}>
          Add Property
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="Search Properties by Title, City, or Owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                name="country"
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setCityFilter(''); }}
                options={[{ value: '', label: 'All Countries' }, ...filterOptions.countries.map((country) => ({ value: country, label: country }))]}
                placeholder="All Countries"
                disabled={loadingFilters}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                name="city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                options={[{ value: '', label: 'All Cities' }, ...filterOptions.cities.map((city) => ({ value: city, label: city }))]}
                placeholder={countryFilter ? 'All Cities' : 'Select Country First'}
                disabled={loadingFilters || !countryFilter}
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="outline" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
            <div className="flex gap-2">
              {[
                ['all', 'All'],
                ['pending_approval', 'Pending'],
                ['approved', 'Active'],
                ['rejected', 'Rejected'],
              ].map(([value, label]) => (
                <Button key={value} variant={statusFilter === value ? 'primary' : 'outline'} size="sm" onClick={() => setStatusFilter(value)}>{label}</Button>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={<Home className="w-16 h-16" />}
          title="No Properties Found"
          message={statusFilter === 'pending_approval' ? 'No Properties Pending Approval' : 'No Properties Match Your Filters'}
        />
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <Card.Body>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {property.primary_photo ? (
                      <img src={property.primary_photo} alt={property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home className="w-12 h-12 text-gray-400" /></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-4 h-4" />{property.city}, {property.state}, {property.country}</p>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{property.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div><p className="text-xs text-gray-500">Property Type</p><p className="font-semibold text-gray-900 capitalize">{property.property_type?.replace('_', ' ')}</p></div>
                      <div><p className="text-xs text-gray-500">Bedrooms</p><p className="font-semibold text-gray-900">{property.bedrooms}</p></div>
                      <div><p className="text-xs text-gray-500">Bathrooms</p><p className="font-semibold text-gray-900">{property.bathrooms}</p></div>
                    </div>

                    <div className="border-t pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        <p>Owner: <span className="font-medium">{property.owner_name || property.landlord_name || 'N/A'}</span></p>
                        <p>Submitted: {new Date(property.created_at).toLocaleDateString('en-CA')}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" leftIcon={<Eye />} onClick={() => window.open(`/properties/${property.id}`, '_blank')}>View</Button>
                        {property.status === 'pending_approval' && (
                          <>
                            <Button variant="success" size="sm" leftIcon={<CheckCircle />} onClick={() => handleApprove(property.id)}>Approve</Button>
                            <Button variant="danger" size="sm" leftIcon={<XCircle />} onClick={() => { setSelectedProperty(property); setShowRejectModal(true); }}>Reject</Button>
                          </>
                        )}
                        <Button variant="danger" size="sm" leftIcon={<Trash2 />} onClick={() => { setSelectedProperty(property); setShowDeleteModal(true); }}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedProperty(null); }} title="Reject Property">
        <div className="space-y-4">
          <p className="text-gray-600">Please Provide a Reason for Rejecting <strong>{selectedProperty?.title}</strong>:</p>
          <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent" rows="4" placeholder="Explain Why This Property Is Being Rejected..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button><Button variant="danger" onClick={handleReject} disabled={!rejectionReason.trim()}>Reject Property</Button></div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedProperty(null); }} title="Delete Property">
        <div className="space-y-4">
          <p className="text-gray-600">Are You Sure You Want to Delete <strong>{selectedProperty?.title}</strong>?</p>
          <p className="text-sm text-red-600">This Action Cannot Be Undone. All Associated Data Will Be Permanently Removed.</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete Property</Button></div>
        </div>
      </Modal>
    </Container>
  );
};

export default Properties;
