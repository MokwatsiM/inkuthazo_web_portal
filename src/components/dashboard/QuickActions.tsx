import React from "react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = "Quick Actions"
}) => {
  const colorVariants = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
  };

  const ActionButton: React.FC<{ action: QuickAction }> = ({ action }) => {
    const baseClasses = `
      group relative p-4 rounded-xl bg-gradient-to-br ${colorVariants[action.color]}
      text-white transition-all duration-300 transform hover:scale-105
      shadow-lg hover:shadow-xl
      ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `;

    const content = (
      <div className={baseClasses}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <action.icon className="h-8 w-8 mb-3 opacity-90 group-hover:opacity-100" />
            <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
            <span className="text-sm opacity-80">{action.description}</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    );

    if (action.disabled) {
      return <div>{content}</div>;
    }

    if (action.href) {
      return <Link to={action.href}>{content}</Link>;
    }

    return <button onClick={action.onClick}>{content}</button>;
  };

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl p-6 border border-line dark:border-line-dark">
      <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <ActionButton key={index} action={action} />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;