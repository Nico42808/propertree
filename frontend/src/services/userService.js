/**
 * User service - Handle user operations
 */
import api from './api';

const userService = {
  /**
   * Get current user profile
   */
  async getProfile() {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    const response = await api.patch('/auth/profile/', profileData);
    return response.data;
  },

  /**
   * Upload profile photo
   */
  async uploadPhoto(file) {
    const formData = new FormData();
    // Send in nested format: profile.profile_photo
    formData.append('profile.profile_photo', file);

    const response = await api.patch('/auth/profile/', formData);
    return response.data;
  },

  /**
   * Get user's properties (landlord)
   */
  async getMyProperties() {
    const response = await api.get('/users/my-properties/');
    return response.data;
  },

  /**
   * Get user's bookings (tenant)
   */
  async getMyBookings(status) {
    const params = status ? { status } : {};
    const response = await api.get('/users/my-bookings/', { params });
    return response.data;
  },

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    const response = await api.get('/users/dashboard/');
    return response.data;
  },

  /**
   * Become a host (change role to landlord)
   */
  async becomeHost() {
    const response = await api.post('/users/become-host/');
    return response.data;
  },

  /**
   * [Admin] Permanently delete a user account
   */
  async adminDeleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}/delete/`);
    return response.data;
  },

  /**
   * [Admin] Toggle a user's active status (block/unblock)
   */
  async adminToggleUserActive(userId) {
    const response = await api.post(`/admin/users/${userId}/toggle-active/`);
    return response.data;
  },

  /**
   * [Admin] Reset a user's password to a new temporary one
   */
  async adminResetUserPassword(userId) {
    const response = await api.post(`/admin/users/${userId}/reset-password/`);
    return response.data;
  },
};

export default userService;

