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
  let response;
  try {
    response = await api.get(`/properties/documents/${documentId}/download/`, {
      responseType: 'blob',
    });
  } catch (error) {
    error.userMessage = await readDocumentBlobError(error, 'Failed to download document.');
    throw error;
  }

  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = resolveDownloadName(response, filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 1000);

  return { reviewed: true };
};

export const previewPropertyDocument = async (documentId) => {
  const previewWindow = window.open('', '_blank');
  try {
    const response = await api.get(`/properties/documents/${documentId}/download/`, {
      responseType: 'blob',
    });

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
    error.userMessage = await readDocumentBlobError(error, 'Failed to open document.');
    throw error;
  }
};
