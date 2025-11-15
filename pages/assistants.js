import React, { useState } from 'react';
import AssistantList from '../components/AssistantList';
import AssistantProfileForm from '../components/AssistantProfileForm';
import QnAList from '../components/QnAList';
import QnAEditor from '../components/QnAEditor';

const AssistantsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showQaForm, setShowQaForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [viewingAssistant, setViewingAssistant] = useState(null);
  const [editingQa, setEditingQa] = useState(null);
  const [selectedAssistant, setSelectedAssistant] = useState(null);

  const handleEdit = (assistant) => {
    setEditingAssistant(assistant);
    setShowForm(true);
  };

  const handleView = (assistant) => {
    setViewingAssistant(assistant);
    setSelectedAssistant(assistant);
    setShowForm(false);
    setShowQaForm(false);
  };

  const handleSave = (savedAssistant) => {
    setShowForm(false);
    setEditingAssistant(null);
    setViewingAssistant(null);
    window.location.reload();
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowQaForm(false);
    setEditingAssistant(null);
    setViewingAssistant(null);
    setEditingQa(null);
  };

  const handleQaEdit = (qa) => {
    setEditingQa(qa);
    setShowQaForm(true);
  };

  const handleQaSave = (savedQa) => {
    setShowQaForm(false);
    setEditingQa(null);
    if (selectedAssistant) {
      setSelectedAssistant({ ...selectedAssistant });
    }
  };

  return (
    <div className="min-h-screen bg-[#141A21]">
      <div className="container mx-auto px-4 py-8">
        <AssistantProfileForm
          assistant={editingAssistant || viewingAssistant}
          isOpen={showForm}
          onSave={handleSave}
          onCancel={handleCancel}
        />
        {showQaForm ? (
          <QnAEditor
            assistantId={selectedAssistant?.id}
            qa={editingQa}
            onSave={handleQaSave}
            onCancel={handleCancel}
          />
        ) : selectedAssistant ? (
          <div className="space-y-6">
            {/* Assistant Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedAssistant.name}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {selectedAssistant.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(selectedAssistant)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Assistant
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAssistant(null);
                      setViewingAssistant(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </div>

            {/* Q&A Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <QnAList
                assistantId={selectedAssistant.id}
                onEdit={handleQaEdit}
              />
            </div>
          </div>
        ) : (
          <AssistantList
            onEdit={handleEdit}
            onView={handleView}
            onDelete={() => { }}
          />
        )}
      </div>
    </div>
  );
};

export default AssistantsPage; 