import React, { useState, useEffect } from "react";
import { UserPlus, Search, CheckCircle, Calendar, User } from "lucide-react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { recordAttendance, getActiveSessions, getMemberAttendanceForSession } from "../../services/attendanceService";
import { useNotifications } from "../../hooks/useNotifications";
import type { AttendanceSession, Member } from "../../types";
import logger from "../../utils/logger";

const ManualAttendance: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedMember, setSelectedMember] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [recentCheckIns, setRecentCheckIns] = useState<Set<string>>(new Set());

    const { showSuccess, showError } = useNotifications();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = members.filter((m) =>
                m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers(members);
        }
    }, [searchQuery, members]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load members
            const membersSnapshot = await getDocs(collection(db, "members"));
            const membersData = membersSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter((m: any) => m.status === "active" || m.status === "approved") as Member[];

            setMembers(membersData);
            setFilteredMembers(membersData);

            // Load active sessions
            const sessionsData = await getActiveSessions();
            setSessions(sessionsData);

            // Auto-select first active session if available
            if (sessionsData.length > 0 && !selectedSession) {
                setSelectedSession(sessionsData[0].id);
            }
        } catch (error) {
            logger.error("Error loading data:", error);
            showError("Failed to load members and sessions");
        } finally {
            setLoading(false);
        }
    };

    const checkIfAlreadyCheckedIn = async (memberId: string, sessionId: string): Promise<boolean> => {
        const existingRecord = await getMemberAttendanceForSession(sessionId, memberId);
        return existingRecord !== null;
    };

    const handleManualCheckIn = async () => {
        if (!selectedMember || !selectedSession) {
            showError("Please select both a member and a session");
            return;
        }

        try {
            setSubmitting(true);

            // Check if already checked in
            const alreadyCheckedIn = await checkIfAlreadyCheckedIn(selectedMember, selectedSession);
            if (alreadyCheckedIn) {
                showError("This member has already checked in for this session");
                return;
            }

            const member = members.find(m => m.id === selectedMember);
            if (!member) {
                showError("Member not found");
                return;
            }

            // Record attendance
            await recordAttendance({
                session_id: selectedSession,
                member_id: selectedMember,
                member_name: member.full_name,
                checked_in_at: Timestamp.now(),
                check_in_method: "manual",
                is_late: false, // Will be calculated in service
                status: "present",
            });

            showSuccess(`Successfully checked in ${member.full_name}`);

            // Add to recent check-ins for visual feedback
            setRecentCheckIns(prev => new Set([...prev, selectedMember]));

            // Clear selection
            setSelectedMember("");
            setSearchQuery("");

            // Remove from recent after 3 seconds
            setTimeout(() => {
                setRecentCheckIns(prev => {
                    const updated = new Set(prev);
                    updated.delete(selectedMember);
                    return updated;
                });
            }, 3000);
        } catch (error) {
            logger.error("Error recording attendance:", error);
            showError("Failed to record attendance");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Active Sessions
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        There are no active attendance sessions available. Create a new session to start recording attendance.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Manual Attendance Entry
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Record attendance for members who don't have access to QR scanning (e.g., no smartphone)
                </p>
            </div>

            {/* Session Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline-block h-4 w-4 mr-1" />
                    Select Session *
                </label>
                <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="">-- Select a session --</option>
                    {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                            {session.meeting_title} - {session.meeting_date.toDate().toLocaleDateString()} at {session.meeting_date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </option>
                    ))}
                </select>
            </div>

            {/* Member Search */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="inline-block h-4 w-4 mr-1" />
                    Search Member *
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Member List */}
            <div className="mb-6">
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {members.length === 0
                                ? "No active members found."
                                : "No members match your search."}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => setSelectedMember(member.id)}
                                    className={`p-3 cursor-pointer transition-colors ${
                                        selectedMember === member.id
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                    } ${
                                        recentCheckIns.has(member.id)
                                            ? "bg-green-50 dark:bg-green-900/20"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {member.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {member.email}
                                            </div>
                                        </div>
                                        {selectedMember === member.id && (
                                            <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        )}
                                        {recentCheckIns.has(member.id) && (
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                ✓ Checked In
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <Button
                onClick={handleManualCheckIn}
                disabled={!selectedMember || !selectedSession || submitting}
                loading={submitting}
                className="w-full"
            >
                <UserPlus className="h-4 w-4 mr-2" />
                Record Attendance
            </Button>

            {/* Info Box */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Manual check-ins will be marked with the current timestamp.
                    Late arrival status will be calculated automatically based on the meeting start time.
                </p>
            </div>
        </div>
    );
};

export default ManualAttendance;
