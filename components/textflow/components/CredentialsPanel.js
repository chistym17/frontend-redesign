import React, { useState, useEffect } from "react";
import { Key, Plus, Trash2, Eye, EyeOff, AlertCircle, CheckCircle, X, ChevronDown, Lock, Shield } from "lucide-react";

// ✅ REPLACE WITH THIS:
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://176.9.16.194:5403/api';


console.log('API_BASE:', API_BASE); // Debug log

const createCredential = async (assistantId, name, credentialType, data) => {
  // assistant_id as query parameter to match backend expectations
  const response = await fetch(`${API_BASE}/textflow/credentials?assistant_id=${assistantId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

const listCredentials = async (assistantId) => {
  const url = `${API_BASE}/textflow/credentials?assistant_id=${assistantId}`;
  console.log('Fetching credentials from:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch credentials' }));
      throw new Error(error.detail || 'Failed to fetch credentials');
    }
    
    const data = await response.json();
    console.log('Credentials data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

const deleteCredential = async (credentialId) => {
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

const CREDENTIAL_TYPES = [
  { value: "api_key", label: "API Key", icon: Key, description: "Header or query parameter authentication" },
  { value: "bearer", label: "Bearer Token", icon: Shield, description: "JWT or OAuth bearer tokens" },
  { value: "basic_auth", label: "Basic Auth", icon: Lock, description: "Username and password authentication" },
  { value: "oauth2", label: "OAuth2", icon: Shield, description: "OAuth2 access tokens" },
  { value: "header", label: "Custom Header", icon: Key, description: "Custom HTTP headers" },
];

export default function CredentialsPanel({ assistantId }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showValues, setShowValues] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [newCred, setNewCred] = useState({
    name: "",
    type: "api_key",
    data: { key_name: "X-API-Key", location: "header", key_value: "" }
  });

  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");

  const loadCredentials = async () => {
    if (!assistantId) {
      console.log('No assistantId provided');
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log('Loading credentials for assistant:', assistantId);
      const data = await listCredentials(assistantId);
      console.log('Loaded credentials:', data);
      setCredentials(data);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load credentials';
      setError(errorMsg);
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assistantId) {
      loadCredentials();
    }
  }, [assistantId]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCreate = async () => {
    setError("");
    
    if (!assistantId) {
      setError("No assistant ID provided");
      return;
    }
    
    if (!newCred.name.trim()) {
      setError("Please enter a credential name");
      return;
    }

    const validationError = validateCredentialData(newCred.type, newCred.data);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      console.log('Creating credential:', { assistantId, name: newCred.name, type: newCred.type });
      const result = await createCredential(assistantId, newCred.name, newCred.type, newCred.data);
      console.log('Credential created:', result);
      
      setShowCreate(false);
      resetForm();
      setSuccess("Credential created successfully");
      await loadCredentials();
    } catch (err) {
      const errorMsg = err.message || 'Failed to create credential';
      setError(errorMsg);
      console.error('Failed to create credential:', err);
    }
  };

  const handleDelete = async (credId) => {
    if (!window.confirm("Delete this credential? This cannot be undone.")) return;
    
    try {
      console.log('Deleting credential:', credId);
      await deleteCredential(credId);
      setSuccess("Credential deleted");
      await loadCredentials();
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete credential';
      setError(errorMsg);
      console.error('Failed to delete credential:', err);
    }
  };

  const validateCredentialData = (type, data) => {
    switch (type) {
      case "api_key":
        if (!data.key_value?.trim()) return "API key value required";
        if (!data.key_name?.trim()) return "Key name required";
        break;
      case "bearer":
        if (!data.token?.trim()) return "Bearer token required";
        break;
      case "basic_auth":
        if (!data.username?.trim()) return "Username required";
        if (!data.password?.trim()) return "Password required";
        break;
      case "oauth2":
        if (!data.access_token?.trim()) return "Access token required";
        break;
      case "header":
        if (!data.headers || Object.keys(data.headers).length === 0) {
          return "At least one header required";
        }
        break;
    }
    return null;
  };

  const handleTypeChange = (newType) => {
    let defaultData = {};
    switch (newType) {
      case "api_key":
        defaultData = { key_name: "X-API-Key", key_value: "", location: "header" };
        break;
      case "bearer":
        defaultData = { token: "" };
        break;
      case "basic_auth":
        defaultData = { username: "", password: "" };
        break;
      case "oauth2":
        defaultData = { access_token: "", refresh_token: "" };
        break;
      case "header":
        defaultData = { headers: {} };
        break;
    }
    setNewCred({ ...newCred, type: newType, data: defaultData });
  };

  const resetForm = () => {
    setNewCred({
      name: "",
      type: "api_key",
      data: { key_name: "X-API-Key", location: "header", key_value: "" }
    });
    setHeaderKey("");
    setHeaderValue("");
  };

  const updateCredData = (key, value) => {
    setNewCred(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const addHeader = () => {
    if (!headerKey.trim() || !headerValue.trim()) {
      setError("Both header name and value required");
      return;
    }
    updateCredData("headers", {
      ...(newCred.data.headers || {}),
      [headerKey.trim()]: headerValue.trim()
    });
    setHeaderKey("");
    setHeaderValue("");
    setError("");
  };

  const removeHeader = (key) => {
    const headers = { ...(newCred.data.headers || {}) };
    delete headers[key];
    updateCredData("headers", headers);
  };

  const selectedType = CREDENTIAL_TYPES.find(t => t.value === newCred.type);
  const TypeIcon = selectedType?.icon || Key;

  // Show loading state if no assistantId
  if (!assistantId) {
    return (
      <div 
        className="h-full flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.04)'
        }}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <Key className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-white">No assistant selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #404040 #1a1a1a;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Credentials</h2>
              <p className="text-xs text-gray-400">{credentials.length} stored</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setError("");
              setSuccess("");
              if (showCreate) resetForm();
            }}
            className="h-9 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? "Cancel" : "New"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-300 flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-emerald-300">{success}</span>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div 
            className="rounded-2xl p-5 space-y-4 border"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">New Credential</h3>
                <p className="text-xs text-gray-400">Securely store authentication details</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Name</label>
              <input
                type="text"
                value={newCred.name}
                onChange={(e) => setNewCred({...newCred, name: e.target.value})}
                className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                placeholder="My API Key"
              />
            </div>

            {/* Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Type</label>
              <div className="relative">
                <select
                  value={newCred.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 rounded-lg text-sm text-white appearance-none transition-colors cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  {CREDENTIAL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-600">{selectedType?.description}</p>
            </div>

            {/* API Key Fields */}
            {newCred.type === "api_key" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">Key Name</label>
                    <input
                      type="text"
                      value={newCred.data.key_name || ""}
                      onChange={(e) => updateCredData("key_name", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">Location</label>
                    <select
                      value={newCred.data.location || "header"}
                      onChange={(e) => updateCredData("location", e.target.value)}
                      className="w-full h-10 px-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Param</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Key Value</label>
                  <input
                    type="password"
                    value={newCred.data.key_value || ""}
                    onChange={(e) => updateCredData("key_value", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                    placeholder="sk-..."
                  />
                </div>
              </>
            )}

            {/* Bearer Token */}
            {newCred.type === "bearer" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Token</label>
                <input
                  type="password"
                  value={newCred.data.token || ""}
                  onChange={(e) => updateCredData("token", e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                  placeholder="eyJhbGc..."
                />
              </div>
            )}

            {/* Basic Auth */}
            {newCred.type === "basic_auth" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Username</label>
                  <input
                    type="text"
                    value={newCred.data.username || ""}
                    onChange={(e) => updateCredData("username", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Password</label>
                  <input
                    type="password"
                    value={newCred.data.password || ""}
                    onChange={(e) => updateCredData("password", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            {/* OAuth2 */}
            {newCred.type === "oauth2" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Access Token</label>
                  <input
                    type="password"
                    value={newCred.data.access_token || ""}
                    onChange={(e) => updateCredData("access_token", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                    placeholder="ya29..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400">Refresh Token (Optional)</label>
                  <input
                    type="password"
                    value={newCred.data.refresh_token || ""}
                    onChange={(e) => updateCredData("refresh_token", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
                    placeholder="1//..."
                  />
                </div>
              </>
            )}

            {/* Custom Headers */}
            {newCred.type === "header" && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-400">Headers</label>
                {Object.entries(newCred.data.headers || {}).map(([key, value]) => (
                  <div 
                    key={key} 
                    className="flex items-center gap-2 h-10 px-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <span className="flex-1 text-sm text-white font-mono truncate">{key}: {value}</span>
                    <button
                      onClick={() => removeHeader(key)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={headerKey}
                    onChange={(e) => setHeaderKey(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHeader()}
                    className="flex-1 h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                    placeholder="Header-Name"
                  />
                  <input
                    type="text"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHeader()}
                    className="flex-1 h-10 px-3 rounded-lg text-sm text-white placeholder-gray-500 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                    placeholder="value"
                  />
                  <button
                    onClick={addHeader}
                    className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Credential'}
            </button>
          </div>
        )}

        {/* Credentials List */}
        {loading && !showCreate ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">Loading credentials...</div>
          </div>
        ) : credentials.length === 0 && !showCreate ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <Key className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No credentials</p>
            <p className="text-xs text-gray-400">Create one to get started</p>
          </div>
        ) : (
          credentials.map((cred) => (
            <div 
              key={cred.credential_id} 
              className="rounded-xl p-4 transition-all group border"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.12)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">{cred.name}</h4>
                  <p className="text-xs text-gray-500 capitalize">{cred.credential_type.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => handleDelete(cred.credential_id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(cred.data_redacted || {}).map(([key, value]) => (
                  <div 
                    key={key} 
                    className="flex items-center gap-2 h-9 px-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <span className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</span>
                    <span className="flex-1 text-xs text-gray-400 font-mono truncate">
                      {showValues[cred.credential_id] ? value : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowValues(prev => ({ ...prev, [cred.credential_id]: !prev[cred.credential_id] }))}
                      className="text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showValues[cred.credential_id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-gray-600">
                Created {new Date(cred.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}