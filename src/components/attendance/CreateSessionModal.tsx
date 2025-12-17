import React, { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { X, Calendar, MapPin, Clock, Users } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { createAttendanceSession } from "../../services/attendanceService";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import type { AttendanceSession } from "../../types";

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionCreated: (session: AttendanceSession) => void;
    eventId?: string;
    eventTitle?: string;
    eventDate?: Date;
    eventVenue?: string;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
    isOpen,
    onClose,
    onSessionCreated,
    eventId,
    eventTitle = "",
    eventDate,
    eventVenue = "",
}) => {
    const { user } = useAuth();
    const { showError, showSuccess } = useNotifications();

    const [meetingTitle, setMeetingTitle] = useState(eventTitle);
    const [meetingDate, setMeetingDate] = useState(
        eventDate ? eventDate.toISOString().slice(0, 16) : ""
    );
    const [venue, setVenue] = useState(eventVenue);
    const [expiryHours, setExpiryHours] = useState(2);
    const [maxAttendees, setMaxAttendees] = useState<number | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!meetingTitle.trim()) {
            showError("Meeting title is required");
            return;
        }

        if (!meetingDate) {
            showError("Meeting date is required");
            return;
        }

        if (!user) {
            showError("You must be logged in to create a session");
            return;
        }

        setIsSubmitting(true);

        try {
            const meetingTimestamp = Timestamp.fromDate(new Date(meetingDate));
            const expiresAt = Timestamp.fromDate(
                new Date(new Date(meetingDate).getTime() + expiryHours * 60 * 60 * 1000)
            );

            const session = await createAttendanceSession({
                event_id: eventId,
                meeting_title: meetingTitle.trim(),
                meeting_date: meetingTimestamp,
                venue: venue.trim() || undefined,
                created_by: user.uid,
                expires_at: expiresAt,
                is_active: true,
                max_attendees: maxAttendees,
            });

            showSuccess("Attendance session created successfully");
            onSessionCreated(session);
            onClose();
        } catch (error) {
            console.error("Error creating session:", error);
            showError("Failed to create attendance session");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setMeetingTitle(eventTitle);
        setMeetingDate(eventDate ? eventDate.toISOString().slice(0, 16) : "");
        setVenue(eventVenue);
        setExpiryHours(2);
        setMaxAttendees(undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                    onClick={handleClose}
                />

                {/* Modal panel */}
                <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Create Attendance Session
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Meeting Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Calendar className="inline-block h-4 w-4 mr-1" />
                                        Meeting Title *
                                    </label>
                                    <Input
                                        type="text"
                                        value={meetingTitle}
                                        onChange={(e) => setMeetingTitle(e.target.value)}
                                        placeholder="e.g., Monthly General Meeting"
                                        required
                                    />
                                </div>

                                {/* Meeting Date & Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Clock className="inline-block h-4 w-4 mr-1" />
                                        Meeting Date & Time *
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={meetingDate}
                                        onChange={(e) => setMeetingDate(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Venue */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <MapPin className="inline-block h-4 w-4 mr-1" />
                                        Venue
                                    </label>
                                    <Input
                                        type="text"
                                        value={venue}
                                        onChange={(e) => setVenue(e.target.value)}
                                        placeholder="e.g., Community Hall"
                                    />
                                </div>

                                {/* QR Code Expiry */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Clock className="inline-block h-4 w-4 mr-1" />
                                        QR Code Valid For (hours)
                                    </label>
                                    <select
                                        value={expiryHours}
                                        onChange={(e) => setExpiryHours(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value={1}>1 hour</option>
                                        <option value={2}>2 hours</option>
                                        <option value={3}>3 hours</option>
                                        <option value={4}>4 hours</option>
                                        <option value={6}>6 hours</option>
                                        <option value={8}>8 hours</option>
                                        <option value={12}>12 hours</option>
                                        <option value={24}>24 hours</option>
                                    </select>
                                </div>

                                {/* Max Attendees */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Users className="inline-block h-4 w-4 mr-1" />
                                        Maximum Attendees (optional)
                                    </label>
                                    <Input
                                        type="number"
                                        value={maxAttendees || ""}
                                        onChange={(e) =>
                                            setMaxAttendees(e.target.value ? Number(e.target.value) : undefined)
                                        }
                                        placeholder="Leave empty for unlimited"
                                        min={1}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto sm:ml-3"
                            >
                                {isSubmitting ? "Creating..." : "Create Session"}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleClose}
                                className="mt-3 w-full sm:mt-0 sm:w-auto"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSessionModal;
