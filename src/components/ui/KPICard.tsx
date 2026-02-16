import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: "purple" | "teal" | "pink" | "blue" | "green" | "amber" | "red";
  trend?: {
    value: string;
    isPositive?: boolean;
    icon?: LucideIcon;
  };
}

const gradientMap = {
  purple: "from-purple-500 to-purple-600",
  teal: "from-teal-500 to-teal-600",
  pink: "from-pink-500 to-pink-600",
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  amber: "from-amber-500 to-amber-600",
  red: "from-red-500 to-red-600",
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
}) => {
  const TrendIcon = trend?.icon;

  return (
    <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientMap[gradient]} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {title}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </h3>
            </div>
          </div>

          {(subtitle || trend) && (
            <div className="flex items-center gap-2 text-sm">
              {trend && TrendIcon && (
                <div
                  className={`flex items-center gap-1 ${
                    trend.isPositive
                      ? "text-green-600"
                      : trend.isPositive === false
                      ? "text-red-600"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <TrendIcon className="w-4 h-4" />
                  <span className="font-semibold">{trend.value}</span>
                </div>
              )}
              {subtitle && (
                <span className="text-gray-600 dark:text-gray-400">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
