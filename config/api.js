// API configuration
// NEXT_PUBLIC_API_BASE should include /api (e.g., https://176.9.16.194:5403/api)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';

export const API_ENDPOINTS = {
  ASSISTANTS: `${API_BASE_URL}/assistants`,
  ASSISTANT: (id) => `${API_BASE_URL}/assistants/${id}`,
  MENU: `${API_BASE_URL}/menu`,
  ORDERS: `${API_BASE_URL}/orders`,
  // Q&A endpoints
  QA_LIST: (assistantId) => `${API_BASE_URL}/assistants/${assistantId}/qa`,
  QA_CREATE: (assistantId) => `${API_BASE_URL}/assistants/${assistantId}/qa`,
  QA_GET: (assistantId, qaId) => `${API_BASE_URL}/assistants/${assistantId}/qa/${qaId}`,
  QA_UPDATE: (assistantId, qaId) => `${API_BASE_URL}/assistants/${assistantId}/qa/${qaId}`,
  QA_DELETE: (assistantId, qaId) => `${API_BASE_URL}/assistants/${assistantId}/qa/${qaId}`,
  // Tools endpoints
  TOOLS_LIST: (assistantId) => `${API_BASE_URL}/assistants/${assistantId}/tools`,
  TOOLS_CREATE: (assistantId) => `${API_BASE_URL}/assistants/${assistantId}/tools`,
  TOOLS_GET: (assistantId, toolId) => `${API_BASE_URL}/assistants/${assistantId}/tools/${toolId}`,
  TOOLS_UPDATE: (assistantId, toolId) => `${API_BASE_URL}/assistants/${assistantId}/tools/${toolId}`,
  TOOLS_DELETE: (assistantId, toolId) => `${API_BASE_URL}/assistants/${assistantId}/tools/${toolId}`,
  TOOLS_TEST: (assistantId, toolId) => `${API_BASE_URL}/assistants/${assistantId}/tools/${toolId}/test`,
};

export default API_BASE_URL; 