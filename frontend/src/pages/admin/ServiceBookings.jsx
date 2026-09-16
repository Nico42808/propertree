/**
 * Service Requests - Admin interface for managing landlord service requests
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Calendar, Clock, MapPin, User, Wrench, PlayCircle,
  ImagePlus, FileText, Download, Loader2, DollarSign,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAllServiceBookings,
  confirmServiceBooking,
  rejectServiceBooking,
  startServiceProgress,
  completeServiceBooking,
  downloadServiceBookingFile,
  sendServiceQuote,
  downloadServiceQuoteDocument,
} from '../../services/serviceService';
import { Container } from '../../components/layout';
import { Card, Button, Badge, Loading, EmptyState, Modal, TextArea, Input } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';

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

const ServiceBookings = () => {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [quotingRequest, setQuotingRequest] = useState(null);
  const [quoteCost, setQuoteCost] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteDocument, setQuoteDocument] = useState(null);
  const [completingRequest, setCompletingRequest] = useState(null);
  const [completeNote, setCompleteNote] = useState('');
  const [completeFiles, setCompleteFiles] = useState([]);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-service-bookings'],
    queryFn: getAllServiceBookings,
    refetchInterval: 30000,
  });

  const refresh = () => queryClient.invalidateQueries(['admin-service-bookings']);

  const confirmMutation = useMutation({
    mutationFn: ({ id }) => confirmServiceBooking(id),
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: () => { toast.success('Service Request Confirmed'); refresh(); },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to Confirm Service Request'),
    onSettled: () => setProcessingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectServiceBooking(id, reason),
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: () => { toast.success('Service Request Rejected'); refresh(); },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to Reject Service Request'),
    onSettled: () => setProcessingId(null),
  });

  const startMutation = useMutation({
    mutationFn: ({ id }) => startServiceProgress(id),
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: () => { toast.success('Service Marked as In Progress'); refresh(); },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to Update Service Request'),
    onSettled: () => setProcessingId(null),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, note, photos }) => completeServiceBooking(id, note, photos),
    onSuccess: () => {
      toast.success('Service Completed. The Landlord Has Been Notified.');
      refresh(); setCompletingRequest(null); setCompleteNote(''); setCompleteFiles([]);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to Complete Service'),
  });

  const quoteMutation = useMutation({
    mutationFn: ({ id, cost, note, document }) => sendServiceQuote(id, cost, note, document),
    onSuccess: () => {
      toast.success('Quote Sent to the Landlord');
      refresh(); setQuotingRequest(null); setQuoteCost(''); setQuoteNote(''); setQuoteDocument(null);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to Send Quote'),
  });

  const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Set';

  const handleReject = (id) => {
    const reason = window.prompt('Please Provide a Reason for Rejection:');
    if (reason?.trim()) rejectMutation.mutate({ id, reason: reason.trim() });
  };

  const handleDownload = async (file) => {
    setDownloadingId(file.id);
    try { await downloadServiceBookingFile(file.id, file.filename); }
    catch { toast.error('Failed to Download the File'); }
    finally { setDownloadingId(null); }
  };

  const handleQuoteDocument = async (request) => {
    setDownloadingId(`quote-${request.id}`);
    try { await downloadServiceQuoteDocument(request.id, request.quote_document_filename || 'quote.pdf'); }
    catch { toast.error('Failed to Download the Quote Document'); }
    finally { setDownloadingId(null); }
  };

  if (isLoading) return <Container className="py-8"><Loading message="Loading Service Requests..." /></Container>;

  const list = Array.isArray(requests) ? requests : [];
  const filtered = list.filter((request) => {
    if (statusFilter === 'active') return ['open', 'assigned', 'in_progress'].includes(request.status);
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });
  const pending = list.filter((item) => item.status === 'open').length;
  const inProgress = list.filter((item) => item.status === 'in_progress').length;
  const completed = list.filter((item) => item.status === 'resolved').length;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-gray-600 mt-2">Review, Quote, Manage, and Complete Property Service Requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">Pending Confirmation</p><p className="text-3xl font-bold mt-1">{pending}</p></div><Clock className="w-9 h-9 text-yellow-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">In Progress</p><p className="text-3xl font-bold mt-1">{inProgress}</p></div><PlayCircle className="w-9 h-9 text-blue-600" /></div></Card.Body></Card>
        <Card><Card.Body><div className="flex justify-between items-center"><div><p className="text-sm text-gray-600">Completed</p><p className="text-3xl font-bold mt-1">{completed}</p></div><CheckCircle className="w-9 h-9 text-green-600" /></div></Card.Body></Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">{FILTERS.map((filter) => <button key={filter.value} onClick={() => setStatusFilter(filter.value)} className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === filter.value ? 'bg-propertree-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{filter.label}</button>)}</div>

      {filtered.length === 0 ? <EmptyState message="No Service Requests Here" description="Nothing Matches This Filter Right Now" /> : (
        <div className="space-y-6">
          {filtered.map((request) => {
            const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.open;
            const isProcessing = processingId === request.id;
            return (
              <Card key={request.id}><Card.Body>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 pb-4 border-b"><h3 className="text-xl font-semibold">{request.title}</h3><Badge variant={status.variant}>{status.label}</Badge><span className="text-sm font-medium text-gray-600">{String(request.priority || 'medium').toUpperCase()} Priority</span></div>
                    {request.service_catalog && <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4"><div className="flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /><strong className="text-blue-900">{request.service_catalog.name}</strong></div><p className="text-xs text-blue-700 ml-7 mt-1">Category: {String(request.service_catalog.category || 'Other').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</p></div>}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" />Property</p><p className="ml-6 mt-1 font-medium">{request.rental_property?.title || 'N/A'}</p><p className="ml-6 text-xs text-gray-500">{request.rental_property?.city || ''}</p></div>
                      <div><p className="text-sm text-gray-600 flex items-center gap-2"><User className="w-4 h-4" />Landlord</p><p className="ml-6 mt-1 font-medium">{request.reported_by?.email || 'N/A'}</p></div>
                    </div>
                    {request.requested_date && <div className="text-sm text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4" /><strong>Preferred Date:</strong> {formatDate(request.requested_date)}</div>}
                    {request.description && <div className="pt-3 border-t"><p className="text-sm font-medium mb-2">Description</p><p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{request.description}</p></div>}
                    {request.quote_status !== 'none' && <div className="pt-3 border-t"><div className="rounded-lg p-3 bg-yellow-50 border-l-4 border-yellow-400"><div className="flex justify-between flex-wrap gap-2"><p className="font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Cost Proposal: {formatCurrency(Number(request.quoted_cost || 0), 'CAD $', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><Badge variant={request.quote_status === 'approved' ? 'success' : request.quote_status === 'rejected' ? 'danger' : 'warning'}>{String(request.quote_status).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</Badge></div>{request.quote_note && <p className="text-sm text-gray-600 mt-2">{request.quote_note}</p>}{request.quote_document_download_url && <button type="button" onClick={() => handleQuoteDocument(request)} className="text-xs text-propertree-green mt-2 inline-flex gap-2 items-center"><Download className="w-3 h-3" />{request.quote_document_filename || 'Download Quote Document'}</button>}</div></div>}
                    {request.images?.length > 0 && <div className="pt-3 border-t"><p className="text-sm font-medium mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Invoice</p>{request.images.map((file) => <button key={file.id} type="button" onClick={() => handleDownload(file)} disabled={downloadingId === file.id} className="mr-2 mb-2 px-3 py-2 border rounded-lg text-sm inline-flex gap-2 items-center">{downloadingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{file.filename || 'Download Invoice'}</button>)}</div>}
                  </div>

                  <div className="lg:w-44 flex flex-col gap-3">
                    {['none', 'rejected', 'revision_requested'].includes(request.quote_status) && !['resolved', 'closed', 'cancelled'].includes(request.status) && <Button variant="outline" leftIcon={<DollarSign className="w-4 h-4" />} onClick={() => { setQuotingRequest(request); setQuoteCost(request.quoted_cost || ''); setQuoteNote(''); setQuoteDocument(null); }}>{request.quote_status === 'none' ? 'Send a Quote' : 'Send a New Quote'}</Button>}
                    {request.status === 'open' && !request.admin_confirmed_at && <><Button variant="success" leftIcon={<CheckCircle className="w-4 h-4" />} disabled={isProcessing} onClick={() => confirmMutation.mutate({ id: request.id })}>Confirm</Button><Button variant="danger" leftIcon={<XCircle className="w-4 h-4" />} disabled={isProcessing} onClick={() => handleReject(request.id)}>Reject</Button></>}
                    {request.status === 'assigned' && <><Button variant="primary" leftIcon={<PlayCircle className="w-4 h-4" />} disabled={isProcessing} onClick={() => startMutation.mutate({ id: request.id })}>Start Service</Button><Button variant="success" leftIcon={<ImagePlus className="w-4 h-4" />} onClick={() => { setCompletingRequest(request); setCompleteNote(''); setCompleteFiles([]); }}>Mark Complete</Button></>}
                    {request.status === 'in_progress' && <Button variant="success" leftIcon={<ImagePlus className="w-4 h-4" />} onClick={() => { setCompletingRequest(request); setCompleteNote(''); setCompleteFiles([]); }}>Mark Complete</Button>}
                  </div>
                </div>
              </Card.Body></Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!completingRequest} onClose={() => !completeMutation.isLoading && setCompletingRequest(null)} title="Mark Service as Complete" size="md">
        <div className="space-y-4"><p className="text-sm text-gray-600">Complete <strong>{completingRequest?.title}</strong> and notify the landlord.</p><TextArea value={completeNote} onChange={(e) => setCompleteNote(e.target.value)} placeholder="Completion Notes" rows={4} /><div><label className="block text-sm font-medium mb-1">Invoice or Completion File</label><input type="file" accept="image/*,.pdf,application/pdf" multiple onChange={(e) => setCompleteFiles(Array.from(e.target.files || []))} /></div><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setCompletingRequest(null)}>Cancel</Button><Button variant="success" loading={completeMutation.isLoading} onClick={() => completeMutation.mutate({ id: completingRequest.id, note: completeNote, photos: completeFiles })}>Mark Complete</Button></div></div>
      </Modal>

      <Modal isOpen={!!quotingRequest} onClose={() => !quoteMutation.isLoading && setQuotingRequest(null)} title="Send a Cost Proposal" size="md">
        <div className="space-y-4"><p className="text-sm text-gray-600">Send a quote for <strong>{quotingRequest?.title}</strong>. The landlord can approve, reject, or request a revision.</p><div><label className="block text-sm font-medium mb-1">Cost (CAD)</label><Input type="number" min="0" step="0.01" value={quoteCost} onChange={(e) => setQuoteCost(e.target.value)} placeholder="e.g. 200" /></div><TextArea value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} placeholder="e.g. The requested service is quoted at CAD $200." rows={4} /><div><label className="block text-sm font-medium mb-1">Cost Breakdown (PDF, Optional)</label><input type="file" accept=".pdf,application/pdf,image/*" onChange={(e) => setQuoteDocument((e.target.files || [])[0] || null)} /></div><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setQuotingRequest(null)}>Cancel</Button><Button variant="success" loading={quoteMutation.isLoading} onClick={() => { if (!quoteCost || Number(quoteCost) <= 0) return toast.error('Please Enter a Valid Cost'); quoteMutation.mutate({ id: quotingRequest.id, cost: quoteCost, note: quoteNote, document: quoteDocument }); }}>Send a Quote</Button></div></div>
      </Modal>
    </Container>
  );
};

export default ServiceBookings;
