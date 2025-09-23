import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText } from 'lucide-react';
import Button from '../ui/Button';
import QuestionnaireBuilder from './QuestionnaireBuilder';
import { useAuth } from '../../hooks/useAuth';
import { meetingService } from '../../services/meetingService';
import type { Meeting, Questionnaire } from '../../types/attendance';
import { v4 as uuidv4 } from 'uuid';

interface CreateMeetingModalProps {
  meeting?: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onSave
}) => {
  const { userDetails } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Meeting>>(() => {
    if (meeting) {
      return {
        title: meeting.title,
        description: meeting.description,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        questionnaire: meeting.questionnaire,
        isActive: meeting.isActive
      };
    }

    return {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      isActive: true,
      questionnaire: {
        id: uuidv4(),
        title: 'Meeting Attendance Form',
        description: '',
        questions: []
      }
    };
  });

  const steps = [
    { title: 'Meeting Details', icon: Calendar },
    { title: 'Questionnaire', icon: FileText }
  ];

  const handleInputChange = (field: keyof Meeting, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleQuestionnaireChange = (questionnaire: Questionnaire) => {
    handleInputChange('questionnaire', questionnaire);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.title?.trim()) {
          setError('Meeting title is required');
          return false;
        }
        if (!formData.date) {
          setError('Meeting date is required');
          return false;
        }
        if (!formData.startTime) {
          setError('Start time is required');
          return false;
        }
        // Validate date is not in the past
        const meetingDate = new Date(`${formData.date}T${formData.startTime}`);
        if (meetingDate < new Date() && !meeting) {
          setError('Meeting date and time cannot be in the past');
          return false;
        }
        break;
      case 1:
        if (!formData.questionnaire?.title?.trim()) {
          setError('Questionnaire title is required');
          return false;
        }
        if (!formData.questionnaire?.questions || formData.questionnaire.questions.length === 0) {
          setError('At least one question is required');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !userDetails?.id) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (meeting) {
        // Update existing meeting
        await meetingService.updateMeeting(meeting.id, formData);
      } else {
        // Create new meeting
        await meetingService.createMeeting({
          ...formData,
          createdBy: userDetails.id
        } as Omit<Meeting, 'id' | 'qrCode' | 'qrToken' | 'createdAt' | 'updatedAt'>);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to save meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMeetingDetails = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Meeting Title *
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter meeting title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter meeting description (optional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Meeting location (optional)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            type="time"
            value={formData.startTime || ''}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={formData.endTime || ''}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.isActive || false}
          onChange={(e) => handleInputChange('isActive', e.target.checked)}
          className="text-blue-600 focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Activate meeting immediately
        </label>
      </div>
    </div>
  );

  const renderQuestionnaire = () => (
    <div>
      {formData.questionnaire && (
        <QuestionnaireBuilder
          questionnaire={formData.questionnaire}
          onChange={handleQuestionnaireChange}
        />
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {meeting ? 'Edit Meeting' : 'Create New Meeting'}
              </h2>
              <p className="text-gray-600 mt-1">
                {steps[currentStep].title}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4 mt-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? (
                    <span>✓</span>
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 0 && renderMeetingDetails()}
          {currentStep === 1 && renderQuestionnaire()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {meeting ? 'Update Meeting' : 'Create Meeting'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeetingModal;