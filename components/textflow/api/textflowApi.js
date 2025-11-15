// components/textflow/api/textflowApi.js (UPDATED)
const BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

// ============================================================================
// FLOW DEFINITION API
// ============================================================================

export async function getTextFlow(assistantId) {
  const r = await fetch(`${BASE}/textflow/text-flows/${assistantId}`);
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  console.log('📥 GET response:', JSON.stringify(data, null, 2));
  return data;
}

export async function saveTextFlow(assistantId, flowData) {
  const { name, ...flowDataWithoutName } = flowData;
  const payload = { flow_data: flowDataWithoutName };
  if (name) {
    payload.name = name;
  }
  console.log('💾 Saving flow with payload:', JSON.stringify(payload, null, 2));
  const r = await fetch(`${BASE}/textflow/text-flows/${assistantId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const errorText = await r.text();
    console.error('❌ Save failed:', errorText);
    throw new Error(errorText);
  }
  const response = await r.json();
  console.log('✅ Save response:', response);
  return response;
}

export async function deleteTextFlow(assistantId) {
  const r = await fetch(`${BASE}/textflow/text-flows/${assistantId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ============================================================================
// RUN MONITORING API
// ============================================================================

export async function getRun(runId) {
  const r = await fetch(`${BASE}/textflow/runs/${runId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getSteps(runId) {
  const r = await fetch(`${BASE}/textflow/runs/${runId}/steps`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listRuns(filters = {}) {
  const params = new URLSearchParams(filters);
  const r = await fetch(`${BASE}/textflow/runs?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ============================================================================
// WEBHOOK TRIGGER API
// ============================================================================

export async function getWebhookUrl(assistantId) {
  const r = await fetch(`${BASE}/textflow/webhooks/${assistantId}/url`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function testWebhook(assistantId, payload) {
  const r = await fetch(`${BASE}/textflow/webhooks/${assistantId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ============================================================================
// SCHEDULE TRIGGER API
// ============================================================================

export async function createSchedule(assistantId, triggerNodeId, cronExpression) {
  const r = await fetch(`${BASE}/textflow/schedules/${assistantId}/${triggerNodeId}?cron_expression=${encodeURIComponent(cronExpression)}`, {
    method: "POST",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteSchedule(assistantId, triggerNodeId) {
  const r = await fetch(`${BASE}/textflow/schedules/${assistantId}/${triggerNodeId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ============================================================================
// TRIGGER CONFIGURATION API
// ============================================================================

export async function updateTriggerConfig(assistantId, triggerNodeId, config) {
  const r = await fetch(`${BASE}/textflow/triggers/${assistantId}/${triggerNodeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getTriggerLogs(assistantId, limit = 50) {
  const r = await fetch(`${BASE}/textflow/triggers/${assistantId}/logs?limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ============================================================================
// CREDENTIALS API
// ============================================================================

export async function createCredential(assistantId, name, credentialType, data) {
  const r = await fetch(`${BASE}/textflow/credentials?assistant_id=${assistantId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, credential_type: credentialType, data }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listCredentials(assistantId) {
  const r = await fetch(`${BASE}/textflow/credentials?assistant_id=${assistantId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteCredential(credentialId) {
  const r = await fetch(`${BASE}/textflow/credentials/${credentialId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

export function openTextWS(assistantId = null, sessionId = null) {
  if (typeof window === "undefined") return null;
  
  const backendWsUrl = process.env.NEXT_PUBLIC_BACKEND_WS || "wss://esapdev.xyz:7000/agentbuilder";
  
  const params = [];
  if (assistantId) params.push(`assistant_id=${assistantId}`);
  if (sessionId) params.push(`session_id=${sessionId}`);
  
  let url = `${backendWsUrl}/ws/text`;
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  console.log('Creating WebSocket connection to:', url);
  return new WebSocket(url);
}