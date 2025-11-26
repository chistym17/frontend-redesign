const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

export const createCredential = async (assistantId, name, credentialType, data) => {
  const response = await fetch(`${API_BASE}/textflow/credentials?assistant_id=${assistantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name,
      credential_type: credentialType,
      data
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create credential' }));
    throw new Error(error.detail || 'Failed to create credential');
  }

  return response.json();
};

export const listCredentials = async (assistantId) => {
  const url = `${API_BASE}/textflow/credentials?assistant_id=${assistantId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch credentials' }));
    throw new Error(error.detail || 'Failed to fetch credentials');
  }

  return response.json();
};

export const deleteCredential = async (credentialId) => {
  const response = await fetch(`${API_BASE}/textflow/credentials/${credentialId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete credential' }));
    throw new Error(error.detail || 'Failed to delete credential');
  }

  return response.json();
};

