import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: {
    step: string;
    percentage: number;
  };
  size?: "small" | "medium" | "large";
  blur?: boolean;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Loading...",
  progress,
  size = "medium",
  blur = true,
  className = "",
}) => {
  if (!isVisible) return null;

  const sizeConfig = {
    small: {
      spinner: "w-6 h-6",
      text: "text-sm",
      container: "p-4",
    },
    medium: {
      spinner: "w-8 h-8",
      text: "text-base",
      container: "p-6",
    },
    large: {
      spinner: "w-12 h-12",
      text: "text-lg",
      container: "p-8",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 ${blur ? 'backdrop-blur-sm' : ''}
        animate-fade-in
        ${className}
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          max-w-sm w-full mx-4 ${config.container}
          animate-slide-up
        `}
      >
        <div className="flex flex-col items-center text-center">
          {/* Spinner */}
          <Loader2 className={`${config.spinner} text-primary-600 animate-spin mb-4`} />

          {/* Message */}
          <h3
            id="loading-title"
            className={`font-medium text-gray-900 dark:text-gray-100 ${config.text} mb-2`}
          >
            {message}
          </h3>

          {/* Progress */}
          {progress && (
            <div className="w-full mt-4">
              <div className={`flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2`}>
                <span>{progress.step}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline loading state (for use within components)
export const InlineLoader: React.FC<{
  message?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}> = ({ message = "Loading...", size = "medium", className = "" }) => {
  const sizeConfig = {
    small: { spinner: "w-4 h-4", text: "text-xs", gap: "gap-2" },
    medium: { spinner: "w-5 h-5", text: "text-sm", gap: "gap-3" },
    large: { spinner: "w-6 h-6", text: "text-base", gap: "gap-4" },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center justify-center ${config.gap} ${className}`}>
      <Loader2 className={`${config.spinner} text-primary-600 animate-spin`} />
      <span className={`${config.text} text-gray-600 dark:text-gray-400`}>
        {message}
      </span>
    </div>
  );
};

// Loading skeleton for content placeholders
export const LoadingSkeleton: React.FC<{
  lines?: number;
  className?: string;
  height?: string;
}> = ({ lines = 3, className = "", height = "h-4" }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${height}`}
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  );
};

// Card loading skeleton
export const LoadingCard: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;