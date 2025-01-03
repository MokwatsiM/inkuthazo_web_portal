import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  SESSION_TIMEOUT,
  INACTIVITY_WARNING_THRESHOLD,
} from "../../utils/session/constants";
import { getLastActivity } from "../../utils/session/storage";

const SessionTimeoutWarning: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkTimeout = () => {
      const lastActivity = getLastActivity();
      const now = Date.now();
      const timeSinceLastActivity = (now - lastActivity) / 1000 / 60; // in minutes
      const remaining = SESSION_TIMEOUT - timeSinceLastActivity;

      setTimeLeft(Math.max(0, Math.round(remaining)));
      setShowWarning(remaining <= INACTIVITY_WARNING_THRESHOLD);
    };

    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
      <Clock className="h-5 w-5" />
      <div>
        <p className="font-medium">Session expiring soon</p>
        <p className="text-sm">
          Your session will expire in {timeLeft} minute
          {timeLeft !== 1 ? "s" : ""}. Please save your work.
        </p>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
