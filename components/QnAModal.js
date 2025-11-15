import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const INPUT_BASE_CLASSES =
  'w-full rounded-2xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all backdrop-blur';

const FieldBlock = ({ label, isRequired = false, children }) => (
  <label className="block space-y-2 text-white/80 text-sm">
    <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
      {label}
      {isRequired && <span className="text-white/40 normal-case tracking-normal">(required)</span>}
    </span>
    {children}
  </label>
);

const QnAModal = ({ assistantId, qa = null, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (qa) {
            setFormData({
                question: qa.question || '',
                answer: qa.answer || '',
                category: qa.category || ''
            });
        } else {
            setFormData({
                question: '',
                answer: '',
                category: ''
            });
        }
    }, [qa, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = qa
                ? API_ENDPOINTS.QA_UPDATE(assistantId, qa.id)
                : API_ENDPOINTS.QA_CREATE(assistantId);

            const method = qa ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to save Q&A');
            }

            const savedQa = await response.json();
            onSave(savedQa);
            onClose();
        } catch (error) {
            console.error('Error saving Q&A:', error);
            alert('Failed to save Q&A. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
                style={{ WebkitBackdropFilter: 'blur(16px)' }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-[620px] rounded-3xl shadow-[0_50px_160px_rgba(0,0,0,0.75)] animate-modal-in overflow-hidden"
                style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    border: '1px solid rgba(255, 255, 255, 0.14)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-60" />
                <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">{qa ? 'Edit Qna' : 'Add Qna'}</h2>
                        <p className="text-sm text-white/60 mt-1">Add a new question and answer pair</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <FieldBlock label="Question" isRequired>
                        <textarea
                            required
                            value={formData.question}
                            onChange={(e) => handleInputChange('question', e.target.value)}
                            rows={3}
                            placeholder="Type a common customer question..."
                            className={`${INPUT_BASE_CLASSES} resize-none`}
                        />
                    </FieldBlock>

                    <FieldBlock label="Answer" isRequired>
                        <textarea
                            required
                            value={formData.answer}
                            onChange={(e) => handleInputChange('answer', e.target.value)}
                            rows={5}
                            placeholder="Provide a detailed answer that your agent will use."
                            className={`${INPUT_BASE_CLASSES} resize-none`}
                        />
                    </FieldBlock>

                    <FieldBlock label="Category">
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            placeholder="e.g., Pricing, Hours, Services"
                            className={INPUT_BASE_CLASSES}
                        />
                    </FieldBlock>

                    {/* Action Buttons */}
                    <div className="flex justify-start gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-red-500/40 text-red-200 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-emerald-400/20 text-emerald-200 border border-emerald-300/40 hover:bg-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-300 border-t-transparent"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    {qa ? 'Update Q&A' : 'Save'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
                </div>
            </div>

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
    );
};

export default QnAModal;

