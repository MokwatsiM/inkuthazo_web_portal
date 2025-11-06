import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  className?: string;
}

const StatCard = React.memo<StatCardProps>(({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'blue',
  className = "",
}) => {
  const colorVariants = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accent: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400',
      accent: 'border-green-200 dark:border-green-800'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      accent: 'border-yellow-200 dark:border-yellow-800'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      accent: 'border-red-200 dark:border-red-800'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      accent: 'border-purple-200 dark:border-purple-800'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      accent: 'border-indigo-200 dark:border-indigo-800'
    }
  };

  const colors = colorVariants[color];

  return (
    <div className={`
      bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-sm hover:shadow-md
      transition-all duration-200 border border-line dark:border-line-dark
      hover:border-primary-200 dark:hover:border-primary-700
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                <Icon className={`h-5 w-5 ${colors.iconColor}`} />
              </div>
            )}
            <h3 className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
              {title}
            </h3>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${trend.isPositive
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}%
            {trend.label && <span className="ml-1">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
