import React from "react";
import { LucideIcon } from "lucide-react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "pending";
  size?: "small" | "medium";
  icon?: LucideIcon;
  className?: string;
  withIcon?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "info",
  size = "medium",
  icon: Icon,
  className = "",
  withIcon = false,
}) => {
  const baseStyles = `
    inline-flex items-center font-medium rounded-full
    border transition-all duration-150 ease-in-out
  `;

  const sizeStyles = {
    small: "px-2 py-0.5 text-xs gap-1",
    medium: "px-2.5 py-1 text-sm gap-1.5",
  };

  const variantStyles = {
    success: `
      bg-green-50 text-green-700 border-green-200
      dark:bg-green-900/20 dark:text-green-300 dark:border-green-800
    `,
    warning: `
      bg-yellow-50 text-yellow-700 border-yellow-200
      dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800
    `,
    error: `
      bg-red-50 text-red-700 border-red-200
      dark:bg-red-900/20 dark:text-red-300 dark:border-red-800
    `,
    info: `
      bg-blue-50 text-blue-700 border-blue-200
      dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800
    `,
    neutral: `
      bg-gray-50 text-gray-700 border-gray-200
      dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600
    `,
    pending: `
      bg-orange-50 text-orange-700 border-orange-200
      dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800
    `,
  };

  const iconMap = {
    success: "✓",
    warning: "⚠",
    error: "✕",
    info: "ℹ",
    neutral: "•",
    pending: "○",
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {(withIcon || Icon) && (
        Icon ? (
          <Icon className={size === "small" ? "w-3 h-3" : "w-4 h-4"} />
        ) : (
          <span className={size === "small" ? "text-xs" : "text-sm"}>
            {iconMap[variant]}
          </span>
        )
      )}
      {children}
    </span>
  );
};

// Status Pill component as specified in the modernization spec
export const StatusPill: React.FC<{
  status: "approved" | "active" | "pending" | "rejected" | "inactive";
  className?: string;
}> = ({ status, className = "" }) => {
  const statusConfig = {
    approved: { variant: "success" as const, label: "Approved", withIcon: true },
    active: { variant: "success" as const, label: "Active", withIcon: true },
    pending: { variant: "pending" as const, label: "Pending", withIcon: true },
    rejected: { variant: "error" as const, label: "Rejected", withIcon: true },
    inactive: { variant: "neutral" as const, label: "Inactive", withIcon: true },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      withIcon={config.withIcon}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

export default Badge;
