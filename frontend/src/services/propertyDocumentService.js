import api from './api';

const readDocumentBlobError = async (error, fallback) => {
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

const base64ToBlob = (base64, contentType = 'application/octet-stream') => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
};

const fetchPropertyDocumentContent = async (documentId) => {
  const response = await api.get(`/properties/documents/${documentId}/download/?format=json`);
  return response.data;
};

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

const resolveDownloadName = (response, fallback) => {
  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match?.[1]) return match[1];

  const fallbackExtension =
    contentType.includes('pdf') ? '.pdf'
      : contentType.includes('png') ? '.png'
        : contentType.includes('jpeg') ? '.jpg'
          : '';

  return fallback.includes('.') ? fallback : `${fallback}${fallbackExtension}`;
};

export const downloadPropertyDocument = async (documentId, filename = 'document') => {
  try {
    const data = await fetchPropertyDocumentContent(documentId);
    const blob = base64ToBlob(data.content_base64, data.content_type);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename || filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 1000);
    return { reviewed: true, filename: data.filename || filename };
  } catch (error) {
    error.userMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to download document.';
    throw error;
  }
};

export const previewPropertyDocument = async (documentId) => {
  try {
    const data = await fetchPropertyDocumentContent(documentId);
    const blob = base64ToBlob(data.content_base64, data.content_type);
    const url = window.URL.createObjectURL(blob);
    return {
      reviewed: true,
      url,
      filename: data.filename,
      contentType: data.content_type,
    };
  } catch (error) {
    error.userMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to open document.';
    throw error;
  }
};
