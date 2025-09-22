import React from "react";
import { Grid3X3, List, LayoutGrid } from "lucide-react";

export type ViewType = "list" | "grid";

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className = "",
}) => {
  const views = [
    {
      type: "list" as ViewType,
      icon: List,
      label: "List view",
    },
    {
      type: "grid" as ViewType,
      icon: LayoutGrid,
      label: "Grid view",
    },
  ];

  return (
    <div className={`flex rounded-lg border border-gray-300 p-1 bg-gray-50 ${className}`}>
      {views.map(({ type, icon: Icon, label }) => {
        const isActive = currentView === type;

        return (
          <button
            key={type}
            onClick={() => onViewChange(type)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;