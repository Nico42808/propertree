/**
 * MyServiceBookings component - Display user's service bookings,
 * including cost-proposal ("quote") review and response.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Euro,
  ThumbsUp,
  ThumbsDown,
  MessageSquareWarning,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getServiceBookings,
  downloadServiceBookingFile,
  downloadServiceQuoteDocument,
  approveServiceQuote,
  rejectServiceQuote,
  requestServiceQuoteRevision,
} from '../../services/serviceService';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import TextArea from '../common/TextArea';
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

const QUOTE_BADGE = {
  pending: { variant: 'warning', label: 'Awaiting your review' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  revision_requested: { variant: 'info', label: 'Revision requested' },
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const MyServiceBookings = () => {
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['my-service-bookings'],
    queryFn: getServiceBookings,
  });

  const [downloadingId, setDownloadingId] = useState(null);

  // "Reject" and "Request revision" both need a required comment, so
  // they share one small modal; "commentAction" is 'reject' | 'revision'
  const [commentModal, setCommentModal] = useState(null); // { booking, action }
  const [commentNote, setCommentNote] = useState('');

  const handleDownload = async (file) => {
    setDownloadingId(file.id);
    try {
      await downloadServiceBookingFile(file.id, file.filename);
    } catch (err) {
      toast.error('Failed to download the file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadQuote = async (booking) => {
    setDownloadingId(`quote-${booking.id}`);
    try {
      await downloadServiceQuoteDocument(booking.id, booking.quote_document_filename || 'quote.pdf');
    } catch (err) {
      toast.error('Failed to download the quote document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const approveMutation = useMutation({
    mutationFn: (bookingId) => approveServiceQuote(bookingId),
    onSuccess: () => {
      toast.success('Quote approved — the admin has been notified.');
      queryClient.invalidateQueries(['my-service-bookings']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to approve the quote.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ bookingId, note }) => rejectServiceQuote(bookingId, note),
    onSuccess: () => {
      toast.success('Quote rejected — the admin has been notified.');
      queryClient.invalidateQueries(['my-service-bookings']);
      setCommentModal(null);
      setCommentNote('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to reject the quote.');
    },
  });

  const revisionMutation = useMutation({
    mutationFn: ({ bookingId, note }) => requestServiceQuoteRevision(bookingId, note),
    onSuccess: () => {
      toast.success('Revision request sent — the admin has been notified.');
      queryClient.invalidateQueries(['my-service-bookings']);
      setCommentModal(null);
      setCommentNote('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to send the revision request.');
    },
  });

  const openCommentModal = (booking, action) => {
    setCommentModal({ booking, action });
    setCommentNote('');
  };

  const handleCommentSubmit = () => {
    if (!commentNote.trim()) {
      toast.error('Please add a comment.');
      return;
    }
    if (!commentModal) return;
    if (commentModal.action === 'reject') {
      rejectMutation.mutate({ bookingId: commentModal.booking.id, note: commentNote.trim() });
    } else {
      revisionMutation.mutate({ bookingId: commentModal.booking.id, note: commentNote.trim() });
    }
  };

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

  return (
    <div className="space-y-4">
      {bookingsList.map((booking) => {
        const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.open;
        const priorityConfig = PRIORITY_CONFIG[booking.priority] || PRIORITY_CONFIG.medium;
        const quoteBadge = QUOTE_BADGE[booking.quote_status];
        const isRespondingToThis =
          approveMutation.isLoading && approveMutation.variables === booking.id;

        return (
          <Card key={booking.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
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

                {/* --------------------------------------------- */}
                {/* Cost proposal from admin - review & respond   */}
                {/* --------------------------------------------- */}
                {booking.quote_status && booking.quote_status !== 'none' && (
                  <div
                    className={`rounded-lg p-4 mt-3 border-l-4 ${
                      booking.quote_status === 'pending'
                        ? 'bg-yellow-50 border-yellow-400'
                        : booking.quote_status === 'approved'
                        ? 'bg-green-50 border-green-400'
                        : booking.quote_status === 'rejected'
                        ? 'bg-red-50 border-red-400'
                        : 'bg-orange-50 border-orange-400'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        Cost proposal: {formatCurrency(booking.quoted_cost)}
                      </p>
                      {quoteBadge && <Badge variant={quoteBadge.variant}>{quoteBadge.label}</Badge>}
                    </div>

                    {booking.quote_note && (
                      <p className="text-sm text-gray-700 mt-2">{booking.quote_note}</p>
                    )}

                    {booking.quote_document_download_url && (
                      <button
                        type="button"
                        onClick={() => handleDownloadQuote(booking)}
                        disabled={downloadingId === `quote-${booking.id}`}
                        className="inline-flex items-center gap-2 mt-2 text-xs text-propertree-green hover:underline disabled:opacity-60"
                      >
                        {downloadingId === `quote-${booking.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        {booking.quote_document_filename || 'Download quote document'}
                      </button>
                    )}

                    {booking.landlord_quote_response_note && booking.quote_status !== 'pending' && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500">Your comment:</p>
                        <p className="text-sm text-gray-700">{booking.landlord_quote_response_note}</p>
                      </div>
                    )}

                    {/* Action buttons - only while a response is needed */}
                    {booking.quote_status === 'pending' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="success"
                          leftIcon={<ThumbsUp className="w-4 h-4" />}
                          loading={isRespondingToThis}
                          onClick={() => approveMutation.mutate(booking.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<ThumbsDown className="w-4 h-4" />}
                          onClick={() => openCommentModal(booking, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<MessageSquareWarning className="w-4 h-4" />}
                          onClick={() => openCommentModal(booking, 'revision')}
                        >
                          Request New Quote
                        </Button>
                      </div>
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

                {/* Invoice / completion files - simple download, no preview */}
                {booking.images && booking.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Invoice
                    </p>
                    <div className="flex flex-col gap-2">
                      {booking.images.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id}
                          className="inline-flex items-center gap-2 w-fit px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                          {downloadingId === file.id ? (
                            <Loader2 className="w-4 h-4 text-propertree-green animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-propertree-green" />
                          )}
                          {file.filename || 'Download invoice'}
                        </button>
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

                {/* Final cost, once a quote has been approved / booking resolved */}
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

      {/* Reject / Request revision - comment modal (shared) */}
      <Modal
        isOpen={!!commentModal}
        onClose={() => {
          if (!rejectMutation.isLoading && !revisionMutation.isLoading) {
            setCommentModal(null);
          }
        }}
        title={commentModal?.action === 'reject' ? 'Reject cost proposal' : 'Request a new quote'}
        size="sm"
        closeOnOverlayClick={!rejectMutation.isLoading && !revisionMutation.isLoading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {commentModal?.action === 'reject'
              ? 'Let the admin know why you are rejecting this cost proposal.'
              : 'Let the admin know what you would like changed (e.g. a lower price).'}
          </p>
          <TextArea
            value={commentNote}
            onChange={(e) => setCommentNote(e.target.value)}
            placeholder={
              commentModal?.action === 'reject'
                ? 'e.g. This is too expensive for the scope of work.'
                : 'e.g. Could you send a cheaper quote for just the kitchen?'
            }
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommentModal(null)}
              disabled={rejectMutation.isLoading || revisionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={commentModal?.action === 'reject' ? 'danger' : 'primary'}
              loading={rejectMutation.isLoading || revisionMutation.isLoading}
              onClick={handleCommentSubmit}
            >
              {commentModal?.action === 'reject' ? 'Reject' : 'Send Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyServiceBookings;
