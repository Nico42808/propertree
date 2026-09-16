import api from './api';

export const getPropertyDocuments = async (propertyId) => {
  const response = await api.get(`/properties/landlord/${propertyId}/documents/`);
  return response.data.results || response.data;
};

export const uploadPropertyDocument = async (propertyId, { title, category, notes, file }) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  if (notes) formData.append('notes', notes);
  formData.append('file', file);

  const response = await api.post(
    `/properties/landlord/${propertyId}/documents/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const deletePropertyDocument = async (documentId) => {
  await api.delete(`/properties/documents/${documentId}/`);
};

export const downloadPropertyDocument = async (documentId, filename = 'document') => {
  const response = await api.get(`/properties/documents/${documentId}/download/`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
