import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
  interactive?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  interactive = false
}) => {
  const baseStyles = "bg-surface dark:bg-surface-dark rounded-base transition-all duration-200 ease-in-out";

  const variantStyles = {
    default: "shadow-card border border-line dark:border-line-dark",
    elevated: "shadow-card hover:shadow-card-hover",
    outlined: "border-2 border-line dark:border-line-dark shadow-sm"
  };

  const interactiveStyles = interactive
    ? "hover:shadow-card-hover hover:scale-[1.01] cursor-pointer"
    : "";

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${interactiveStyles}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-6 py-5 border-b border-line dark:border-line-dark ${className}`}
    >
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = "" }) => {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-6 py-5 border-t border-line dark:border-line-dark ${className}`}
    >
      {children}
    </div>
  );
};

// Statistic Card component as specified in the modernization spec
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}> = ({ label, value, trend, icon: Icon, className = "" }) => {
  return (
    <Card variant="elevated" className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted dark:text-muted-dark mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-success' : 'text-danger'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary-50 rounded-lg dark:bg-primary-900/20">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
