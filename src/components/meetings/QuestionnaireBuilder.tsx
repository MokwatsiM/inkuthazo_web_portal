import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import Button from '../ui/Button';
import type { Question, QuestionType, QuestionOption, Questionnaire } from '../../types/attendance';
import { v4 as uuidv4 } from 'uuid';

interface QuestionnaireBuilderProps {
  questionnaire: Questionnaire;
  onChange: (questionnaire: Questionnaire) => void;
}

const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  questionnaire,
  onChange
}) => {
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'single_select', label: 'Single Choice' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'rating', label: 'Rating' }
  ];

  const updateQuestionnaire = (updates: Partial<Questionnaire>) => {
    onChange({ ...questionnaire, ...updates });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      text: 'New Question',
      type: 'text',
      required: false
    };

    updateQuestionnaire({
      questions: [...questionnaire.questions, newQuestion]
    });

    setEditingQuestion(newQuestion.id);
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    const updatedQuestions = questionnaire.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    );

    updateQuestionnaire({ questions: updatedQuestions });
  };

  const removeQuestion = (questionId: string) => {
    const updatedQuestions = questionnaire.questions.filter(q => q.id !== questionId);
    updateQuestionnaire({ questions: updatedQuestions });
    setEditingQuestion(null);
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const questions = [...questionnaire.questions];
    const index = questions.findIndex(q => q.id === questionId);

    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < questions.length - 1)
    ) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      updateQuestionnaire({ questions });
    }
  };

  const addOption = (questionId: string) => {
    const question = questionnaire.questions.find(q => q.id === questionId);
    if (!question) return;

    const newOption: QuestionOption = {
      id: uuidv4(),
      label: 'Option',
      value: 'option'
    };

    const options = question.options || [];
    updateQuestion(questionId, {
      options: [...options, newOption]
    });
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
    const question = questionnaire.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const updatedOptions = question.options.map(opt =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    );

    updateQuestion(questionId, { options: updatedOptions });
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = questionnaire.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const updatedOptions = question.options.filter(opt => opt.id !== optionId);
    updateQuestion(questionId, { options: updatedOptions });
  };

  const renderQuestionEditor = (question: Question) => {
    const isEditing = editingQuestion === question.id;

    return (
      <div
        key={question.id}
        className={`border rounded-lg p-4 space-y-4 ${
          isEditing ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            <span className="text-sm font-medium text-gray-500">
              Question {questionnaire.questions.indexOf(question) + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="small"
              variant="ghost"
              onClick={() => setEditingQuestion(isEditing ? null : question.id)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="small"
              variant="ghost"
              onClick={() => removeQuestion(question.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text
          </label>
          <input
            type="text"
            value={question.text}
            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your question"
          />
        </div>

        {isEditing && (
          <>
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, {
                  type: e.target.value as QuestionType,
                  options: ['single_select', 'multiple_choice'].includes(e.target.value) ? [] : undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Required Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Required
              </label>
            </div>

            {/* Placeholder for text/textarea */}
            {['text', 'textarea', 'number'].includes(question.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={question.placeholder || ''}
                  onChange={(e) => updateQuestion(question.id, { placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            {/* Rating Max Value */}
            {question.type === 'rating' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Rating
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={question.maxRating || 5}
                  onChange={(e) => updateQuestion(question.id, { maxRating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Options for single_select and multiple_choice */}
            {['single_select', 'multiple_choice'].includes(question.type) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Options
                  </label>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => addOption(question.id)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {(question.options || []).map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateOption(question.id, option.id, {
                          label: e.target.value,
                          value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Option text"
                      />
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => removeOption(question.id, option.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Question Preview */}
        {!isEditing && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              Preview: {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Type: {questionTypes.find(t => t.value === question.type)?.label}
              {question.options && ` (${question.options.length} options)`}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Questionnaire Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Questionnaire Title
          </label>
          <input
            type="text"
            value={questionnaire.title}
            onChange={(e) => updateQuestionnaire({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter questionnaire title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={questionnaire.description || ''}
            onChange={(e) => updateQuestionnaire({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter description for the questionnaire"
          />
        </div>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Questions</h3>
          <Button onClick={addQuestion} icon={Plus}>
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {questionnaire.questions.map(question => renderQuestionEditor(question))}

          {questionnaire.questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No questions added yet.</p>
              <p className="text-sm">Click "Add Question" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireBuilder;