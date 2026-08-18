/**
 * Authentication service - Handle login, register, logout
 */
import api from './api';

const authService = {
  /**
   * Login user
   */
  async login(email, password) {
    const response = await api.post('/auth/login/', { email, password });
    const { user, tokens } = response.data;
    const { access, refresh } = tokens;
    
    // Store tokens and user data
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, access, refresh };
  },

  /**
   * Register new user
   * @param {FormData|Object} userData - User data (FormData for file uploads, Object for JSON)
   * @param {Object} config - Optional axios config (headers, etc.)
   */
  async register(userData, config = {}) {
    // If FormData, don't set Content-Type (browser will set it with boundary)
    if (userData instanceof FormData) {
      const response = await api.post('/auth/register/', userData, {
        ...config,
        headers: {
          ...config.headers,
          // Don't set Content-Type for FormData - let browser set it with boundary
        }
      });
      return response.data;
    }
    const response = await api.post('/auth/register/', userData, config);
    return response.data;
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });

    const { access } = response.data;
    localStorage.setItem('accessToken', access);
    
    return access;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },

  /**
   * Reset password using the uid/token pair from the emailed reset link
   */
  async resetPassword({ uid, token, password }) {
    const response = await api.post('/auth/password-reset/confirm/', {
      uid,
      token,
      password,
    });
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userData) {
    const response = await api.patch('/users/profile/', userData);
    const updatedUser = response.data;
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  },

  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

export default authService;

