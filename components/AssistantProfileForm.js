import React, { useState, useEffect } from 'react';
import { Save, X, Building2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const INPUT_BASE_CLASSES =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all backdrop-blur-md shadow-inner';

const FieldBlock = ({ label, isRequired = false, children }) => (
  <label className="block space-y-2 text-white/80 text-sm">
    <span className="flex items-center gap-2 text-base">
      {label}
      {isRequired && <span className="text-white/50 text-xs">(required)</span>}
    </span>
    {children}
  </label>
);

const AssistantProfileForm = ({ assistant = null, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    business_meta: {
      industry_type: '',
      operating_hours: '',
      address: '',
      logo_url: ''
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name || '',
        description: assistant.description || '',
        business_meta: {
          industry_type: assistant.business_meta?.industry_type || '',
          operating_hours: assistant.business_meta?.operating_hours || '',
          address: assistant.business_meta?.address || '',
          logo_url: assistant.business_meta?.logo_url || ''
        }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        business_meta: {
          industry_type: '',
          operating_hours: '',
          address: '',
          logo_url: ''
        }
      });
    }
  }, [assistant, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = assistant 
        ? API_ENDPOINTS.ASSISTANT(assistant.id)
        : API_ENDPOINTS.ASSISTANTS;
      
      const method = assistant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save assistant');
      }

      const savedAssistant = await response.json();
      onSave(savedAssistant);
      onCancel();
    } catch (error) {
      console.error('Error saving assistant:', error);
      alert('Failed to save assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
        onClick={onCancel}
        style={{ WebkitBackdropFilter: 'blur(16px)' }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/8 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl shadow-black/60 animate-modal-in"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-white/10 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Agent Builder</p>
              <h2 className="text-2xl font-semibold text-white">Create/Edit Asistance</h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Section Labels */}
            <div className="md:w-52 space-y-20 text-white/80 text-lg font-semibold">
              <div>Basic Information</div>
              <div>Business Details</div>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-10">
              {/* Basic Info */}
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FieldBlock label="Name" isRequired>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="ex: voice"
                      className={INPUT_BASE_CLASSES}
                    />
                  </FieldBlock>

                  <FieldBlock label="Industry Type">
                    <div className="relative">
                      <select
                        value={formData.business_meta.industry_type}
                        onChange={(e) => handleInputChange('business_meta.industry_type', e.target.value)}
                        className={`${INPUT_BASE_CLASSES} appearance-none pr-10`}
                      >
                        <option value="">Select Type</option>
                        <option value="restaurant">Restaurant & Food Service</option>
                        <option value="retail">Retail & E-commerce</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="technology">Technology</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/40">
                        ▾
                      </div>
                    </div>
                  </FieldBlock>
                </div>

                <FieldBlock label="Description" isRequired>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    placeholder="Description"
                    className={`${INPUT_BASE_CLASSES} resize-none`}
                  />
                </FieldBlock>
              </div>

              {/* Business Details */}
              <div className="grid gap-6">
                <FieldBlock label="Operating Hours">
                  <input
                    type="text"
                    value={formData.business_meta.operating_hours}
                    onChange={(e) => handleInputChange('business_meta.operating_hours', e.target.value)}
                    placeholder="ex: 10 am to 8 pm"
                    className={INPUT_BASE_CLASSES}
                  />
                </FieldBlock>

                <FieldBlock label="Adress">
                  <input
                    type="text"
                    value={formData.business_meta.address}
                    onChange={(e) => handleInputChange('business_meta.address', e.target.value)}
                    placeholder="ex:"
                    className={INPUT_BASE_CLASSES}
                  />
                </FieldBlock>

                <FieldBlock label="Logo URL">
                  <input
                    type="url"
                    value={formData.business_meta.logo_url}
                    onChange={(e) => handleInputChange('business_meta.logo_url', e.target.value)}
                    placeholder="www.logo.com/esap"
                    className={INPUT_BASE_CLASSES}
                  />
                </FieldBlock>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-8 border-t border-white/10 mt-10">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-full border border-red-500/40 text-red-200 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 rounded-full bg-emerald-500/80 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {assistant ? 'Update Assistant' : 'Create Assistant'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal Animation Styles */}
        <style jsx>{`
          @keyframes modal-in {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          .animate-modal-in {
            animation: modal-in 0.2s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AssistantProfileForm; 