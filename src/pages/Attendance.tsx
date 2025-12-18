import React, { useState, useEffect } from "react";
import { Plus, QrCode, History, RefreshCw, UserPlus } from "lucide-react";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorBoundary from "../components/error/ErrorBoundary";
import {
    CreateSessionModal,
    QRCodeDisplay,
    AttendanceSessionCard,
    AttendanceListModal,
    QRScanner,
    AttendanceHistory,
    ManualAttendance,
} from "../components/attendance";
import {
    getAttendanceSessionsWithCounts,
    closeAttendanceSession,
} from "../services/attendanceService";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import type { AttendanceSession, AttendanceSessionSummary } from "../types";

type Tab = "sessions" | "scan" | "history" | "manual";

const Attendance: React.FC = () => {
    const { isAdmin } = useAuth();
    const { showSuccess, showError } = useNotifications();

    // State for admin
    const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSessionForQR, setSelectedSessionForQR] = useState<AttendanceSession | null>(null);
    const [selectedSessionForAttendees, setSelectedSessionForAttendees] = useState<AttendanceSession | null>(null);

    // State for member
    const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? "sessions" : "scan");

    // Filter state for admin
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    useEffect(() => {
        if (isAdmin) {
            loadSessions();
        }
    }, [isAdmin, showActiveOnly]);

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const data = await getAttendanceSessionsWithCounts({
                is_active: showActiveOnly ? true : undefined,
            });
            setSessions(data);
        } catch (error) {
            console.error("Error loading sessions:", error);
            showError("Failed to load attendance sessions");
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleSessionCreated = (session: AttendanceSession) => {
        setSelectedSessionForQR(session);
        loadSessions();
    };

    const handleCloseSession = async (session: AttendanceSessionSummary) => {
        if (!confirm(`Are you sure you want to close the session "${session.meeting_title}"? Members will no longer be able to check in.`)) {
            return;
        }

        try {
            await closeAttendanceSession(session.id);
            showSuccess("Session closed successfully");
            loadSessions();
        } catch (error) {
            console.error("Error closing session:", error);
            showError("Failed to close session");
        }
    };

    // Admin View
    const renderAdminView = () => (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Attendance Management
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Create QR codes for meetings and track member attendance
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => loadSessions()}
                        disabled={loadingSessions}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingSessions ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Session
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("sessions")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "sessions"
                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                    >
                        <QrCode className="inline-block h-4 w-4 mr-2" />
                        Sessions
                    </button>
                    <button
                        onClick={() => setActiveTab("manual")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "manual"
                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                    >
                        <UserPlus className="inline-block h-4 w-4 mr-2" />
                        Manual Entry
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "sessions" && (
                <>
                    {/* Filter Toggle */}
                    <div className="mb-6">
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showActiveOnly}
                                onChange={(e) => setShowActiveOnly(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Show active sessions only
                            </span>
                        </label>
                    </div>

            {/* Sessions Grid */}
            {loadingSessions ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : sessions.length === 0 ? (
                <EmptyState
                    icon={QrCode}
                    title="No Attendance Sessions"
                    description={
                        showActiveOnly
                            ? "No active sessions found. Create a new session to start tracking attendance."
                            : "No sessions found. Create your first attendance session."
                    }
                    action={{
                        label: "Create Session",
                        onClick: () => setShowCreateModal(true),
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => (
                        <AttendanceSessionCard
                            key={session.id}
                            session={session}
                            onViewQR={(s) => setSelectedSessionForQR(s)}
                            onViewAttendees={(s) => setSelectedSessionForAttendees(s)}
                            onCloseSession={handleCloseSession}
                        />
                    ))}
                </div>
            )}
                </>
            )}

            {activeTab === "manual" && <ManualAttendance />}

            {/* Modals */}
            <CreateSessionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSessionCreated={handleSessionCreated}
            />

            {selectedSessionForQR && (
                <QRCodeDisplay
                    session={selectedSessionForQR}
                    isOpen={!!selectedSessionForQR}
                    onClose={() => setSelectedSessionForQR(null)}
                />
            )}

            {selectedSessionForAttendees && (
                <AttendanceListModal
                    session={selectedSessionForAttendees}
                    isOpen={!!selectedSessionForAttendees}
                    onClose={() => setSelectedSessionForAttendees(null)}
                />
            )}
        </div>
    );

    // Member View
    const renderMemberView = () => (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Attendance
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Scan QR codes to record your attendance at meetings
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("scan")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "scan"
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <QrCode className="inline-block h-4 w-4 mr-2" />
                        Scan QR Code
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "history"
                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <History className="inline-block h-4 w-4 mr-2" />
                        My History
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "scan" && (
                <ErrorBoundary
                    fallback={
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="text-center">
                                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    QR Scanner Error
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    The QR scanner encountered an error. This might be due to camera permissions or browser compatibility.
                                </p>
                                <Button onClick={() => window.location.reload()}>
                                    Reload Page
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <QRScanner />
                </ErrorBoundary>
            )}
            {activeTab === "history" && <AttendanceHistory />}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {isAdmin ? renderAdminView() : renderMemberView()}
        </div>
    );
};

export default Attendance;
