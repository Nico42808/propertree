import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, Calendar, CheckCircle, Clock, Download, FileText,
  Loader2, MapPin, MessageSquareWarning, ThumbsDown, ThumbsUp, Wrench,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  approveServiceQuote,
  downloadServiceBookingFile,
  downloadServiceQuoteDocument,
  getServiceBookings,
  rejectServiceQuote,
  requestServiceQuoteRevision,
} from '../../services/serviceService';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import TextArea from '../common/TextArea';

const STATUS_CONFIG = {
  open: { variant: 'warning', label: 'Requested' },
  assigned: { variant: 'info', label: 'Scheduled' },
  in_progress: { variant: 'primary', label: 'In Progress' },
  resolved: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const QUOTE_CONFIG = {
  pending: { variant: 'warning', label: 'Quote Ready for Review' },
  approved: { variant: 'success', label: 'Quote Approved' },
  rejected: { variant: 'danger', label: 'Quote Rejected' },
  revision_requested: { variant: 'info', label: 'Revision Requested' },
};

const progressSteps = (service) => [
  { label: 'Requested', done: true },
  { label: 'Quote Sent', done: Boolean(service.quote_status && service.quote_status !== 'none') },
  { label: 'Approved', done: service.quote_status === 'approved' || ['assigned', 'in_progress', 'resolved'].includes(service.status) },
  { label: 'Scheduled', done: ['assigned', 'in_progress', 'resolved'].includes(service.status) },
  { label: 'In Progress', done: ['in_progress', 'resolved'].includes(service.status) },
  { label: 'Completed', done: service.status === 'resolved' },
];

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
  : 'To Be Coordinated';

const MyServices = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('active');
  const [downloadingId, setDownloadingId] = useState(null);
  const [commentModal, setCommentModal] = useState(null);
  const [commentNote, setCommentNote] = useState('');

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['my-service-bookings'],
    queryFn: getServiceBookings,
  });

  const serviceList = Array.isArray(services) ? services : [];
  const activeServices = useMemo(
    () => serviceList.filter((service) => !['resolved', 'cancelled', 'closed'].includes(service.status)),
    [serviceList]
  );
  const completedServices = useMemo(
    () => serviceList.filter((service) => ['resolved', 'cancelled', 'closed'].includes(service.status)),
    [serviceList]
  );
  const pendingQuotes = useMemo(
    () => serviceList.filter((service) => service.quote_status === 'pending').length,
    [serviceList]
  );
  const displayed = view === 'active' ? activeServices : completedServices;

  const refresh = () => queryClient.invalidateQueries(['my-service-bookings']);

  const approveMutation = useMutation({
    mutationFn: (serviceId) => approveServiceQuote(serviceId),
    onSuccess: () => { toast.success('Quote Approved'); refresh(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to Approve Quote'),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ serviceId, note }) => rejectServiceQuote(serviceId, note),
    onSuccess: () => { toast.success('Quote Rejected'); refresh(); setCommentModal(null); setCommentNote(''); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to Reject Quote'),
  });
  const revisionMutation = useMutation({
    mutationFn: ({ serviceId, note }) => requestServiceQuoteRevision(serviceId, note),
    onSuccess: () => { toast.success('Revision Request Sent'); refresh(); setCommentModal(null); setCommentNote(''); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to Request Revision'),
  });

  const downloadFile = async (file) => {
    setDownloadingId(file.id);
    try { await downloadServiceBookingFile(file.id, file.filename); }
    catch { toast.error('Failed to Download File'); }
    finally { setDownloadingId(null); }
  };

  const downloadQuote = async (service) => {
    setDownloadingId(`quote-${service.id}`);
    try { await downloadServiceQuoteDocument(service.id, service.quote_document_filename || 'quote.pdf'); }
    catch { toast.error('Failed to Download Quote'); }
    finally { setDownloadingId(null); }
  };

  const submitComment = () => {
    if (!commentNote.trim() || !commentModal) {
      toast.error('Please Add a Comment');
      return;
    }
    const payload = { serviceId: commentModal.service.id, note: commentNote.trim() };
    if (commentModal.action === 'reject') rejectMutation.mutate(payload);
    else revisionMutation.mutate(payload);
  };

  if (isLoading) return <div className="py-12 text-center text-gray-500">Loading Your Services...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Failed to Load Your Services</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><Card.Body><p className="text-sm text-gray-500">Active Services</p><p className="text-3xl font-bold mt-1">{activeServices.length}</p></Card.Body></Card>
        <Card><Card.Body><p className="text-sm text-gray-500">Quotes to Review</p><p className="text-3xl font-bold mt-1">{pendingQuotes}</p></Card.Body></Card>
        <Card><Card.Body><p className="text-sm text-gray-500">Completed Services</p><p className="text-3xl font-bold mt-1">{completedServices.filter((item) => item.status === 'resolved').length}</p></Card.Body></Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setView('active')} className={`px-4 py-3 text-sm font-semibold border-b-2 ${view === 'active' ? 'border-propertree-green text-propertree-green' : 'border-transparent text-gray-500'}`}>Active Services</button>
        <button onClick={() => setView('history')} className={`px-4 py-3 text-sm font-semibold border-b-2 ${view === 'history' ? 'border-propertree-green text-propertree-green' : 'border-transparent text-gray-500'}`}>Service History</button>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">{view === 'active' ? 'No Active Services' : 'No Service History Yet'}</p>
          <p className="text-sm text-gray-500 mt-1">{view === 'active' ? 'Book a service from the Service Catalog whenever your property needs support.' : 'Completed services will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayed.map((service) => {
            const status = STATUS_CONFIG[service.status] || STATUS_CONFIG.open;
            const quote = QUOTE_CONFIG[service.quote_status];
            const steps = progressSteps(service);
            const serviceName = service.service_catalog?.name || service.title || 'Property Service';
            return (
              <Card key={service.id}>
                <Card.Body className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{serviceName}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {quote && <Badge variant={quote.variant}>{quote.label}</Badge>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{service.rental_property?.title || 'Property'}</span>
                          <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(service.requested_date)}</span>
                        </div>
                      </div>
                      {(service.cost || service.quoted_cost) && <div className="font-semibold text-propertree-dark">{formatCurrency(service.cost || service.quoted_cost)}</div>}
                    </div>

                    {service.description && <p className="text-sm text-gray-600">{service.description}</p>}

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 rounded-xl bg-gray-50 p-3">
                      {steps.map((step) => (
                        <div key={step.label} className="text-center">
                          <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${step.done ? 'bg-propertree-green text-white' : 'bg-white border border-gray-200 text-gray-300'}`}>
                            {step.done ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">{step.label}</p>
                        </div>
                      ))}
                    </div>

                    {service.quote_status && service.quote_status !== 'none' && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Cost Proposal</p><p className="text-lg font-semibold mt-1">{formatCurrency(service.quoted_cost || 0)}</p></div>
                          {service.quote_document_download_url && <Button size="sm" variant="outline" leftIcon={downloadingId === `quote-${service.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} onClick={() => downloadQuote(service)}>Quote Document</Button>}
                        </div>
                        {service.quote_note && <p className="text-sm text-gray-600 mt-3">{service.quote_note}</p>}
                        {service.quote_status === 'pending' && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button size="sm" variant="success" leftIcon={<ThumbsUp className="w-4 h-4" />} onClick={() => approveMutation.mutate(service.id)}>Approve Quote</Button>
                            <Button size="sm" variant="danger" leftIcon={<ThumbsDown className="w-4 h-4" />} onClick={() => { setCommentModal({ service, action: 'reject' }); setCommentNote(''); }}>Reject</Button>
                            <Button size="sm" variant="outline" leftIcon={<MessageSquareWarning className="w-4 h-4" />} onClick={() => { setCommentModal({ service, action: 'revision' }); setCommentNote(''); }}>Request Revision</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {service.resolution_notes && <div className="rounded-lg bg-blue-50 border-l-4 border-blue-400 p-3"><p className="text-sm font-medium text-blue-800">{service.status === 'resolved' ? 'Completion Notes' : 'Service Update'}</p><p className="text-sm text-blue-700 mt-1">{service.resolution_notes}</p></div>}
                    {service.status === 'cancelled' && service.admin_rejection_reason && <div className="rounded-lg bg-red-50 border-l-4 border-red-400 p-3 flex gap-2"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" /><p className="text-sm text-red-700">{service.admin_rejection_reason}</p></div>}

                    {service.images?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Invoices & Completion Files</p>
                        <div className="flex flex-wrap gap-2">{service.images.map((file) => <Button key={file.id} size="sm" variant="outline" leftIcon={downloadingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} onClick={() => downloadFile(file)}>{file.filename || 'Download File'}</Button>)}</div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!commentModal} onClose={() => setCommentModal(null)} title={commentModal?.action === 'reject' ? 'Reject Quote' : 'Request Quote Revision'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Add a short note so the service team knows what should change.</p>
          <TextArea value={commentNote} onChange={(event) => setCommentNote(event.target.value)} rows={4} placeholder="Your Comment" />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCommentModal(null)}>Cancel</Button><Button variant="primary" onClick={submitComment} loading={rejectMutation.isLoading || revisionMutation.isLoading}>Send</Button></div>
        </div>
      </Modal>
    </div>
  );
};

export default MyServices;
