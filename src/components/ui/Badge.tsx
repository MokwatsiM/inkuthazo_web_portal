import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "info",
  className = "",
}) => {
  const variantClasses = {
    success:
      "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900",
    error: "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
