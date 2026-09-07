/**
 * ServiceBookings page - Admin interface for managing service bookings
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Calendar, Clock, MapPin, User, Wrench, PlayCircle, ImagePlus, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAllServiceBookings,
  confirmServiceBooking,
  rejectServiceBooking,
  startServiceProgress,
  completeServiceBooking,
} from '../../services/serviceService';
import { Container } from '../../components/layout';
import { Card, Button, Badge, Loading, EmptyState, Modal, TextArea } from '../../components/common';

const STATUS_CONFIG = {
  open: { variant: 'warning', label: 'Pending Confirmation' },
  assigned: { variant: 'info', label: 'Confirmed' },
  in_progress: { variant: 'primary', label: 'In Progress' },
  resolved: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Pending Confirmation' },
  { value: 'assigned', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

const PRIORITY_COLORS = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600 font-bold',
};

const ServiceBookings = () => {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');

  // Complete-booking modal state
  const [completingBooking, setCompletingBooking] = useState(null);
  const [completeNote, setCompleteNote] = useState('');
  const [completePhotos, setCompletePhotos] = useState([]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-service-bookings'],
    queryFn: getAllServiceBookings,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const confirmMutation = useMutation({
    mutationFn: ({ bookingId }) => confirmServiceBooking(bookingId),
    onMutate: ({ bookingId }) => setProcessingId(bookingId),
    onSuccess: () => {
      toast.success('Service booking confirmed successfully!');
      queryClient.invalidateQueries(['admin-service-bookings']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to confirm booking');
    },
    onSettled: () => setProcessingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ bookingId, reason }) => rejectServiceBooking(bookingId, reason),
    onMutate: ({ bookingId }) => setProcessingId(bookingId),
    onSuccess: () => {
      toast.success('Service booking rejected');
      queryClient.invalidateQueries(['admin-service-bookings']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject booking');
    },
    onSettled: () => setProcessingId(null),
  });

  const startProgressMutation = useMutation({
    mutationFn: ({ bookingId }) => startServiceProgress(bookingId),
    onMutate: ({ bookingId }) => setProcessingId(bookingId),
    onSuccess: () => {
      toast.success('Booking marked as in progress');
      queryClient.invalidateQueries(['admin-service-bookings']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update booking');
    },
    onSettled: () => setProcessingId(null),
  });

  const completeMutation = useMutation({
    mutationFn: ({ bookingId, note, photos }) => completeServiceBooking(bookingId, note, photos),
    onSuccess: () => {
      toast.success('Booking marked as completed. The landlord has been notified.');
      queryClient.invalidateQueries(['admin-service-bookings']);
      setCompletingBooking(null);
      setCompleteNote('');
      setCompletePhotos([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to complete booking');
    },
  });

  const handleConfirm = (bookingId) => {
    confirmMutation.mutate({ bookingId });
  };

  const handleReject = (bookingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && reason.trim()) {
      rejectMutation.mutate({ bookingId, reason: reason.trim() });
    } else if (reason !== null) {
      toast.error('Rejection reason is required');
    }
  };

  const handleStartProgress = (bookingId) => {
    startProgressMutation.mutate({ bookingId });
  };

  const openCompleteModal = (booking) => {
    setCompletingBooking(booking);
    setCompleteNote('');
    setCompletePhotos([]);
  };

  const handleCompleteSubmit = () => {
    if (!completingBooking) return;
    completeMutation.mutate({
      bookingId: completingBooking.id,
      note: completeNote,
      photos: completePhotos,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = timeString.split(':');
    if (time.length >= 2) {
      const hours = parseInt(time[0], 10);
      const minutes = time[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  if (isLoading) {
    return (
      <Container className="py-8">
        <Loading message="Loading service booking requests..." />
      </Container>
    );
  }

  const bookingsList = Array.isArray(bookings) ? bookings : [];

  const filteredBookings = bookingsList.filter((b) => {
    if (statusFilter === 'active') return ['open', 'assigned', 'in_progress'].includes(b.status);
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const pendingCount = bookingsList.filter((b) => b.status === 'open').length;
  const inProgressCount = bookingsList.filter((b) => b.status === 'in_progress').length;
  const completedCount = bookingsList.filter((b) => b.status === 'resolved').length;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Booking Requests</h1>
        <p className="text-gray-600 mt-2">
          Review, progress, and complete landlord service booking requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Confirmation</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-propertree-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          message="No service bookings here"
          description="Nothing matches this filter right now"
        />
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.open;
            const priorityColor = PRIORITY_COLORS[booking.priority] || PRIORITY_COLORS.medium;
            const isProcessing = processingId === booking.id;

            return (
              <Card key={booking.id}>
                <Card.Body>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                      {/* Header with Title and Badges */}
                      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900">{booking.title}</h3>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        <span className={`text-sm font-medium ${priorityColor}`}>
                          {booking.priority.toUpperCase()} Priority
                        </span>
                      </div>

                      {/* Service Details */}
                      {booking.service_catalog && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-900">
                              {booking.service_catalog.name}
                            </p>
                          </div>
                          <p className="text-xs text-blue-700 ml-7">
                            Category: {booking.service_catalog.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      )}

                      {/* Property and Landlord Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Property</span>
                          </div>
                          <div className="ml-6">
                            <p className="text-sm font-medium text-gray-900">
                              {booking.rental_property?.title || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.rental_property?.address && `${booking.rental_property.address}, `}
                              {booking.rental_property?.city || ''}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Landlord</span>
                          </div>
                          <div className="ml-6">
                            <p className="text-sm font-medium text-gray-900">
                              {booking.reported_by?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Schedule Information */}
                      {(booking.requested_date || booking.requested_time) && (
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
                          {booking.requested_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Date:</span>
                              <span>{formatDate(booking.requested_date)}</span>
                            </div>
                          )}
                          {booking.requested_time && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Time:</span>
                              <span>{formatTime(booking.requested_time)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {booking.description && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                            {booking.description}
                          </p>
                        </div>
                      )}

                      {/* Progress / Completion notes */}
                      {booking.resolution_notes && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {booking.status === 'resolved' ? 'Completion notes' : 'Status update'}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                            {booking.resolution_notes}
                          </p>
                        </div>
                      )}

                      {/* Completion photos */}
                      {booking.images && booking.images.length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Photos
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {booking.images.map((img) => (
                              <a key={img.id} href={img.image} target="_blank" rel="noreferrer">
                                <img
                                  src={img.image}
                                  alt={img.caption || 'Service photo'}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:flex-shrink-0">
                      <div className="flex flex-col gap-3 lg:min-w-[160px]">
                        {booking.status === 'open' && !booking.admin_confirmed_at && (
                          <>
                            <Button
                              size="md"
                              variant="success"
                              onClick={() => handleConfirm(booking.id)}
                              disabled={isProcessing}
                              leftIcon={<CheckCircle className="w-4 h-4" />}
                              className="w-full lg:w-auto"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="md"
                              variant="danger"
                              onClick={() => handleReject(booking.id)}
                              disabled={isProcessing}
                              leftIcon={<XCircle className="w-4 h-4" />}
                              className="w-full lg:w-auto"
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {booking.status === 'assigned' && (
                          <>
                            <Button
                              size="md"
                              variant="primary"
                              onClick={() => handleStartProgress(booking.id)}
                              disabled={isProcessing}
                              leftIcon={<PlayCircle className="w-4 h-4" />}
                              className="w-full lg:w-auto"
                            >
                              Start Progress
                            </Button>
                            <Button
                              size="md"
                              variant="success"
                              onClick={() => openCompleteModal(booking)}
                              leftIcon={<ImagePlus className="w-4 h-4" />}
                              className="w-full lg:w-auto"
                            >
                              Mark Complete
                            </Button>
                          </>
                        )}

                        {booking.status === 'in_progress' && (
                          <Button
                            size="md"
                            variant="success"
                            onClick={() => openCompleteModal(booking)}
                            leftIcon={<ImagePlus className="w-4 h-4" />}
                            className="w-full lg:w-auto"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mark Complete Modal */}
      <Modal
        isOpen={!!completingBooking}
        onClose={() => !completeMutation.isLoading && setCompletingBooking(null)}
        title="Mark service as complete"
        size="md"
        closeOnOverlayClick={!completeMutation.isLoading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will mark <strong>{completingBooking?.title}</strong> as completed and email the
            landlord to let them know.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion notes
            </label>
            <TextArea
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              placeholder="e.g. Kitchen and bathroom deep cleaned, all surfaces sanitized."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos of completed work
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setCompletePhotos(Array.from(e.target.files || []))}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-propertree-green-50 file:text-propertree-green hover:file:bg-propertree-green-100"
            />
            {completePhotos.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{completePhotos.length} photo(s) selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCompletingBooking(null)}
              disabled={completeMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="success"
              loading={completeMutation.isLoading}
              onClick={handleCompleteSubmit}
            >
              Mark Complete
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default ServiceBookings;
