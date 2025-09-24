import React from "react";
import { LucideIcon, Clock, User, DollarSign, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

interface ActivityItem {
  id: string;
  type: 'contribution' | 'member' | 'payout' | 'meeting' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  amount?: number;
  user?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  title = "Recent Activity",
  maxItems = 10
}) => {
  const getActivityIcon = (type: ActivityItem['type']): LucideIcon => {
    switch (type) {
      case 'contribution': return DollarSign;
      case 'member': return User;
      case 'payout': return DollarSign;
      case 'meeting': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'contribution': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'member': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'payout': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'meeting': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className="bg-surface dark:bg-surface-dark rounded-xl p-6 border border-line dark:border-line-dark">
        <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
          {title}
        </h2>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-text-tertiary dark:text-text-tertiary-dark mx-auto mb-4" />
          <p className="text-text-secondary dark:text-text-secondary-dark">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl p-6 border border-line dark:border-line-dark">
      <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
        {title}
      </h2>
      <div className="space-y-4">
        {displayActivities.map((activity) => {
          const IconComponent = getActivityIcon(activity.type);
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-lg bg-surface-2 dark:bg-surface-2-dark
                       hover:bg-surface-3 dark:hover:bg-surface-3-dark transition-colors"
            >
              <div className={`p-2 rounded-lg ${getTypeColor(activity.type)}`}>
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
                      {activity.description}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark mt-1">
                        by {activity.user}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {activity.amount && (
                      <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                        R {activity.amount.toFixed(2)}
                      </span>
                    )}
                    {activity.status && getStatusIcon(activity.status)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3 text-text-tertiary dark:text-text-tertiary-dark" />
                  <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                    {formatDate(activity.timestamp, 'MMM dd, yyyy • HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;