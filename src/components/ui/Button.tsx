import { LucideIcon } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  icon?: LucideIcon;
  children: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  icon: Icon,
  children,
  className = "",
  fullWidth = false,
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-semibold rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    hover:transform hover:scale-[1.02] active:scale-[0.98]
  `;

  const sizeStyles = {
    small: "px-3 py-2 text-sm gap-1.5",
    medium: "px-4 py-2.5 text-sm gap-2",
    large: "px-6 py-3 text-base gap-2.5",
  };

  const variantStyles = {
    primary: `
      bg-primary-700 text-white shadow-sm
      hover:bg-primary-800 hover:shadow-md
      focus:ring-primary-500
      dark:bg-primary-600 dark:hover:bg-primary-700
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-300 shadow-sm
      hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
      focus:ring-gray-500
      dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600
      dark:hover:bg-gray-700 dark:hover:border-gray-500
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500
      dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100
    `,
    danger: `
      bg-danger text-white shadow-sm
      hover:bg-red-600 hover:shadow-md
      focus:ring-red-500
    `,
  };

  const widthStyles = fullWidth ? "w-full" : "";
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${widthStyles}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className={size === "small" ? "w-4 h-4" : "w-5 h-5"} />
      )}
      <span className={loading ? "opacity-0" : ""}>{children}</span>
    </button>
  );
};

export default Button;
