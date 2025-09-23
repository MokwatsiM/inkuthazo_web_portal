import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  QrCode,
  MoreVertical,
  Edit,
  Trash2,
  RotateCcw,
  Download,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CreateMeetingModal from '../components/meetings/CreateMeetingModal';
import { useAuth } from '../hooks/useAuth';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types/attendance';

const MeetingsPage: React.FC = () => {
  const { userDetails } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await meetingService.getMeetings();
      setMeetings(response.meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMeetingStatus = async (meetingId: string) => {
    try {
      await meetingService.toggleMeetingStatus(meetingId);
      await fetchMeetings(); // Refresh the list
    } catch (error) {
      console.error('Error toggling meeting status:', error);
      setError('Failed to update meeting status');
    }
  };

  const handleRegenerateQR = async (meetingId: string) => {
    try {
      await meetingService.regenerateQRCode(meetingId);
      await fetchMeetings(); // Refresh the list
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      setError('Failed to regenerate QR code');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      await meetingService.deleteMeeting(meetingId);
      await fetchMeetings(); // Refresh the list
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setError('Failed to delete meeting');
    }
  };

  const downloadQRCode = (meeting: Meeting) => {
    if (!meeting.qrCode) return;

    const link = document.createElement('a');
    link.href = meeting.qrCode;
    link.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meeting Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage meetings with attendance tracking
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Create Meeting
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Meetings List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">All Meetings</h3>
        </div>
        <div className="p-6">
          {meetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No Meetings Created</p>
              <p className="text-gray-400 mb-4">
                Create your first meeting to start tracking attendance.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create First Meeting
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map(meeting => (
                <div
                  key={meeting.id}
                  className={`border rounded-lg p-6 ${
                    meeting.isActive
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {meeting.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            meeting.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {meeting.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {meeting.description && (
                        <p className="text-gray-600 mb-4">{meeting.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(meeting.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatTime(meeting.startTime)}
                          {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {meeting.questionnaire.questions.length} questions
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500">
                        Created: {new Date(meeting.createdAt).toLocaleString()}
                        {meeting.updatedAt !== meeting.createdAt && (
                          <span className="ml-4">
                            Updated: {new Date(meeting.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* QR Code Actions */}
                      {meeting.qrCode && (
                        <div className="flex items-center space-x-1">
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => downloadQRCode(meeting)}
                            title="Download QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => handleRegenerateQR(meeting.id)}
                            title="Regenerate QR Code"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Status Toggle */}
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => handleToggleMeetingStatus(meeting.id)}
                        title={meeting.isActive ? 'Deactivate Meeting' : 'Activate Meeting'}
                      >
                        {meeting.isActive ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>

                      {/* More Actions */}
                      <div className="relative">
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => setSelectedMeeting(
                            selectedMeeting?.id === meeting.id ? null : meeting
                          )}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {selectedMeeting?.id === meeting.id && (
                          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  // TODO: Open edit modal
                                  setSelectedMeeting(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Meeting
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Open attendance view
                                  setSelectedMeeting(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Attendance
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Export attendance
                                  setSelectedMeeting(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export Data
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  handleDeleteMeeting(meeting.id);
                                  setSelectedMeeting(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Meeting
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* QR Code Preview */}
                  {meeting.qrCode && meeting.isActive && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">
                            QR Code for Attendance
                          </h5>
                          <p className="text-sm text-gray-600">
                            Members can scan this code to mark their attendance
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <img
                            src={meeting.qrCode}
                            alt={`QR Code for ${meeting.title}`}
                            className="w-16 h-16 border border-gray-200 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Meeting Modal */}
      <CreateMeetingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={fetchMeetings}
      />
    </div>
  );
};

export default MeetingsPage;