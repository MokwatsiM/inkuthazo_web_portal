import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ProgressIndicatorProps {
  progress?: {
    step: string;
    percentage: number;
  } | null;
  error?: string | null;
  success?: string | null;
  className?: string;
  size?: "small" | "medium" | "large";
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  error,
  success,
  className = "",
  size = "medium",
}) => {
  const sizeConfig = {
    small: {
      height: "h-1.5",
      text: "text-xs",
      padding: "p-2",
      icon: "w-4 h-4",
    },
    medium: {
      height: "h-2",
      text: "text-sm",
      padding: "p-3",
      icon: "w-5 h-5",
    },
    large: {
      height: "h-3",
      text: "text-base",
      padding: "p-4",
      icon: "w-6 h-6",
    },
  };

  const config = sizeConfig[size];

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${config.padding} bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 ${className}`}>
        <AlertCircle className={`${config.icon} flex-shrink-0`} />
        <span className={config.text}>{error}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`flex items-center gap-2 ${config.padding} bg-green-50 border border-green-200 rounded-lg text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 ${className}`}>
        <CheckCircle className={`${config.icon} flex-shrink-0`} />
        <span className={config.text}>{success}</span>
      </div>
    );
  }

  if (progress) {
    return (
      <div className={`w-full ${className}`}>
        <div className={`flex justify-between ${config.text} text-gray-600 dark:text-gray-400 mb-1`}>
          <span>{progress.step}</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full ${config.height} dark:bg-gray-700`}>
          <div
            className={`bg-primary-600 ${config.height} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return null;
};

// Animated progress bar for indeterminate progress
export const IndeterminateProgress: React.FC<{
  message?: string;
  className?: string;
  size?: "small" | "medium" | "large";
}> = ({ message = "Loading...", className = "", size = "medium" }) => {
  const sizeConfig = {
    small: { height: "h-1.5", text: "text-xs" },
    medium: { height: "h-2", text: "text-sm" },
    large: { height: "h-3", text: "text-base" },
  };

  const config = sizeConfig[size];

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className={`${config.text} text-gray-600 dark:text-gray-400 mb-2`}>
          {message}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${config.height} dark:bg-gray-700 overflow-hidden`}>
        <div
          className={`bg-primary-600 ${config.height} rounded-full animate-pulse`}
          style={{
            width: "30%",
            animation: "progress-indeterminate 1.5s infinite ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

// Pulse loader for simple loading states
export const PulseLoader: React.FC<{
  message?: string;
  className?: string;
  size?: "small" | "medium" | "large";
}> = ({ message, className = "", size = "medium" }) => {
  const sizeConfig = {
    small: { dot: "w-2 h-2", gap: "gap-1", text: "text-xs" },
    medium: { dot: "w-3 h-3", gap: "gap-1.5", text: "text-sm" },
    large: { dot: "w-4 h-4", gap: "gap-2", text: "text-base" },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`flex ${config.gap}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${config.dot} bg-primary-600 rounded-full animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1s",
            }}
          />
        ))}
      </div>
      {message && (
        <span className={`mt-2 ${config.text} text-gray-600 dark:text-gray-400`}>
          {message}
        </span>
      )}
    </div>
  );
};

export default ProgressIndicator;