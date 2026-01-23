/**
 * Landlord Bookings Page - View bookings for landlord's properties
 */
import React, { useState, useEffect } from 'react';
import { Container } from '../../components/layout';
import { Card, Badge, Loading, EmptyState, Button } from '../../components/common';
import { Calendar, MapPin, Home, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const LandlordBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/bookings/landlord/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.results || data);
      } else {
        toast.error('Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Booking ${newStatus}`);
        fetchBookings(); // Refresh bookings
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update booking status' }));
        toast.error(errorData.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Error updating booking');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', label: 'Pending' },
      confirmed: { variant: 'success', label: 'Confirmed' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
      completed: { variant: 'info', label: 'Completed' },
    };
    
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-propertree-dark">Property Bookings</h1>
        <p className="text-gray-600 mt-2">Manage bookings for your properties</p>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filterStatus === 'confirmed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('confirmed')}
        >
          Confirmed
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="No bookings"
          message={filterStatus === 'all' ? "You don't have any bookings yet." : `No ${filterStatus} bookings.`}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <Card.Body>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {booking.property_title}
                        </h3>
                        <div className="text-sm text-gray-600 mb-2">
                          Tenant: {booking.tenant_name}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {calculateNights(booking.check_in, booking.check_out)} nights
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-600">Guests</div>
                        <div className="font-semibold flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.guests_count}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Price</div>
                        <div className="font-semibold flex items-center gap-1 text-propertree-green">
                          {formatCurrency(booking.total_price)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {booking.status === 'pending' && (
                      <div className="mt-4">
                        {booking.property_approval_type === 'landlord' ? (
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              leftIcon={<CheckCircle />}
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<XCircle />}
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              This booking requires admin approval. Platform admins will review and confirm this booking.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          Booking confirmed. Guest will receive check-in details.
                        </p>
                      </div>
                    )}

                    {booking.status === 'cancelled' && booking.cancellation_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-800 mb-1">Cancellation Reason:</p>
                        <p className="text-sm text-red-700">{booking.cancellation_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default LandlordBookings;
