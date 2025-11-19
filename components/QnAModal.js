import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
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
                
                <div className="relative z-40">
                {/* Header */}
                <div className="flex items-start justify-between p-4  border-white/10">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">{qa ? 'Edit Qna' : 'Add Qna'}</h2>
                        <p className="text-sm text-white/60 mt-1">
                            {qa ? 'Update the question and answer pair' : 'Add a new question and answer pair'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    <FieldBlock label="Question" isRequired>
                        <textarea
                            required
                            value={formData.question}
                            onChange={(e) => handleInputChange('question', e.target.value)}
                            rows={3}
                            placeholder="Type a common customer question..."
                            className={`${INPUT_BASE_CLASSES} resize-none h-10`}
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
                    <div className="flex justify-start gap-3 pt-4">
                        {/* Cancel Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-[71px] h-[36px] px-3 py-0 flex items-center justify-center gap-2 
                                    text-[#FFAC82] bg-[rgba(255,86,48,0.08)] rounded-lg font-bold text-sm"
                        >
                            Cancel
                        </button>

                        {/* Save / Update Q&A Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-[64px] h-[36px] px-3 py-0 flex items-center justify-center gap-2 
                                    text-[#9EFBCD] bg-[rgba(19,245,132,0.08)] rounded-lg font-bold text-sm"
                        >
                            {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-transparent"></div>
                                Saving...
                            </>
                            ) : (
                            <>{qa ? 'Update' : 'Save'}</>
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

