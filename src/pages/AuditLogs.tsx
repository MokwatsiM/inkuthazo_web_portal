import React, { useState, useEffect } from 'react';
import AuditLogVisualizer from '../components/audit/AuditLogVisualizer';
import AuditLogCharts from '../components/audit/AuditLogCharts';
import { getAuditStats } from '../services/auditService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import logger from '../utils/logger';

const AuditLogs: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getAuditStats(30); // Last 30 days
                setStats(result);
            } catch (error) {
                logger.error('Error fetching audit stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Audit Logs</h1>
                <p className="text-gray-600 dark:text-gray-400"> Monitor system activity and track administrative actions across the platform.</p>
            </div>

            {stats && <AuditLogCharts stats={stats} />}

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Activity Log</h2>
                <AuditLogVisualizer />
            </div>
        </div>
    );
};

export default AuditLogs;
