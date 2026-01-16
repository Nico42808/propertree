/**
 * Landlord Properties Page - View and manage all properties
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../../components/layout';
import { Card, Button, Badge, EmptyState, Loading } from '../../components/common';
import { Plus, Home, MapPin, Euro, Bed, Bath, Users, Calendar, Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/landlord/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const propertyList = data.results || data;
        setProperties(propertyList);
        
        // Calculate stats
        const newStats = {
          total: propertyList.length,
          draft: propertyList.filter(p => p.status === 'draft').length,
          pending: propertyList.filter(p => p.status === 'pending_approval').length,
          approved: propertyList.filter(p => p.status === 'approved').length,
          rejected: propertyList.filter(p => p.status === 'rejected').length
        };
        setStats(newStats);
      } else {
        const errorData = await response.json();
        console.error('Failed to load properties:', errorData);
        toast.error('Failed to load properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/landlord/${propertyId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok || response.status === 204) {
        toast.success('Property deleted');
        // Remove from local state
        setProperties((prev) => prev.filter(p => p.id !== propertyId));
        // Update stats
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          draft: Math.max(0, prev.draft - (properties.find(p => p.id === propertyId && p.status === 'draft') ? 1 : 0)),
          pending: Math.max(0, prev.pending - (properties.find(p => p.id === propertyId && p.status === 'pending_approval') ? 1 : 0)),
          approved: Math.max(0, prev.approved - (properties.find(p => p.id === propertyId && p.status === 'approved') ? 1 : 0)),
          rejected: Math.max(0, prev.rejected - (properties.find(p => p.id === propertyId && p.status === 'rejected') ? 1 : 0))
        }));
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed to delete property' }));
        toast.error(err.error || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Error deleting property');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending_approval: { variant: 'warning', label: 'Pending Review' },
      approved: { variant: 'success', label: 'Active' },
      rejected: { variant: 'danger', label: 'Rejected' },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-propertree-dark">My Properties</h1>
          <p className="text-gray-600 mt-1">Manage your property listings and view bookings</p>
        </div>
        <Link to="/landlord/properties/new">
          <Button variant="primary" leftIcon={<Plus />}>
            Add Property
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <Card.Body className="text-center">
              <div className="text-3xl font-bold text-propertree-green">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="text-center">
              <div className="text-3xl font-bold text-gray-500">{stats.draft}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="text-center">
              <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="text-center">
              <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
              <div className="text-sm text-gray-600">Active</div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="text-center">
              <div className="text-3xl font-bold text-red-500">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Link to="/landlord/bookings">
          <Button variant="outline" leftIcon={<Calendar />}>
            View Bookings
          </Button>
        </Link>
      </div>

      {/* Properties List */}
      {properties.length === 0 ? (
        <EmptyState
          icon={<Home className="w-16 h-16" />}
          title="No properties listed"
          message="Start by adding your first property to appear in searches"
          action={() => navigate('/landlord/properties/new')}
          actionLabel="Add First Property"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const nightlyPrice = getNightlyPrice(property);
            const monthlyPrice = getMonthlyPrice(property);

            return (
              <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {/* Property Image */}
              <div className="card-media bg-gray-200 overflow-hidden rounded-t-2xl">
                {property.primary_photo ? (
                  <img 
                    src={property.primary_photo} 
                    alt={property.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <Card.Body className="p-4 sm:p-5">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-1 flex-1">
                    {property.title}
                  </h3>
                  {getStatusBadge(property.status)}
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {property.city}, {property.state}
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Bed className="w-4 h-4 mr-1.5" />
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Bath className="w-4 h-4 mr-1.5" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-1.5" />
                    {property.max_guests}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {nightlyPrice !== null && (
                    <div className="text-xl font-bold text-propertree-green">
                      {formatCurrency(nightlyPrice)}
                      <span className="text-sm text-gray-600 font-normal ml-1"> / night</span>
                    </div>
                  )}
                  {monthlyPrice !== null && (
                    <div className="text-sm text-gray-600">
                      {formatCurrency(monthlyPrice)}
                      <span className="text-xs font-normal ml-1"> / month</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {property.status === 'approved' && (
                    <Link to={`/properties/${property.id}`} className="w-full sm:flex-1">
                      <Button variant="outline" size="sm" leftIcon={<Eye />} className="w-full h-10 px-4">
                        View Live
                      </Button>
                    </Link>
                  )}
                  <Link 
                    to={`/landlord/properties/${property.id}/edit`} 
                    className={property.status === 'approved' ? 'w-full sm:flex-1' : 'w-full'}
                  >
                    <Button variant="primary" size="sm" className="w-full h-10 px-4">
                      {property.status === 'draft' ? 'Complete' : 'Edit'}
                    </Button>
                  </Link>

                  {/* Delete Button */}
                  <div className="w-full sm:w-auto">
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 />}
                      onClick={() => handleDeleteProperty(property.id)}
                      className="w-full sm:w-auto h-10 px-4"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Rejection Reason */}
                {property.status === 'rejected' && property.rejection_reason && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    <strong>Rejected:</strong> {property.rejection_reason}
                  </div>
                )}

                {/* Pending Message */}
                {property.status === 'pending_approval' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    Awaiting admin approval
                  </div>
                )}
              </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
};

export default Properties;
