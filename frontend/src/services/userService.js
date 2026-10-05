/**
 * User service - Handle user operations
 */
import api from './api';

const readBlobError = async (error, fallback) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.error || parsed.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.error || data?.message || fallback;
};

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
   * [Admin] Download a landlord identity document securely
   */
  async adminDownloadIdentityDocument(userId, filename = 'identity-document') {
    let response;
    try {
      response = await api.get(`/admin/users/${userId}/identity-document/`, { responseType: 'blob' });
    } catch (error) {
      error.userMessage = await readBlobError(error, 'Failed to download identity document.');
      throw error;
    }
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const serverFilename = match?.[1];
    const fallbackExtension =
      contentType.includes('pdf') ? '.pdf'
        : contentType.includes('png') ? '.png'
          : contentType.includes('jpeg') ? '.jpg'
            : '';
    const downloadName = serverFilename || (filename.includes('.') ? filename : `${filename}${fallbackExtension}`);

    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 1000);

    return { reviewed: true, filename: downloadName };
  },

  async adminPreviewIdentityDocument(userId) {
    const previewWindow = window.open('', '_blank');
    try {
      const response = await api.get(`/admin/users/${userId}/identity-document/`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.location.href = url;
      }
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      return { reviewed: true };
    } catch (error) {
      if (previewWindow) previewWindow.close();
      error.userMessage = await readBlobError(error, 'Failed to open identity document.');
      throw error;
    }
  },

  /**
   * [Admin] Verify a landlord after reviewing the uploaded ID
   */
  async adminVerifyUser(userId) {
    const response = await api.post(`/admin/users/${userId}/verify/`);
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

