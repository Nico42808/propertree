/**
 * Admin Users - View and manage all users
 */
import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Mail, Home, Calendar, Trash2, Ban, CheckCircle, KeyRound } from 'lucide-react';
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
                          {user.is_verified && (
                            <Badge variant="info" size="sm">Verified</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
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
