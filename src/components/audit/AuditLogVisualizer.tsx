import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Search, Filter, ChevronDown, ChevronUp, Clock, User, Activity, Trash2, AlertTriangle, Info } from 'lucide-react';
import { AuditLog, getAuditLogs, AuditFilter, getOldLogsCount, bulkDeleteOldLogs } from '../../services/auditService';
import Button from '../ui/Button';
import logger from '../../utils/logger';

const AuditLogVisualizer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [oldLogsCount, setOldLogsCount] = useState(0);
    const [deletingOldLogs, setDeletingOldLogs] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [filters, setFilters] = useState<AuditFilter>({
        limitCount: 50
    });

    const fetchLogs = async () => {
        setLoading(true);

        try {
            const result = await getAuditLogs(filters);

            setLogs(result.logs);
            setTotalLogs(result.logs.length);

            // Fetch names for all userIds that we don't have yet
            const potentialUserIds = new Set<string>();
            result.logs.forEach(log => {
                potentialUserIds.add(log.userId);
                if (log.details) {
                    if ((log.details as any).member_id) potentialUserIds.add((log.details as any).member_id);
                    if ((log.details as any).target_member_id) potentialUserIds.add((log.details as any).target_member_id);
                    if ((log.details as any).requester_id) potentialUserIds.add((log.details as any).requester_id);
                }
            });

            const missingUserIds = [...potentialUserIds]
                .filter(id => id && !userNames[id] && id !== 'system' && id !== 'admin') as string[];

            if (missingUserIds.length > 0) {
                try {
                    const { batchFetchMembers } = await import('../../services/memberService');
                    const membersMap = await batchFetchMembers(missingUserIds);
                    const newNames: Record<string, string> = {};
                    membersMap.forEach((member, id) => {
                        newNames[id] = member.full_name;
                    });
                    setUserNames(prev => ({ ...prev, ...newNames }));
                } catch (nameError) {
                    logger.error('Error fetching user names:', nameError);
                }
            }
        } catch (error) {
            logger.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOldLogsCount = async () => {
        try {
            const count = await getOldLogsCount(3);
            setOldLogsCount(count);
        } catch (error) {
            logger.error('Error fetching old logs count:', error);
        }
    };

    const handleBulkDelete = async () => {
        setDeletingOldLogs(true);
        try {
            let totalDeleted = 0;
            let batchCount = 0;

            // Keep deleting until no more old logs
            while (true) {
                const deleted = await bulkDeleteOldLogs(3);
                if (deleted === 0) break;

                totalDeleted += deleted;
                batchCount++;

                // Safety check - max 20 batches (10,000 documents)
                if (batchCount >= 20) break;
            }

            setShowDeleteConfirm(false);
            await fetchLogs();
            await fetchOldLogsCount();

            alert(`Successfully deleted ${totalDeleted} logs older than 3 months.`);
        } catch (error) {
            logger.error('Error bulk deleting logs:', error);
            alert('Failed to delete old logs. Please try again.');
        } finally {
            setDeletingOldLogs(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchOldLogsCount();
    }, [filters]);

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value || undefined
        }));
    };

    const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
        setFilters(prev => ({
            ...prev,
            [name]: value ? new Date(value) : undefined
        }));
    };

    const getUserDisplayName = (id: string, nameFromLog?: string) => {
        if (nameFromLog && nameFromLog !== 'Unknown') return nameFromLog;
        if (userNames[id]) return userNames[id];
        if (id === 'system') return 'System';
        if (id === 'admin') return 'Administrator';
        return id;
    };

    const resolveValue = (key: string, value: any) => {
        if (typeof value === 'string' && (key.includes('id') || key.includes('user') || key.includes('member'))) {
            if (userNames[value]) return userNames[value];
        }
        if (typeof value === 'object' && value !== null) return JSON.stringify(value);
        return String(value ?? 'None');
    };

    // Helper function to get color for action types
    const getActionColor = (action: string): string => {
        if (action.includes('DELETE') || action.includes('REJECT')) return 'red';
        if (action.includes('CREATE') || action.includes('SIGNUP')) return 'green';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'blue';
        if (action.includes('REVIEW') || action.includes('APPROVE')) return 'purple';
        if (action.includes('PAID') || action.includes('PAYOUT')) return 'teal';
        return 'gray';
    };

    return (
        <div className="space-y-6">
            {/* Old Logs Warning Banner */}
            {oldLogsCount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                    Old Audit Logs Detected
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    There are <span className="font-semibold text-amber-600 dark:text-amber-400">{oldLogsCount} logs</span> older than 3 months.
                                    Consider deleting them to improve performance.
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Info className="w-4 h-4" />
                                    <span>This will permanently delete logs from the database in batches.</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deletingOldLogs}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deletingOldLogs ? 'Deleting...' : 'Delete Old Logs'}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Bulk Delete</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            You are about to permanently delete <span className="font-semibold text-red-600 dark:text-red-400">{oldLogsCount} audit logs</span> that are older than 3 months.
                            This will process up to 10,000 logs in batches. Are you sure you want to continue?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deletingOldLogs}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={deletingOldLogs}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingOldLogs ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Audit Logs</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {totalLogs} {totalLogs === 1 ? 'log' : 'logs'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User ID</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            name="userId"
                            placeholder="Search by User ID..."
                            onChange={handleFilterChange}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="w-48">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action</label>
                    <select
                        name="action"
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    >
                        <option value="">All Actions</option>
                        <option value="MEMBER_SIGNUP">Member Signup</option>
                        <option value="MEMBER_CREATE">Member Create</option>
                        <option value="MEMBER_UPDATE">Member Update</option>
                        <option value="MEMBER_DELETE_REQUEST">Member Delete Request</option>
                        <option value="CLAIM_CREATE">Claim Create</option>
                        <option value="CLAIM_REVIEW">Claim Review</option>
                        <option value="CONTRIBUTION_CREATE">Contribution Create</option>
                        <option value="CONTRIBUTION_UPDATE">Contribution Update</option>
                        <option value="CONTRIBUTION_REVIEW">Contribution Review</option>
                        <option value="DONATION_CREATE">Donation Create</option>
                        <option value="DONATION_UPDATE">Donation Update</option>
                        <option value="DONATION_REVIEW">Donation Review</option>
                        <option value="DONATION_DELETE">Donation Delete</option>
                        <option value="DONATION_RECEIPT_ISSUED">Donation Receipt Issued</option>
                        <option value="DONATION_BULK_APPROVE">Donation Bulk Approve</option>
                        <option value="EXPENSE_CREATE">Expense Create</option>
                        <option value="EXPENSE_UPDATE">Expense Update</option>
                        <option value="EXPENSE_PAID">Expense Paid</option>
                        <option value="CONFIG_CREATE">Config Create</option>
                        <option value="CONFIG_UPDATE">Config Update</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                    <input
                        type="date"
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                    <input
                        type="date"
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                </div>

                <Button onClick={() => fetchLogs()} variant="secondary" className="px-4">
                    <Filter className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
                </div>
            </div>

            {/* Audit Logs - Card Based Display */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-[20px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                        <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 dark:text-gray-500">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-[20px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500">No audit logs found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const actionColor = getActionColor(log.action);
                        const colorClasses = {
                            red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                            teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
                            gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        };

                        return (
                            <div
                                key={log.id}
                                className="bg-white dark:bg-gray-800 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
                            >
                                {/* Log Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${colorClasses[actionColor as keyof typeof colorClasses]}`}>
                                                    <Activity className="w-3 h-3 mr-1.5" />
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true })}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Performed by</p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={log.userId}>
                                                            {getUserDisplayName(log.userId, log.userName)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Timestamp</p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {format(log.timestamp.toDate(), 'MMM dd, yyyy HH:mm:ss')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleExpand(log.id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all flex-shrink-0"
                                        >
                                            {expandedLogId === log.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedLogId === log.id && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Detailed Information</h4>
                                            <div className="text-xs text-gray-400 font-mono">ID: {log.id}</div>
                                        </div>

                                        {log.details && (log.details as any).changes ? (
                                            <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Field</th>
                                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Old Value</th>
                                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">New Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                        {Object.entries((log.details as any).changes).map(([field, delta]: [string, any]) => (
                                                            <tr key={field} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/_/g, ' ')}</td>
                                                                <td className="px-4 py-3 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10">
                                                                    {resolveValue(field, delta.old)}
                                                                </td>
                                                                <td className="px-4 py-3 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10">
                                                                    {resolveValue(field, delta.new)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Field</th>
                                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                        {Object.entries(log.details).filter(([k]) => k !== 'changes').map(([field, value]) => (
                                                            <tr key={field} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/_/g, ' ')}</td>
                                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                                    {resolveValue(field, value)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div>
                                            <h5 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Raw JSON Data</h5>
                                            <pre className="text-[11px] bg-white dark:bg-gray-800 p-4 rounded-xl overflow-x-auto dark:text-gray-300 border border-gray-100 dark:border-gray-700 font-mono">
{JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AuditLogVisualizer;
