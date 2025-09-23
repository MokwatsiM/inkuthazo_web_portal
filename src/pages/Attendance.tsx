import React, { useState, useEffect } from 'react';
import { QrCode, Calendar, Clock, Users, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import QRScanner from '../components/attendance/QRScanner';
import AttendanceForm from '../components/attendance/AttendanceForm';
import { useAuth } from '../hooks/useAuth';
import { meetingService } from '../services/meetingService';
import type { Meeting, Attendance } from '../types/attendance';

const AttendancePage: React.FC = () => {
  const { userDetails } = useAuth();
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [userAttendance, setUserAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [userDetails?.id]);

  const fetchData = async () => {
    if (!userDetails?.id) return;

    try {
      setLoading(true);
      setError('');

      const [meetingsResponse, attendanceData] = await Promise.all([
        meetingService.getActiveMeetings(),
        meetingService.getMemberAttendance(userDetails.id)
      ]);

      setActiveMeetings(meetingsResponse);
      setUserAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (meeting: Meeting) => {
    setShowScanner(false);
    setSelectedMeeting(meeting);
  };

  const handleAttendanceSubmit = async (responses: Record<string, any>) => {
    if (!selectedMeeting || !userDetails?.id || !userDetails?.full_name) {
      throw new Error('Missing required information');
    }

    await meetingService.submitAttendance(
      selectedMeeting.id,
      userDetails.id,
      userDetails.full_name,
      responses
    );

    // Refresh data to show updated attendance
    await fetchData();
  };

  const handleCloseForm = () => {
    setSelectedMeeting(null);
  };

  const handleCloseScannerr = () => {
    setShowScanner(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const hasAttendedMeeting = (meetingId: string): boolean => {
    return userAttendance.some(attendance => attendance.meetingId === meetingId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meeting Attendance</h2>
          <p className="text-gray-600 mt-1">
            Scan QR codes to mark your attendance at meetings
          </p>
        </div>
        <Button
          icon={QrCode}
          onClick={() => setShowScanner(true)}
          disabled={activeMeetings.length === 0}
        >
          Scan QR Code
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Active Meetings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Active Meetings
          </h3>
        </div>
        <div className="p-6">
          {activeMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No Active Meetings</p>
              <p className="text-gray-400">
                There are currently no meetings available for attendance.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMeetings.map(meeting => {
                const attended = hasAttendedMeeting(meeting.id);
                return (
                  <div
                    key={meeting.id}
                    className={`border rounded-lg p-4 ${
                      attended
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">
                        {meeting.title}
                      </h4>
                      {attended && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(meeting.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(meeting.startTime)}
                        {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                      </div>
                      {meeting.location && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {meeting.location}
                        </div>
                      )}
                    </div>

                    {meeting.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {meeting.description}
                      </p>
                    )}

                    <div className="mt-4">
                      {attended ? (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Attendance Recorded
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Scan QR code to mark attendance
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            My Recent Attendance
          </h3>
        </div>
        <div className="p-6">
          {userAttendance.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userAttendance.slice(0, 5).map(attendance => {
                const meeting = activeMeetings.find(m => m.id === attendance.meetingId);
                return (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Meeting ID: {attendance.meetingId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(attendance.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={handleCloseScannerr}
        />
      )}

      {/* Attendance Form Modal */}
      {selectedMeeting && (
        <AttendanceForm
          meeting={selectedMeeting}
          onSubmit={handleAttendanceSubmit}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default AttendancePage;