const API_BASE_URL = '/api';

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let payload;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(
      payload?.error?.message || 'Não foi possível concluir a solicitação.',
    );
  }

  return response;
}

export async function listDocuments(signal) {
  const response = await request('/documents', { signal });
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

function getDownloadFilename(contentDisposition, fallbackName) {
  const encodedName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

  if (encodedName) {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return fallbackName;
    }
  }

  const quotedName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  return quotedName || fallbackName;
}

export async function downloadDocument(id, fallbackName) {
  const response = await request(
    `/documents/${encodeURIComponent(id)}/download`,
  );

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(
      response.headers.get('content-disposition'),
      fallbackName || 'document',
    ),
  };
}