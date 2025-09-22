import React from "react";
import { LucideIcon } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: "small" | "medium" | "large";
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "medium",
  className = "",
}) => {
  const sizeConfig = {
    small: {
      container: "py-8",
      icon: "h-8 w-8",
      title: "text-base",
      description: "text-sm",
      spacing: "mt-2",
      actionSpacing: "mt-4",
    },
    medium: {
      container: "py-12",
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-base",
      spacing: "mt-4",
      actionSpacing: "mt-6",
    },
    large: {
      container: "py-16",
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-lg",
      spacing: "mt-6",
      actionSpacing: "mt-8",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`text-center ${config.container} ${className}`}>
      {/* Icon with subtle background */}
      <div className="flex justify-center">
        <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <Icon className={`${config.icon} text-gray-400 dark:text-gray-500`} />
        </div>
      </div>

      {/* Content */}
      <div className={config.spacing}>
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${config.title}`}>
          {title}
        </h3>
        <p className={`mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto ${config.description}`}>
          {description}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center ${config.actionSpacing}`}>
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
              size={size === "small" ? "small" : "medium"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              size={size === "small" ? "small" : "medium"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
