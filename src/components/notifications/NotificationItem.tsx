import React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { Notification } from "../../types/notification";

interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
}) => {
  const { id, type, message, title } = notification;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-start p-4 mb-4 rounded-lg border ${colors[type]} shadow-lg`}
    >
      <Icon className="h-5 w-5 mt-0.5 mr-3" />
      <div className="flex-1">
        {title && <h4 className="text-sm font-medium mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default NotificationItem;
