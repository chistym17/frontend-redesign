import React, { useState, useEffect } from "react";
import { Save, X, Building2 } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

const INPUT_BASE_CLASSES =
  'w-full rounded-lg  bg-white/0 px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all backdrop-blur';

const FieldBlock = ({ label, isRequired = false, children }) => (
  <label className="block space-y-2 text-white/80 text-sm">
    <span className="flex items-center gap-0 text-xs tracking-[0.2em] text-white/50">
      {label}
      {isRequired && <span className="text-red-400">*</span>}
    </span>
    {children}
  </label>
);

const AssistantProfileForm = ({ assistant = null, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    business_meta: {
      industry_type: "",
      operating_hours: "",
      address: "",
      logo_url: "",
    },
  });
  const [loading, setLoading] = useState(false);

  const industryOptions = [
  { value: "restaurant", label: "Restaurant & Food Service" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance & Banking" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Other" },
];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name || "",
        description: assistant.description || "",
        business_meta: {
          industry_type: assistant.business_meta?.industry_type || "",
          operating_hours: assistant.business_meta?.operating_hours || "",
          address: assistant.business_meta?.address || "",
          logo_url: assistant.business_meta?.logo_url || "",
        },
      });
    } else {
      setFormData({
        name: "",
        description: "",
        business_meta: { industry_type: "", operating_hours: "", address: "", logo_url: "" },
      });
    }
  }, [assistant, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = assistant ? API_ENDPOINTS.ASSISTANT(assistant.id) : API_ENDPOINTS.ASSISTANTS;
      const method = assistant ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save assistant");

      const savedAssistant = await response.json();
      onSave(savedAssistant);
      onCancel();
    } catch (error) {
      console.error(error);
      alert("Failed to save assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        style={{ WebkitBackdropFilter: "blur(16px)" }}
      />


        {/* Modal */}
      <div
          className="relative w-full max-w-[1200px] max-h-[95vh] flex flex-col p-4 gap-4 isolate rounded-3xl  overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(80, 80, 80, 0.24)",
          borderRadius: "24px",
        }}
          onClick={(e) => e.stopPropagation()}
        >

   

        {/* Header */}
        <div className="flex items-start justify-between   border-white/10 relative">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {assistant ? "Edit Assistant" : "Create Assistant"}
            </h2>
            <p className="text-sm text-white/60 mt-1">
              {assistant
                ? "Update the assistant details"
                : "Add a new assistant and its information"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 max-h-[70vh]">
      {/* Left Column: Labels */}
      <div className="hidden md:flex w-full md:w-48 flex-col gap-80 text-white/80 text-lg font-semibold">
      <div>Basic Information</div>
      <div>Business Details</div>
    </div>


  {/* Right Column: Inputs */}
  <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
    {/* Basic Info Inputs */}
    <div className="grid grid-cols-1 gap-6">
      <div className="md:hidden text-white/80 text-lg font-semibold mb-2">Basic Information</div>
      <FieldBlock label="Name" isRequired>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="ex: voice"
          className={INPUT_BASE_CLASSES}
        />
      </FieldBlock>

      <FieldBlock label="Industry Type">
        <div className="relative w-full mt-2">
          {/* Dropdown header */}
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex justify-between items-center p-2 bg-white/0 rounded-lg text-white text-sm cursor-pointer backdrop-blur-md transition hover:bg-white/20"
          >
            {formData.business_meta.industry_type
              ? industryOptions.find((cat) => cat.value === formData.business_meta.industry_type)?.label
              : "Select Type"}
            <span className="ml-2 text-xs opacity-70">▼</span>
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-black/80 rounded-lg backdrop-blur-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] z-50 max-h-48 overflow-y-scroll">
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div
                onClick={() => {
                  handleInputChange("business_meta.industry_type", "");
                  setDropdownOpen(false);
                }}
                className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
              >
                Select Type
              </div>
              {industryOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    handleInputChange("business_meta.industry_type", option.value);
                    setDropdownOpen(false);
                  }}
                  className="p-2 text-white text-sm hover:bg-white/20 cursor-pointer"
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </FieldBlock>

          <FieldBlock label="Description" isRequired className="md:col-span-2">
            <textarea
              required
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              placeholder="Description"
              className={`${INPUT_BASE_CLASSES} resize-none`}
            />
          </FieldBlock>
        </div>
        <div className="md:hidden text-white/80 text-lg font-semibold mb-2">Business Details</div>
            {/* Business Details Inputs */}
            <div className="grid grid-cols-1 gap-6">
              <FieldBlock label="Operating Hours">
                <input
                  type="text"
                  value={formData.business_meta.operating_hours}
                  onChange={(e) => handleInputChange("business_meta.operating_hours", e.target.value)}
                  placeholder="ex: 10 am to 8 pm"
                  className={INPUT_BASE_CLASSES}
                />
              </FieldBlock>

              <FieldBlock label="Address">
                <input
                  type="text"
                  value={formData.business_meta.address}
                  onChange={(e) => handleInputChange("business_meta.address", e.target.value)}
                  placeholder="ex:"
                  className={INPUT_BASE_CLASSES}
                />
              </FieldBlock>

              <FieldBlock label="Logo URL">
                <input
                  type="url"
                  value={formData.business_meta.logo_url}
                  onChange={(e) => handleInputChange("business_meta.logo_url", e.target.value)}
                  placeholder="www.logo.com/esap"
                  className={INPUT_BASE_CLASSES}
                />
              </FieldBlock>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-red-200 bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-lg"
              >
                {loading
                  ? "Saving..."
                  : assistant
                  ? "Update Assistant"
                  : "Create Assistant"}
              </button>
            </div>
          </div>
        </form>


        {/* Custom Scrollbar */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AssistantProfileForm;
