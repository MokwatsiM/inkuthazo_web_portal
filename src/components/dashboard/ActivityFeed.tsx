import React from "react";
import {
  DollarSign,
  UserPlus,
  FileCheck,
  Receipt,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type:
    | "contribution"
    | "member"
    | "claim"
    | "expense"
    | "disciplinary"
    | "event"
    | "analytics";
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

interface ActivityFeedProps {
  activities?: Activity[];
  maxItems?: number;
}

const activityIcons = {
  contribution: DollarSign,
  member: UserPlus,
  claim: FileCheck,
  expense: Receipt,
  disciplinary: AlertTriangle,
  event: Calendar,
  analytics: TrendingUp,
};

const activityColors = {
  contribution: "from-purple-500 to-purple-600",
  member: "from-blue-500 to-blue-600",
  claim: "from-green-500 to-green-600",
  expense: "from-pink-500 to-pink-600",
  disciplinary: "from-orange-500 to-orange-600",
  event: "from-teal-500 to-teal-600",
  analytics: "from-indigo-500 to-indigo-600",
};

// Mock data for demonstration
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "contribution",
    title: "New Contribution",
    description: "John Doe made a contribution of R500",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    user: "John Doe",
  },
  {
    id: "2",
    type: "member",
    title: "New Member",
    description: "Sarah Smith joined the club",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: "Sarah Smith",
  },
  {
    id: "3",
    type: "claim",
    title: "Claim Approved",
    description: "Funeral claim for Mike Johnson was approved",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    user: "Mike Johnson",
  },
  {
    id: "4",
    type: "expense",
    title: "Expense Recorded",
    description: "Office supplies expense of R350",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: "5",
    type: "event",
    title: "Upcoming Meeting",
    description: "Monthly club meeting scheduled for tomorrow",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = mockActivities,
  maxItems = 5,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Latest updates and notifications
            </p>
          </div>
          <button className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
            View All
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {displayActivities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          ) : (
            displayActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const gradient = activityColors[activity.type];

              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 pb-4 ${
                    index !== displayActivities.length - 1
                      ? "border-b border-gray-100 dark:border-gray-800"
                      : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
