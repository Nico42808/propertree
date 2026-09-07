/**
 * Service API layer for maintenance and service bookings
 */
import api from './api';

const SERVICE_ENDPOINTS = {
  CATALOG: '/maintenance/service-catalog/',
  BOOKINGS: '/maintenance/service-bookings/',
  CATEGORIES: '/maintenance/service-catalog/categories/',
  STATS: '/maintenance/service-bookings/stats/',
};

/**
 * Get all available services from catalog
 * @param {string} category - Optional category filter
 * @returns {Promise} Service catalog items
 */
export const getServiceCatalog = async (category = null) => {
  const params = category ? { category } : {};
  const response = await api.get(SERVICE_ENDPOINTS.CATALOG, { params });
  // Handle paginated response - extract results array
  return response.data.results || response.data;
};

/**
 * Get a specific service from catalog
 * @param {string} serviceId - Service UUID
 * @returns {Promise} Service details
 */
export const getServiceById = async (serviceId) => {
  const response = await api.get(`${SERVICE_ENDPOINTS.CATALOG}/${serviceId}`);
  return response.data;
};

/**
 * Get all service categories
 * @returns {Promise} List of categories
 */
export const getServiceCategories = async () => {
  const response = await api.get(SERVICE_ENDPOINTS.CATEGORIES);
  return response.data;
};

/**
 * Create a service booking
 * @param {Object} bookingData - Service booking data
 * @returns {Promise} Created booking
 */
export const createServiceBooking = async (bookingData) => {
  const response = await api.post(SERVICE_ENDPOINTS.BOOKINGS, bookingData);
  return response.data;
};

/**
 * Get all service bookings for current user
 * @returns {Promise} List of service bookings
 */
export const getServiceBookings = async () => {
  const response = await api.get(SERVICE_ENDPOINTS.BOOKINGS);
  // Handle paginated response - extract results array
  return response.data.results || response.data;
};

/**
 * Get a specific service booking
 * @param {string} bookingId - Booking UUID
 * @returns {Promise} Booking details
 */
export const getServiceBookingById = async (bookingId) => {
  const response = await api.get(`${SERVICE_ENDPOINTS.BOOKINGS}/${bookingId}`);
  return response.data;
};

/**
 * Update a service booking
 * @param {string} bookingId - Booking UUID
 * @param {Object} updateData - Data to update
 * @returns {Promise} Updated booking
 */
export const updateServiceBooking = async (bookingId, updateData) => {
  const response = await api.patch(`${SERVICE_ENDPOINTS.BOOKINGS}/${bookingId}`, updateData);
  return response.data;
};

/**
 * Get service booking statistics for dashboard
 * @returns {Promise} Booking statistics
 */
export const getServiceBookingStats = async () => {
  const response = await api.get(SERVICE_ENDPOINTS.STATS);
  return response.data;
};

// ============= Admin-only endpoints =============

/**
 * Get pending service bookings (admin only)
 * @returns {Promise} List of pending bookings
 */
export const getPendingServiceBookings = async () => {
  const response = await api.get(`${SERVICE_ENDPOINTS.BOOKINGS}pending/`);
  // Handle paginated response - extract results array
  return response.data.results || response.data;
};

/**
 * Confirm a service booking (admin only)
 * @param {string} bookingId - Booking UUID
 * @param {string} serviceProviderId - Optional service provider UUID
 * @returns {Promise} Confirmed booking
 */
export const confirmServiceBooking = async (bookingId, serviceProviderId = null) => {
  const data = serviceProviderId ? { service_provider_id: serviceProviderId } : {};
  const response = await api.post(`${SERVICE_ENDPOINTS.BOOKINGS}${bookingId}/confirm/`, data);
  return response.data;
};

/**
 * Reject a service booking (admin only)
 * @param {string} bookingId - Booking UUID
 * @param {string} reason - Rejection reason
 * @returns {Promise} Rejected booking
 */
export const rejectServiceBooking = async (bookingId, reason) => {
  const response = await api.post(`${SERVICE_ENDPOINTS.BOOKINGS}${bookingId}/reject/`, { reason });
  return response.data;
};

/**
 * Get all service bookings, any status (admin only)
 * @returns {Promise} List of all bookings
 */
export const getAllServiceBookings = async () => {
  const response = await api.get(SERVICE_ENDPOINTS.BOOKINGS);
  return response.data.results || response.data;
};

/**
 * Mark a confirmed booking as in progress (admin only)
 * @param {string} bookingId - Booking UUID
 * @param {string} note - Optional progress note
 * @returns {Promise} Updated booking
 */
export const startServiceProgress = async (bookingId, note = '') => {
  const response = await api.post(`${SERVICE_ENDPOINTS.BOOKINGS}${bookingId}/start_progress/`, { note });
  return response.data;
};

/**
 * Mark a booking as completed, optionally with photos (admin only)
 * @param {string} bookingId - Booking UUID
 * @param {string} note - Completion note
 * @param {File[]} photos - Optional completed-work photos
 * @returns {Promise} Updated booking
 */
export const completeServiceBooking = async (bookingId, note = '', photos = []) => {
  const formData = new FormData();
  formData.append('note', note);
  photos.forEach((file) => formData.append('photos', file));
  const response = await api.post(
    `${SERVICE_ENDPOINTS.BOOKINGS}${bookingId}/complete/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * Upload additional photos to a booking, any status (admin only)
 * @param {string} bookingId - Booking UUID
 * @param {File[]} photos - Photos to upload
 * @param {string} caption - Optional caption
 * @returns {Promise} Updated booking
 */
export const uploadServiceBookingPhotos = async (bookingId, photos = [], caption = '') => {
  const formData = new FormData();
  photos.forEach((file) => formData.append('photos', file));
  if (caption) formData.append('caption', caption);
  const response = await api.post(
    `${SERVICE_ENDPOINTS.BOOKINGS}${bookingId}/upload_photos/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export default {
  getServiceCatalog,
  getServiceById,
  getServiceCategories,
  createServiceBooking,
  getServiceBookings,
  getServiceBookingById,
  updateServiceBooking,
  getServiceBookingStats,
  getPendingServiceBookings,
  confirmServiceBooking,
  rejectServiceBooking,
  getAllServiceBookings,
  startServiceProgress,
  completeServiceBooking,
  uploadServiceBookingPhotos,
};
