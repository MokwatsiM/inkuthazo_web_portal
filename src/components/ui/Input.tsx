import React from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  helperText?: string;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  iconPosition = "left",
  helperText,
  fullWidth = false,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputStyles = `
    block w-full rounded-input border border-gray-300
    bg-white px-3 py-2.5 text-sm text-gray-900
    placeholder-gray-500 transition-all duration-200
    focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
    dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100
    dark:placeholder-gray-400 dark:focus:border-primary-400
  `;

  const errorStyles = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
    : "";

  const iconStyles = Icon
    ? iconPosition === "left"
      ? "pl-10"
      : "pr-10"
    : "";

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div
            className={`
              absolute inset-y-0 flex items-center pointer-events-none z-10
              ${iconPosition === "left" ? "left-3" : "right-3"}
            `}
          >
            <Icon className={`w-5 h-5 ${error ? "text-red-500" : "text-gray-400"}`} />
          </div>
        )}

        <input
          id={inputId}
          className={`
            ${baseInputStyles}
            ${iconStyles}
            ${errorStyles}
          `.replace(/\s+/g, ' ').trim()}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` :
            helperText ? `${inputId}-help` : undefined
          }
          {...props}
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-help`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Search Input component as specified in the modernization spec
export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}> = ({ value, onChange, placeholder = "Search...", onClear, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          block w-full rounded-input border border-gray-300 bg-white
          pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-500
          transition-all duration-200
          focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
          dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400
        `.replace(/\s+/g, ' ').trim()}
      />

      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Input;