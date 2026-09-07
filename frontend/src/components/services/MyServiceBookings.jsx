/**
 * MyServiceBookings component - Display user's service bookings
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, AlertCircle, Camera } from 'lucide-react';
import { getServiceBookings } from '../../services/serviceService';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatCurrency } from '../../utils/formatters';

const STATUS_CONFIG = {
  open: { variant: 'warning', label: 'Pending Confirmation' },
  assigned: { variant: 'info', label: 'Confirmed' },
  in_progress: { variant: 'primary', label: 'In Progress' },
  resolved: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-gray-600', label: 'Low' },
  medium: { color: 'text-blue-600', label: 'Medium' },
  high: { color: 'text-orange-600', label: 'High' },
  urgent: { color: 'text-red-600', label: 'Urgent' },
};

const MyServiceBookings = () => {
  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['my-service-bookings'],
    queryFn: getServiceBookings,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-propertree-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your service bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-medium">Failed to load bookings</p>
        <p className="text-red-600 text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  if (bookingsList.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-600 text-lg mb-2">No service bookings yet</p>
        <p className="text-gray-500 text-sm">
          Book a service from the catalog to get started
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {bookingsList.map((booking) => {
        const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.open;
        const priorityConfig = PRIORITY_CONFIG[booking.priority] || PRIORITY_CONFIG.medium;

        return (
          <Card key={booking.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  <span className={`text-xs font-medium ${priorityConfig.color}`}>
                    {priorityConfig.label} Priority
                  </span>
                </div>

                {/* Property Info */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{booking.rental_property?.title || 'Property'}</span>
                </div>

                {/* Schedule Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  {booking.requested_date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(booking.requested_date)}</span>
                    </div>
                  )}
                  {booking.requested_time && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{booking.requested_time}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-3">{booking.description}</p>

                {/* Service Provider */}
                {booking.assigned_to && (
                  <div className="bg-green-50 rounded-lg p-3 mt-3">
                    <p className="text-sm text-green-800">
                      <strong>Service Provider:</strong> {booking.assigned_to.name}
                    </p>
                    {booking.assigned_to.phone && (
                      <p className="text-sm text-green-700 mt-1">
                        Phone: {booking.assigned_to.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Status update / completion notes from the admin */}
                {booking.resolution_notes && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3 mt-3">
                    <p className="text-sm font-medium text-blue-800">
                      {booking.status === 'resolved' ? 'Completion notes' : 'Status update'}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">{booking.resolution_notes}</p>
                  </div>
                )}

                {/* Photos of completed work */}
                {booking.images && booking.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Photos
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {booking.images.map((img) => (
                        <a key={img.id} href={img.image} target="_blank" rel="noreferrer">
                          <img
                            src={img.image}
                            alt={img.caption || 'Service photo'}
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {booking.status === 'cancelled' && booking.admin_rejection_reason && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-3">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-sm text-red-700 mt-1">
                          {booking.admin_rejection_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost */}
                {booking.cost && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">
                      Cost: {formatCurrency(booking.cost)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MyServiceBookings;
