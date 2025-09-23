import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Star } from 'lucide-react';
import Button from '../ui/Button';
import type { Question, Meeting, FormError, AttendanceFormData } from '../../types/attendance';

interface AttendanceFormProps {
  meeting: Meeting;
  onSubmit: (responses: Record<string, any>) => Promise<void>;
  onCancel: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ meeting, onSubmit, onCancel }) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FormError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error for this field
    setErrors(prev => prev.filter(error => error.questionId !== questionId));
  };

  const validateForm = (): FormError[] => {
    const newErrors: FormError[] = [];

    meeting.questionnaire.questions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];

        if (!response ||
            (typeof response === 'string' && response.trim() === '') ||
            (Array.isArray(response) && response.length === 0)) {
          newErrors.push({
            questionId: question.id,
            message: `${question.text} is required`
          });
        }
      }

      // Validate specific types
      if (responses[question.id]) {
        const response = responses[question.id];

        if (question.type === 'number' && isNaN(Number(response))) {
          newErrors.push({
            questionId: question.id,
            message: 'Please enter a valid number'
          });
        }

        if (question.type === 'rating' && question.maxRating) {
          const rating = Number(response);
          if (rating < 1 || rating > question.maxRating) {
            newErrors.push({
              questionId: question.id,
              message: `Rating must be between 1 and ${question.maxRating}`
            });
          }
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await onSubmit(responses);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setErrors([{
        questionId: '',
        message: error instanceof Error ? error.message : 'Failed to submit attendance'
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorForQuestion = (questionId: string): string | undefined => {
    return errors.find(error => error.questionId === questionId)?.message;
  };

  const renderQuestion = (question: Question) => {
    const error = getErrorForQuestion(question.id);
    const value = responses[question.id] || '';

    const baseInputClasses = `
      w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
      ${error ? 'border-red-500' : 'border-gray-300'}
    `;

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            className={baseInputClasses}
            placeholder={question.placeholder || 'Enter your answer'}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            className={`${baseInputClasses} h-24 resize-vertical`}
            placeholder={question.placeholder || 'Enter your answer'}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className={baseInputClasses}
            placeholder={question.placeholder || 'Enter a number'}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        );

      case 'yes_no':
        return (
          <div className="space-y-2">
            {['Yes', 'No'].map(option => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.toLowerCase()}
                  checked={value === option.toLowerCase()}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'single_select':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleInputChange(question.id, [...currentValues, option.value]);
                    } else {
                      handleInputChange(question.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const maxRating = question.maxRating || 5;
        return (
          <div className="flex space-x-1">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange(question.id, rating)}
                className={`p-1 rounded transition-colors ${
                  Number(value) >= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {value ? `${value}/${maxRating}` : `Rate 1-${maxRating}`}
            </span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            className={baseInputClasses}
            placeholder="Enter your answer"
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        );
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Attendance Recorded!</h3>
          <p className="text-gray-600 mb-6">
            Your attendance for "{meeting.title}" has been successfully recorded.
          </p>
          <Button onClick={onCancel} fullWidth>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-full overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{meeting.title}</h2>
            {meeting.description && (
              <p className="text-gray-600 mb-4">{meeting.description}</p>
            )}
            <div className="text-sm text-gray-500">
              <p>Date: {new Date(meeting.date).toLocaleDateString()}</p>
              <p>Time: {meeting.startTime}{meeting.endTime && ` - ${meeting.endTime}`}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{meeting.questionnaire.title}</h3>
              {meeting.questionnaire.description && (
                <p className="text-gray-600 mb-6">{meeting.questionnaire.description}</p>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {meeting.questionnaire.questions.map(question => (
                <div key={question.id} className="space-y-2">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <div className="mt-2">
                      {renderQuestion(question)}
                    </div>
                  </label>
                  {getErrorForQuestion(question.id) && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getErrorForQuestion(question.id)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* General Errors */}
            {errors.filter(error => !error.questionId).map((error, index) => (
              <div key={index} className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error.message}
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="sm:w-auto flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="sm:w-auto flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;