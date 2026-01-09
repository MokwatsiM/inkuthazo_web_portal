import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Filter, ChevronDown, ChevronUp, Clock, User, Activity } from 'lucide-react';
import { AuditLog, getAuditLogs, AuditFilter } from '../../services/auditService';
import Button from '../ui/Button';

const AuditLogVisualizer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [filters, setFilters] = useState<AuditFilter>({
        limitCount: 20
    });

    const fetchLogs = async (isLoadMore = false) => {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const result = await getAuditLogs({
                ...filters,
                lastDoc: isLoadMore ? lastDoc : undefined
            });

            const newLogs = result.logs;
            if (isLoadMore) {
                setLogs(prev => [...prev, ...newLogs]);
            } else {
                setLogs(newLogs);
            }
            setLastDoc(result.lastDoc);

            // Fetch names for all userIds that we don't have yet
            // Also scan details for potential user IDs to resolve targets
            const potentialUserIds = new Set<string>();
            newLogs.forEach(log => {
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
                    console.error('Error fetching user names:', nameError);
                }
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            if (isLoadMore) setLoadingMore(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
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

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-end">
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

            {/* Audit Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No logs found</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm dark:text-gray-300">
                                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                    {format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm dark:text-gray-300">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="truncate max-w-[150px]" title={log.userId}>
                                                        {getUserDisplayName(log.userId, log.userName)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    <Activity className="w-3 h-3 mr-1" />
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleExpand(log.id)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                >
                                                    {expandedLogId === log.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedLogId === log.id && (
                                            <tr className="bg-gray-50 dark:bg-gray-900/30">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-inner">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Audit Log Details</h4>
                                                            <div className="text-[10px] text-gray-400">Log ID: {log.id}</div>
                                                        </div>

                                                        {log.details && (log.details as any).changes ? (
                                                            <div className="mb-6 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                                                                <table className="w-full text-xs">
                                                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left font-semibold text-gray-500">Field</th>
                                                                            <th className="px-4 py-2 text-left font-semibold text-gray-500">Old Value</th>
                                                                            <th className="px-4 py-2 text-left font-semibold text-gray-500">New Value</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                                        {Object.entries((log.details as any).changes).map(([field, delta]: [string, any]) => (
                                                                            <tr key={field}>
                                                                                <td className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/_/g, ' ')}</td>
                                                                                <td className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10">
                                                                                    {resolveValue(field, delta.old)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-green-600 dark:text-green-400 bg-green-50/30 dark:bg-green-900/10">
                                                                                    {resolveValue(field, delta.new)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="mb-6 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                                                                <table className="w-full text-xs">
                                                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left font-semibold text-gray-500">Field</th>
                                                                            <th className="px-4 py-2 text-left font-semibold text-gray-500">Value</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                                        {Object.entries(log.details).filter(([k]) => k !== 'changes').map(([field, value]) => (
                                                                            <tr key={field}>
                                                                                <td className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/_/g, ' ')}</td>
                                                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
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
                                                            <pre className="text-[11px] bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {lastDoc && !loading && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 text-center">
                        <Button
                            onClick={() => fetchLogs(true)}
                            variant="secondary"
                            loading={loadingMore}
                            disabled={loadingMore}
                        >
                            Load More Logs
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogVisualizer;
