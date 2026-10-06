/**
 * Admin Users - View and manage all users
 */
import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Mail, Home, Calendar, Trash2, Ban, CheckCircle, KeyRound, FileDown, ShieldCheck, Eye } from 'lucide-react';
import { Container } from '../../components/layout';
import { Card, Button, Input, Badge, Avatar, Loading, EmptyState, Modal } from '../../components/common';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import userService from '../../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Confirmation modal state (used for delete + block/unblock)
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'toggle', user }
  const [identityReviewUser, setIdentityReviewUser] = useState(null);
  const [identityPreview, setIdentityPreview] = useState(null);
  const [identityReviewError, setIdentityReviewError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = roleFilter && roleFilter !== 'all' ? { role: roleFilter } : {};
      const response = await api.get('/admin/users/', { params });
      setUsers(response.data.results || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Error handling is done by api interceptor (token refresh, redirects, etc.)
      // Just set empty users array here
      setUsers([]);
      if (error.response?.data?.error) {
        // Only show additional error if api interceptor hasn't handled it
        toast.error(error.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const markIdentityReviewed = (userId) => {
    setUsers((current) => current.map((item) => item.id === userId ? { ...item, identity_document_reviewed: true } : item));
    setIdentityReviewUser((current) => current?.id === userId ? { ...current, identity_document_reviewed: true } : current);
  };

  const handleDownloadIdentity = async (user) => {
    setActionLoading(true);
    setIdentityReviewError('');
    try {
      await userService.adminDownloadIdentityDocument(user.id, `${user.full_name || 'landlord'}-identity-document`);
      markIdentityReviewed(user.id);
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || 'Failed to download identity document.';
      setIdentityReviewError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewIdentity = async (user) => {
    setActionLoading(true);
    setIdentityReviewError('');
    try {
      if (identityPreview?.url) window.URL.revokeObjectURL(identityPreview.url);
      const preview = await userService.adminPreviewIdentityDocument(user.id);
      setIdentityPreview(preview);
      markIdentityReviewed(user.id);
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || 'Failed to open identity document.';
      setIdentityReviewError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyUser = async (user) => {
    setActionLoading(true);
    try {
      const result = await userService.adminVerifyUser(user.id);
      toast.success(result.message || 'Landlord identity verified.');
      setIdentityReviewUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify landlord.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    setActionLoading(true);
    try {
      await userService.adminDeleteUser(user.id);
      toast.success(`${user.full_name || user.email} was deleted.`);
      setConfirmAction(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    setActionLoading(true);
    try {
      const result = await userService.adminToggleUserActive(user.id);
      toast.success(result.message);
      setConfirmAction(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (user) => {
    setActionLoading(true);
    try {
      const result = await userService.adminResetUserPassword(user.id);
      if (result.email_sent) {
        toast.success(`A new temporary password was emailed to ${user.email}.`);
      } else {
        toast.success(
          `Password reset. Email could not be sent — temporary password: ${result.temporary_password}`,
          { duration: 10000 }
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      landlord: { variant: 'success', label: 'Landlord', icon: <Home className="w-3 h-3" /> },
      tenant: { variant: 'info', label: 'Tenant', icon: <UsersIcon className="w-3 h-3" /> },
    };
    
    const config = roleMap[role] || { variant: 'secondary', label: role };
    return (
      <Badge variant={config.variant}>
        <span className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </span>
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    );
  });

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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">View and manage all platform users</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                leftIcon={<Search className="w-5 h-5" />}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div className="flex gap-2">
              <Button
                variant={roleFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('all')}
              >
                All Users
              </Button>
              <Button
                variant={roleFilter === 'landlord' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('landlord')}
              >
                Landlords
              </Button>
              <Button
                variant={roleFilter === 'tenant' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('tenant')}
              >
                Tenants
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.role === 'landlord').length}
              </p>
              <p className="text-sm text-gray-600">Landlords</p>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {users.filter(u => u.role === 'tenant').length}
              </p>
              <p className="text-sm text-gray-600">Tenants</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-16 h-16" />}
          title="No users found"
          message="No users match your search criteria"
        />
      ) : (
        <Card>
          <Card.Body className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={user.profile_photo}
                            name={user.full_name || user.email}
                            size="sm"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.full_name || 'No name'}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {user.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.role === 'landlord' && (
                            <div className="flex items-center gap-1">
                              <Home className="w-4 h-4 text-gray-400" />
                              <span>{user.property_count || 0} properties</span>
                            </div>
                          )}
                          {user.role === 'tenant' && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{user.booking_count || 0} bookings</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <Badge variant={user.is_active ? 'success' : 'danger'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.role === 'landlord' && (
                            <Badge variant={user.is_verified ? 'success' : user.has_identity_document ? 'warning' : 'secondary'} size="sm">
                              {user.is_verified ? 'ID Verified' : user.identity_document_reupload_required ? 'ID Re-upload Required' : user.identity_document_reviewed ? 'ID Reviewed – Approval Pending' : user.has_identity_document ? 'ID Review Pending' : 'ID Missing'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.role === 'landlord' && user.has_identity_document && !user.is_verified && !user.identity_document_reupload_required && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              leftIcon={<ShieldCheck className="w-4 h-4" />}
                              onClick={() => { setIdentityReviewUser(user); setIdentityPreview(null); setIdentityReviewError(''); }}
                              disabled={actionLoading}
                            >
                              Review ID
                            </Button>
                          )}
                          {user.role === 'landlord' && user.identity_document_reupload_required && !user.is_verified && (
                            <span className="text-xs font-medium text-red-600">
                              Ask Landlord to Re-upload ID
                            </span>
                          )}
                          {user.role === 'landlord' && user.has_identity_document && user.is_verified && (
                            <button
                              type="button"
                              title="Download identity document"
                              onClick={() => handleDownloadIdentity(user)}
                              disabled={actionLoading}
                              className="p-2 rounded-lg text-gray-500 hover:text-propertree-green hover:bg-propertree-green-50 transition-colors disabled:opacity-50"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Reset password"
                            onClick={() => handleResetPassword(user)}
                            disabled={actionLoading}
                            className="p-2 rounded-lg text-gray-500 hover:text-propertree-green hover:bg-propertree-green-50 transition-colors disabled:opacity-50"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title={user.is_active ? 'Block user' : 'Unblock user'}
                            onClick={() => setConfirmAction({ type: 'toggle', user })}
                            disabled={actionLoading}
                            className="p-2 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                          >
                            {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            title="Delete user"
                            onClick={() => setConfirmAction({ type: 'delete', user })}
                            disabled={actionLoading}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal
        isOpen={!!identityReviewUser}
        onClose={() => { if (!actionLoading) { if (identityPreview?.url) window.URL.revokeObjectURL(identityPreview.url); setIdentityPreview(null); setIdentityReviewError(''); setIdentityReviewUser(null); } }}
        title="Review Landlord Identity"
        size="sm"
        closeOnOverlayClick={!actionLoading}
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-900">ID Verification Review Pending</p>
            <p className="mt-1 text-sm text-amber-800">
              Review the uploaded identity document before approving this landlord.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Landlord</span>
              <strong className="text-right text-gray-900">
                {identityReviewUser?.full_name || identityReviewUser?.email}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Email</span>
              <strong className="text-right text-gray-900">{identityReviewUser?.email}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => handlePreviewIdentity(identityReviewUser)}
              disabled={actionLoading}
            >
              View ID Document
            </Button>
            <Button
              type="button"
              variant="outline"
              leftIcon={<FileDown className="w-4 h-4" />}
              onClick={() => handleDownloadIdentity(identityReviewUser)}
              disabled={actionLoading}
            >
              Download ID Document
            </Button>
          </div>

          {identityReviewError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {identityReviewError}
            </div>
          )}

          {identityPreview?.url && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {identityPreview.contentType?.startsWith('image/') ? (
                <img
                  src={identityPreview.url}
                  alt="Landlord identity document"
                  className="max-h-[420px] w-full object-contain"
                />
              ) : (
                <iframe
                  src={identityPreview.url}
                  title="Landlord identity document"
                  className="h-[420px] w-full bg-white"
                />
              )}
              <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                {identityPreview.filename || 'Identity Document'}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <p className="mb-4 text-sm text-gray-600">
              Open or download the ID first. Approval is enabled only after the document has been successfully retrieved from secure storage and marked as reviewed.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (identityPreview?.url) window.URL.revokeObjectURL(identityPreview.url); setIdentityPreview(null); setIdentityReviewError(''); setIdentityReviewUser(null); }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                loading={actionLoading}
                disabled={!identityReviewUser?.identity_document_reviewed}
                onClick={() => handleVerifyUser(identityReviewUser)}
              >
                Approve Verification
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Delete or Block/Unblock */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => !actionLoading && setConfirmAction(null)}
        title={
          confirmAction?.type === 'delete'
            ? 'Delete user'
            : confirmAction?.user?.is_active
            ? 'Block user'
            : 'Unblock user'
        }
        size="sm"
        closeOnOverlayClick={!actionLoading}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            {confirmAction?.type === 'delete' ? (
              <>
                Are you sure you want to permanently delete{' '}
                <strong>{confirmAction?.user?.full_name || confirmAction?.user?.email}</strong>?
                This action cannot be undone.
              </>
            ) : confirmAction?.user?.is_active ? (
              <>
                Are you sure you want to block{' '}
                <strong>{confirmAction?.user?.full_name || confirmAction?.user?.email}</strong>?
                They won't be able to log in until you unblock them.
              </>
            ) : (
              <>
                Unblock <strong>{confirmAction?.user?.full_name || confirmAction?.user?.email}</strong> and
                allow them to log in again?
              </>
            )}
          </p>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmAction?.type === 'delete' ? 'danger' : 'primary'}
              loading={actionLoading}
              onClick={() =>
                confirmAction?.type === 'delete'
                  ? handleDeleteUser(confirmAction.user)
                  : handleToggleActive(confirmAction.user)
              }
            >
              {confirmAction?.type === 'delete'
                ? 'Delete'
                : confirmAction?.user?.is_active
                ? 'Block'
                : 'Unblock'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default Users;
