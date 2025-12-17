import React from "react";
import { Calendar, Clock, MapPin, Users, QrCode, XCircle } from "lucide-react";
import { format } from "date-fns";
import Button from "../ui/Button";
import type { AttendanceSessionSummary } from "../../types";

interface AttendanceSessionCardProps {
    session: AttendanceSessionSummary;
    onViewQR: (session: AttendanceSessionSummary) => void;
    onViewAttendees: (session: AttendanceSessionSummary) => void;
    onCloseSession?: (session: AttendanceSessionSummary) => void;
}

const AttendanceSessionCard: React.FC<AttendanceSessionCardProps> = ({
    session,
    onViewQR,
    onViewAttendees,
    onCloseSession,
}) => {
    const expiresAt = session.expires_at.toDate();
    const isExpired = expiresAt < new Date();
    const isActive = session.is_active && !isExpired;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4">
                {/* Header with status */}
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
                        {session.meeting_title}
                    </h3>
                    <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : isExpired
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                    >
                        {isActive ? "Active" : isExpired ? "Expired" : "Closed"}
                    </span>
                </div>

                {/* Session details */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{format(session.meeting_date.toDate(), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{format(session.meeting_date.toDate(), "h:mm a")}</span>
                    </div>
                    {session.venue && (
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{session.venue}</span>
                        </div>
                    )}
                    <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>
                            {session.attendee_count} attendee{session.attendee_count !== 1 ? "s" : ""}
                            {session.max_attendees && ` / ${session.max_attendees} max`}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onViewQR(session)}
                        className="flex items-center"
                    >
                        <QrCode className="h-4 w-4 mr-1" />
                        View QR
                    </Button>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onViewAttendees(session)}
                        className="flex items-center"
                    >
                        <Users className="h-4 w-4 mr-1" />
                        Attendees
                    </Button>
                    {isActive && onCloseSession && (
                        <Button
                            variant="danger"
                            size="small"
                            onClick={() => onCloseSession(session)}
                            className="flex items-center"
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Close
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceSessionCard;
