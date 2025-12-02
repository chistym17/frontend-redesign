import React, { useState, useRef, useEffect } from "react";
import { X, AlertCircle, Check, ChevronDown, Shield } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

const categories = [
  { value: "general", label: "General" },
  { value: "api", label: "API Integration" },
  { value: "data", label: "Data Processing" },
  { value: "notification", label: "Notification" },
  { value: "database", label: "Database" },
  { value: "ai", label: "AI/ML" }
];

export default function SaveTemplateModal({
  isOpen,
  onClose,
  assistantId,
  onGetCurrentFlow,
  onSuccess = () => {}
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "general",
    tags: "",
    is_public: false
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const categoryRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: "", description: "", category: "general", tags: "", is_public: false });
      setError("");
      setSuccess("");
      setCategoryDropdownOpen(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!onGetCurrentFlow) {
      setError("Cannot save template: no flow data available");
      return;
    }

    const currentFlow = onGetCurrentFlow();
    if (!currentFlow?.nodes?.length) {
      setError("Cannot save empty flow as template");
      return;
    }

    try {
      setError("");
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category,
        tags,
        is_public: form.is_public,
        flow_data: currentFlow
      };

      const response = await fetch(
        `${API_BASE}/templates/flow/create?assistant_id=${assistantId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create template");
      }

      await response.json();
      setSuccess(`Template "${form.name}" created successfully!`);
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create template");
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setCategoryDropdownOpen(false);
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-transparent"
        onClick={handleClose}
      />

      <div
        className="relative rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-auto shadow-2xl create-template-modal"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .create-template-modal select option {
                background: rgba(20, 25, 35, 0.9) !important;
                color: #FFFFFF !important;
                font-size: 12px;
                font-family: 'Public Sans', sans-serif;
                padding: 6px 8px;
              }
              .create-template-modal select option:checked,
              .create-template-modal select option:hover {
                background: rgba(19, 245, 132, 0.2) !important;
                color: #9EFBCD !important;
              }
            `
          }}
        />

        <div className="flex flex-col gap-3 p-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  lineHeight: "1.5em"
                }}
              >
                Save as Template
              </h3>
              <p
                className="text-white/60"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "1.4em"
                }}
              >
                Store this flow for future reuse
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-5 h-5 flex items-center justify-center transition-colors hover:opacity-70"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-2.5 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-red-300">{error}</span>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-2.5 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-emerald-300">{success}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="flex flex-col gap-3">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  lineHeight: "1em",
                  color: "#919EAB"
                }}
              >
                Template Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Customer Onboarding Flow"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  lineHeight: "1.4666666666666666em",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "0px 10px",
                  height: "36px"
                }}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  lineHeight: "1em",
                  color: "#919EAB"
                }}
              >
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what this template does..."
                rows={2}
                className="w-full rounded-lg text-white resize-none focus:outline-none"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  lineHeight: "1.4666666666666666em",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "12px 10px",
                  color: "#919EAB"
                }}
              />
            </div>

            {/* Category */}
            <div ref={categoryRef} className="flex flex-col gap-2">
              <label
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  lineHeight: "1em",
                  color: "#919EAB"
                }}
              >
                Category
              </label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg text-white appearance-none focus:outline-none pr-8"
                  style={{
                    fontFamily: "Public Sans, sans-serif",
                    fontWeight: 400,
                    fontSize: "13px",
                    lineHeight: "1.4666666666666666em",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    padding: "0px 10px",
                    height: "36px"
                  }}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  lineHeight: "1em",
                  color: "#919EAB"
                }}
              >
                Tags
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="lead, onboarding, automation"
                className="w-full rounded-lg text-white focus:outline-none"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  lineHeight: "1.4666666666666666em",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(145, 158, 171, 0.2)",
                  borderRadius: "8px",
                  padding: "0px 10px",
                  height: "36px",
                  color: "#919EAB"
                }}
              />
              <p
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "1.5em",
                  color: "#919EAB",
                  paddingTop: "6px"
                }}
              >
                Comma separated tags
              </p>
            </div>

            {/* Public Toggle */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                  className="rounded text-indigo-500 focus:ring-indigo-500"
                  style={{ width: "18px", height: "18px" }}
                />
                <label
                  className="text-white cursor-pointer"
                  style={{
                    fontFamily: "Public Sans, sans-serif",
                    fontWeight: 400,
                    fontSize: "13px",
                    lineHeight: "1.5714285714285714em",
                    color: "#FFFFFF"
                  }}
                >
                  Make Template Public
                </label>
              </div>
              <p
                className="text-white"
                style={{
                  fontFamily: "Public Sans, sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "1.5em",
                  color: "#919EAB"
                }}
              >
                Credentials and sensitive data are automatically removed before publishing.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center gap-2.5">
            <button
              onClick={handleClose}
              className="rounded-lg transition-all"
              style={{
                fontFamily: "Public Sans, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: "1.7142857142857142em",
                background: "rgba(255, 86, 48, 0.08)",
                color: "#FFAC82",
                padding: "0px 10px",
                height: "32px",
                borderRadius: "8px"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Public Sans, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: "1.7142857142857142em",
                background: "rgba(19, 245, 132, 0.08)",
                color: "#9EFBCD",
                padding: "0px 10px",
                height: "32px",
                borderRadius: "8px"
              }}
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
