import React, { useState, useEffect } from "react";
import { X, AlertCircle, Plus, ChevronDown, Key, Shield, Lock } from "lucide-react";
import { createCredential } from "../api/credentialsApi";

const CREDENTIAL_TYPES = [
  { value: "api_key", label: "API Key", icon: Key, description: "Header or query parameter authentication" },
  { value: "bearer", label: "Bearer Token", icon: Shield, description: "JWT or OAuth bearer tokens" },
  { value: "basic_auth", label: "Basic Auth", icon: Lock, description: "Username and password authentication" },
  { value: "oauth2", label: "OAuth2", icon: Shield, description: "OAuth2 access tokens" },
  { value: "header", label: "Custom Header", icon: Key, description: "Custom HTTP headers" },
];

const getDefaultData = (type) => {
  switch (type) {
    case "api_key":
      return { key_name: "X-API-Key", key_value: "", location: "header" };
    case "bearer":
      return { token: "" };
    case "basic_auth":
      return { username: "", password: "" };
    case "oauth2":
      return { access_token: "", refresh_token: "" };
    case "header":
      return { headers: {} };
    default:
      return {};
  }
};

export default function CreateCredentialModal({ isOpen, onClose, assistantId, onSuccess = () => {} }) {
  const [form, setForm] = useState({
    name: "",
    type: "api_key",
    data: getDefaultData("api_key"),
  });
  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setError("");
    }
  }, [isOpen]);

  const validateCredentialData = (type, data) => {
    switch (type) {
      case "api_key":
        if (!data.key_name?.trim()) return "Key name required";
        if (!data.key_value?.trim()) return "Key value required";
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
    setForm({
      ...form,
      type: newType,
      data: getDefaultData(newType),
    });
    setHeaderKey("");
    setHeaderValue("");
  };

  const updateData = (key, value) => {
    setForm((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  const addHeader = () => {
    if (!headerKey.trim() || !headerValue.trim()) {
      setError("Header name and value required");
      return;
    }
    updateData("headers", {
      ...(form.data.headers || {}),
      [headerKey.trim()]: headerValue.trim(),
    });
    setHeaderKey("");
    setHeaderValue("");
    setError("");
  };

  const removeHeader = (key) => {
    const headers = { ...(form.data.headers || {}) };
    delete headers[key];
    updateData("headers", headers);
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "api_key",
      data: getDefaultData("api_key"),
    });
    setHeaderKey("");
    setHeaderValue("");
    setLoading(false);
    setError("");
  };

  const handleCreate = async () => {
    if (!assistantId) {
      setError("No assistant ID provided");
      return;
    }
    if (!form.name.trim()) {
      setError("Please enter a credential name");
      return;
    }
    const validationError = validateCredentialData(form.type, form.data);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setLoading(true);
      const result = await createCredential(assistantId, form.name, form.type, form.data);
      onSuccess(result);
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create credential");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = CREDENTIAL_TYPES.find((t) => t.value === form.type) || CREDENTIAL_TYPES[0];
  const TypeIcon = selectedType.icon || Key;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={() => {
          resetForm();
          onClose();
        }}
      />

      <div
        className="relative rounded-3xl max-w-xl w-full max-h-[90vh] overflow-auto shadow-2xl create-credential-modal"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .create-credential-modal select option {
            background: rgba(20, 25, 35, 0.95);
            color: white;
          }
          .create-credential-modal .input-slim {
            width: 100%;
            height: 40px;
            padding: 0 12px;
            border-radius: 8px;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: white;
            outline: none;
          }
        `}</style>
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-white"
              style={{
                fontFamily: "Public Sans, sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: "1.5em",
              }}
            >
              Create Credential
            </h3>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="w-6 h-6 flex items-center justify-center transition-colors hover:opacity-70"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm text-red-300">{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <FieldGroup label="Credential Name *">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Slack API Key"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "1.466em",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "0px 12px",
                  height: "40px",
                }}
              />
            </FieldGroup>

            <FieldGroup label="Type">
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none appearance-none"
                >
                  {CREDENTIAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{selectedType.description}</p>
            </FieldGroup>

            {form.type === "api_key" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <FieldGroup label="Key Name" slim>
                    <input
                      type="text"
                      value={form.data.key_name || ""}
                      onChange={(e) => updateData("key_name", e.target.value)}
                      className="input-slim"
                      placeholder="X-API-Key"
                    />
                  </FieldGroup>
                  <FieldGroup label="Location" slim>
                    <select
                      value={form.data.location || "header"}
                      onChange={(e) => updateData("location", e.target.value)}
                      className="input-slim"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Param</option>
                    </select>
                  </FieldGroup>
                </div>
                <FieldGroup label="Key Value" slim>
                  <input
                    type="password"
                    value={form.data.key_value || ""}
                    onChange={(e) => updateData("key_value", e.target.value)}
                    className="input-slim"
                    placeholder="sk-..."
                  />
                </FieldGroup>
              </>
            )}

            {form.type === "bearer" && (
              <FieldGroup label="Token" slim>
                <input
                  type="password"
                  value={form.data.token || ""}
                  onChange={(e) => updateData("token", e.target.value)}
                  className="input-slim"
                  placeholder="eyJhbGc..."
                />
              </FieldGroup>
            )}

            {form.type === "basic_auth" && (
              <>
                <FieldGroup label="Username" slim>
                  <input
                    type="text"
                    value={form.data.username || ""}
                    onChange={(e) => updateData("username", e.target.value)}
                    className="input-slim"
                    placeholder="service-account"
                  />
                </FieldGroup>
                <FieldGroup label="Password" slim>
                  <input
                    type="password"
                    value={form.data.password || ""}
                    onChange={(e) => updateData("password", e.target.value)}
                    className="input-slim"
                    placeholder="••••••••"
                  />
                </FieldGroup>
              </>
            )}

            {form.type === "oauth2" && (
              <>
                <FieldGroup label="Access Token" slim>
                  <input
                    type="password"
                    value={form.data.access_token || ""}
                    onChange={(e) => updateData("access_token", e.target.value)}
                    className="input-slim"
                    placeholder="ya29..."
                  />
                </FieldGroup>
                <FieldGroup label="Refresh Token (Optional)" slim>
                  <input
                    type="password"
                    value={form.data.refresh_token || ""}
                    onChange={(e) => updateData("refresh_token", e.target.value)}
                    className="input-slim"
                    placeholder="1//..."
                  />
                </FieldGroup>
              </>
            )}

            {form.type === "header" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Headers</label>
                {Object.entries(form.data.headers || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 h-10 px-3 rounded-lg"
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    <span className="flex-1 text-sm text-white font-mono truncate">
                      {key}: {value}
                    </span>
                    <button onClick={() => removeHeader(key)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={headerKey}
                    onChange={(e) => setHeaderKey(e.target.value)}
                    className="input-slim"
                    placeholder="Header-Name"
                  />
                  <input
                    type="text"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    className="input-slim"
                    placeholder="value"
                  />
                  <button
                    onClick={addHeader}
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: "rgba(19, 245, 132, 0.18)",
                      color: "#9EFBCD",
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end items-center gap-2.5 pt-2">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-lg transition-all focus:outline-none"
              style={{
                background: "rgba(255, 86, 48, 0.08)",
                color: "#FFAC82",
                height: "36px",
                padding: "0px 12px",
                fontFamily: "Public Sans, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "1.5em",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
              style={{
                background: "rgba(19, 245, 132, 0.12)",
                color: "#9EFBCD",
                height: "36px",
                padding: "0px 12px",
                fontFamily: "Public Sans, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "1.5em",
              }}
            >
              {loading ? "Creating..." : "Create Credential"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children, slim = false }) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-white"
        style={{
          fontFamily: "Public Sans, sans-serif",
          fontWeight: slim ? 500 : 600,
          fontSize: slim ? "13px" : "13px",
          lineHeight: "1em",
          color: "#919EAB",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}


