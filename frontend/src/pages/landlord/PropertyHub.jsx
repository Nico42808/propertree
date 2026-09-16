import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Home, Bed, Bath, Wrench, FileText, CheckCircle,
  Clock, Plus, Download, Trash2, Upload, Pencil, Calendar, DollarSign,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Container } from '../../components/layout';
import { Card, Button, Badge, Loading, Input, Select, TextArea } from '../../components/common';
import api from '../../services/api';
import { getServiceBookings } from '../../services/serviceService';
import {
  getPropertyDocuments,
  uploadPropertyDocument,
  deletePropertyDocument,
  downloadPropertyDocument,
} from '../../services/propertyDocumentService';
import { formatCurrency } from '../../utils/formatters';

const STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_approval: { label: 'Pending Review', variant: 'warning' },
  approved: { label: 'Active', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

const SERVICE_STATUS = {
  open: { label: 'Requested', variant: 'warning' },
  assigned: { label: 'Scheduled', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'primary' },
  resolved: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

const DOCUMENT_CATEGORIES = [
  { value: 'management_agreement', label: 'Management Agreement' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'permits', label: 'Permits' },
  { value: 'warranties', label: 'Warranties' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'other', label: 'Other' },
];

const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const serviceProgress = (service) => {
  const quoteApproved = service.quote_status === 'approved';
  return [
    { label: 'Requested', done: true },
    { label: 'Quote', done: service.quote_status && service.quote_status !== 'none' },
    { label: 'Approved', done: quoteApproved || ['assigned', 'in_progress', 'resolved'].includes(service.status) },
    { label: 'Scheduled', done: ['assigned', 'in_progress', 'resolved'].includes(service.status) },
    { label: 'In Progress', done: ['in_progress', 'resolved'].includes(service.status) },
    { label: 'Completed', done: service.status === 'resolved' },
  ];
};

const PropertyHub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [services, setServices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [documentForm, setDocumentForm] = useState({ title: '', category: 'management_agreement', notes: '', file: null });

  const loadData = async () => {
    setLoading(true);
    try {
      const [propertyResponse, serviceData, documentData] = await Promise.all([
        api.get(`/properties/landlord/${id}/`),
        getServiceBookings(),
        getPropertyDocuments(id),
      ]);
      setProperty(propertyResponse.data);
      const allServices = Array.isArray(serviceData) ? serviceData : [];
      setServices(allServices.filter((item) => String(item.rental_property?.id || item.rental_property) === String(id)));
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to Load Property Workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const activeServices = useMemo(() => services.filter((item) => !['resolved', 'cancelled', 'closed'].includes(item.status)), [services]);
  const completedServices = useMemo(() => services.filter((item) => item.status === 'resolved'), [services]);
  const serviceValue = useMemo(() => services.reduce((sum, item) => sum + Number(item.cost || item.quoted_cost || 0), 0), [services]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!documentForm.title.trim() || !documentForm.file) {
      toast.error('Please Add a Document Title and File');
      return;
    }
    setUploading(true);
    try {
      const created = await uploadPropertyDocument(id, documentForm);
      setDocuments((current) => [created, ...current]);
      setDocumentForm({ title: '', category: 'management_agreement', notes: '', file: null });
      event.target.reset();
      toast.success('Document Uploaded');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to Upload Document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document) => {
    setDownloadingId(document.id);
    try {
      await downloadPropertyDocument(document.id, document.title);
    } catch {
      toast.error('Failed to Download Document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Delete ${document.title}?`)) return;
    try {
      await deletePropertyDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      toast.success('Document Deleted');
    } catch {
      toast.error('Failed to Delete Document');
    }
  };

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (!property) return <Container className="py-8"><p className="text-gray-600">Property Not Found</p></Container>;

  const status = STATUS_CONFIG[property.status] || { label: titleCase(property.status), variant: 'secondary' };
  const photo = property.primary_photo || (Array.isArray(property.photos) && property.photos.length ? (typeof property.photos[0] === 'string' ? property.photos[0] : property.photos[0]?.preview || property.photos[0]?.url) : null);

  return (
    <Container className="py-8">
      <button type="button" onClick={() => navigate('/landlord/properties')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-propertree-green mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to My Properties
      </button>

      <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm mb-8">
        <div className="grid lg:grid-cols-[360px_1fr]">
          <div className="h-64 lg:h-full bg-gray-100">
            {photo ? <img src={photo} alt={property.title} className="w-full h-full object-cover" /> : <div className="w-full h-full min-h-64 flex items-center justify-center"><Home className="w-16 h-16 text-gray-300" /></div>}
          </div>
          <div className="p-6 lg:p-8 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3"><Badge variant={status.variant}>{status.label}</Badge><span className="text-sm text-gray-500">{titleCase(property.property_type)}</span></div>
              <h1 className="text-3xl lg:text-4xl font-bold text-propertree-dark">{property.title}</h1>
              <p className="mt-3 flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" />{property.address}, {property.city}, {property.state}, {property.country}</p>
              {property.description && <p className="mt-5 text-gray-700 max-w-3xl">{property.description}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/landlord/services?property=${property.id}`}><Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Book a Service</Button></Link>
              <Link to={`/landlord/properties/${property.id}/edit`}><Button variant="outline" leftIcon={<Pencil className="w-4 h-4" />}>Edit Property</Button></Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card><Card.Body><p className="text-sm text-gray-500">Open Services</p><p className="text-3xl font-bold mt-1">{activeServices.length}</p></Card.Body></Card>
        <Card><Card.Body><p className="text-sm text-gray-500">Documents</p><p className="text-3xl font-bold mt-1">{documents.length}</p></Card.Body></Card>
        <Card><Card.Body><p className="text-sm text-gray-500">Completed Services</p><p className="text-3xl font-bold mt-1">{completedServices.length}</p></Card.Body></Card>
        <Card><Card.Body><p className="text-sm text-gray-500">Service Value</p><p className="text-2xl font-bold mt-1">{formatCurrency(serviceValue)}</p></Card.Body></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <Card.Header><Card.Title className="flex items-center gap-2"><Wrench className="w-5 h-5" />Service Activity</Card.Title></Card.Header>
          <Card.Body>
            {services.length === 0 ? <div className="py-10 text-center text-gray-500">No Services Booked for This Property Yet</div> : (
              <div className="space-y-5">
                {services.map((service) => {
                  const serviceStatus = SERVICE_STATUS[service.status] || SERVICE_STATUS.open;
                  const steps = serviceProgress(service);
                  return <div key={service.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-semibold text-gray-900">{service.service_catalog?.name || service.title}</h3><p className="text-sm text-gray-500 mt-1">{service.requested_date ? `Preferred Date: ${new Date(service.requested_date).toLocaleDateString('en-CA')}` : 'Date To Be Coordinated'}</p></div>
                      <Badge variant={serviceStatus.variant}>{serviceStatus.label}</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                      {steps.map((step) => <div key={step.label} className="text-center"><div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center ${step.done ? 'bg-propertree-green text-white' : 'bg-gray-100 text-gray-400'}`}>{step.done ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</div><p className="text-[11px] mt-1 text-gray-500">{step.label}</p></div>)}
                    </div>
                    {(service.quoted_cost || service.cost) && <p className="mt-4 text-sm font-medium flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatCurrency(service.cost || service.quoted_cost)}</p>}
                  </div>;
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header><Card.Title>Property Information</Card.Title></Card.Header>
          <Card.Body><div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4"><span className="text-gray-500">Property Type</span><strong>{titleCase(property.property_type)}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Bedrooms</span><strong className="flex items-center gap-1"><Bed className="w-4 h-4" />{property.bedrooms}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Bathrooms</span><strong className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Postal Code</span><strong>{property.postal_code || '—'}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Last Updated</span><strong>{property.updated_at ? new Date(property.updated_at).toLocaleDateString('en-CA') : '—'}</strong></div>
          </div></Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header><Card.Title className="flex items-center gap-2"><FileText className="w-5 h-5" />Property Documents</Card.Title></Card.Header>
        <Card.Body>
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div>
              {documents.length === 0 ? <div className="py-8 text-center text-gray-500">No Documents Uploaded Yet</div> : <div className="divide-y divide-gray-100">
                {documents.map((document) => <div key={document.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0"><p className="font-medium text-gray-900 truncate">{document.title}</p><p className="text-xs text-gray-500 mt-1">{document.category_display || titleCase(document.category)} · {new Date(document.created_at).toLocaleDateString('en-CA')}</p>{document.notes && <p className="text-sm text-gray-600 mt-1">{document.notes}</p>}</div>
                  <div className="flex gap-2 flex-shrink-0"><Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} loading={downloadingId === document.id} onClick={() => handleDownload(document)}>Download</Button><Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(document)}>Delete</Button></div>
                </div>)}
              </div>}
            </div>

            <form onSubmit={handleUpload} className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4" />Upload Document</h3>
              <Input value={documentForm.title} onChange={(event) => setDocumentForm((current) => ({ ...current, title: event.target.value }))} placeholder="Document Title" />
              <Select value={documentForm.category} onChange={(event) => setDocumentForm((current) => ({ ...current, category: event.target.value }))} options={DOCUMENT_CATEGORIES} />
              <TextArea value={documentForm.notes} onChange={(event) => setDocumentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional Notes" rows={3} />
              <input type="file" onChange={(event) => setDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} className="block w-full text-sm text-gray-600" />
              <Button type="submit" variant="primary" loading={uploading} className="w-full">Upload Document</Button>
            </form>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PropertyHub;
