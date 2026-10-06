/**
 * Landlord Properties Page - Owner-focused property management overview
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bath, Bed, FileText, Home, MapPin, Plus, Trash2, Upload, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Container } from '../../components/layout';
import { useAuth } from '../../hooks';
import api from '../../services/api';
import userService from '../../services/userService';
import { Badge, Button, Card, EmptyState, Loading } from '../../components/common';

const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const Properties = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const canAddProperty = Boolean(user?.is_verified);
  const hasIdentityDocument = Boolean(user?.has_identity_document);
  const identityReuploadRequired = Boolean(user?.identity_document_reupload_required);
  const identityInputRef = useRef(null);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/landlord/`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to Load Properties');
      const data = await response.json();
      const propertyList = data.results || data;
      setProperties(propertyList);
      setStats({
        total: propertyList.length,
        draft: propertyList.filter((property) => property.status === 'draft').length,
        pending: propertyList.filter((property) => property.status === 'pending_approval').length,
        approved: propertyList.filter((property) => property.status === 'approved').length,
        rejected: propertyList.filter((property) => property.status === 'rejected').length,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to Load Properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleIdentityUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please Upload a PDF, JPG or PNG File');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('ID Document Must Be Smaller Than 10 MB');
      return;
    }

    setUploadingIdentity(true);
    try {
      const updatedUser = await userService.uploadIdentityDocument(file);
      updateUser(updatedUser);
      toast.success('ID Uploaded Successfully. Propertree Will Review It Shortly.');
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.profile?.identity_document?.[0]
        || error.response?.data?.error
        || 'Failed to Upload ID Document';
      toast.error(message);
    } finally {
      setUploadingIdentity(false);
      if (identityInputRef.current) identityInputRef.current.value = '';
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/properties/landlord/${propertyId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 204) throw new Error('Delete Failed');
      toast.success('Property Deleted');
      fetchProperties();
    } catch (error) {
      console.error(error);
      toast.error('Failed to Delete Property');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending_approval: { variant: 'warning', label: 'Pending Review' },
      approved: { variant: 'success', label: 'Active' },
      rejected: { variant: 'danger', label: 'Rejected' },
    };
    const config = map[status] || { variant: 'secondary', label: titleCase(status) };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) return <Container className="py-8"><Loading /></Container>;

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-propertree-dark">My Properties</h1>
          <p className="text-gray-600 mt-1">Manage Your Property Listings</p>
        </div>
        {canAddProperty ? (
          <Link to="/landlord/properties/new"><Button variant="primary" leftIcon={<Plus />}>Add Property</Button></Link>
        ) : (
          <Button variant="outline" leftIcon={<Plus />} disabled title="Identity verification required">
            Add Property
          </Button>
        )}
      </div>

      {!canAddProperty && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong>{identityReuploadRequired ? 'ID Re-upload Required.' : hasIdentityDocument ? 'Identity Verification Pending.' : 'Identity Verification Required.'}</strong>{' '}
              {identityReuploadRequired
                ? 'Your previous ID file is no longer available. Please upload it again so Propertree can complete verification.'
                : hasIdentityDocument
                ? 'Your ID has been submitted and is waiting for Propertree review. You can replace it if needed.'
                : 'Please upload your ID so Propertree can verify your account before you add another property.'}
            </div>
            <div className="flex-shrink-0">
              <input
                ref={identityInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => handleIdentityUpload(event.target.files?.[0])}
              />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                loading={uploadingIdentity}
                onClick={() => identityInputRef.current?.click()}
              >
                {identityReuploadRequired ? 'Re-upload ID' : hasIdentityDocument ? 'Replace ID' : 'Upload ID'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card><Card.Body className="text-center"><div className="text-3xl font-bold text-propertree-green">{stats.total}</div><div className="text-sm text-gray-600">Total Properties</div></Card.Body></Card>
          <Card><Card.Body className="text-center"><div className="text-3xl font-bold text-gray-500">{stats.draft}</div><div className="text-sm text-gray-600">Draft</div></Card.Body></Card>
          <Card><Card.Body className="text-center"><div className="text-3xl font-bold text-yellow-500">{stats.pending}</div><div className="text-sm text-gray-600">Pending Review</div></Card.Body></Card>
          <Card><Card.Body className="text-center"><div className="text-3xl font-bold text-green-500">{stats.approved}</div><div className="text-sm text-gray-600">Active</div></Card.Body></Card>
          <Card><Card.Body className="text-center"><div className="text-3xl font-bold text-red-500">{stats.rejected}</div><div className="text-sm text-gray-600">Rejected</div></Card.Body></Card>
        </div>
      )}

      {properties.length === 0 ? (
        <EmptyState
          icon={<Home className="w-16 h-16" />}
          title="No Properties Yet"
          message="Add your first property to create its management workspace."
          action={canAddProperty ? () => navigate('/landlord/properties/new') : undefined}
          actionLabel={canAddProperty ? 'Add First Property' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <Link to={`/landlord/properties/${property.id}`} className="block">
                <div className="card-media bg-gray-200 overflow-hidden rounded-t-2xl">
                  {property.primary_photo ? (
                    <img src={property.primary_photo} alt={property.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Home className="w-12 h-12 text-gray-400" /></div>
                  )}
                </div>
              </Link>

              <Card.Body className="p-4 sm:p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <Link to={`/landlord/properties/${property.id}`} className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 truncate hover:text-propertree-green">{property.title}</h3>
                  </Link>
                  {getStatusBadge(property.status)}
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-4"><MapPin className="w-4 h-4 mr-1.5" />{property.city}, {property.state}</div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Property Overview</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-gray-500">Type</p><p className="font-semibold text-gray-900">{titleCase(property.property_type)}</p></div>
                    <div><p className="text-gray-500">Bedrooms</p><p className="font-semibold text-gray-900 flex items-center gap-1"><Bed className="w-4 h-4" />{property.bedrooms ?? '—'}</p></div>
                    <div><p className="text-gray-500">Bathrooms</p><p className="font-semibold text-gray-900 flex items-center gap-1"><Bath className="w-4 h-4" />{property.bathrooms ?? '—'}</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Link to={`/landlord/properties/${property.id}`}><Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />} className="w-full h-10">Open Property</Button></Link>
                  <Link to={`/landlord/services?property=${property.id}`}><Button variant="outline" size="sm" leftIcon={<Wrench className="w-4 h-4" />} className="w-full h-10">Book Service</Button></Link>
                </div>

                <div className="flex gap-2">
                  <Link to={`/landlord/properties/${property.id}`} className="flex-1"><Button variant="ghost" size="sm" leftIcon={<FileText className="w-4 h-4" />} className="w-full">Documents</Button></Link>
                  <Link to={`/landlord/properties/${property.id}/edit`} className="flex-1"><Button variant="ghost" size="sm" className="w-full">Edit</Button></Link>
                  <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteProperty(property.id)}>Delete</Button>
                </div>

                {property.status === 'rejected' && property.rejection_reason && <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800"><strong>Rejected:</strong> {property.rejection_reason}</div>}
                {property.status === 'pending_approval' && <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">Awaiting Admin Review</div>}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Properties;
