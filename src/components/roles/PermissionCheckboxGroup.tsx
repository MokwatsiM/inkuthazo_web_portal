import React from "react";
import { ResourceType, ResourcePermissions, PermissionAction } from "../../types/role";
import { Check } from "lucide-react";

interface PermissionCheckboxGroupProps {
  resource: ResourceType;
  resourceLabel?: string;
  permissions: Partial<ResourcePermissions>;
  onChange: (resource: ResourceType, permissions: Partial<ResourcePermissions>) => void;
  disabled?: boolean;
}

// Helper function to generate a readable label from resource name
const getResourceLabel = (resource: ResourceType): string => {
  return resource
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ACTIONS: Array<{
  key: PermissionAction;
  label: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  checkboxBg: string;
  textLight: string;
  textDark: string;
}> = [
  {
    key: "view",
    label: "View",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/20",
    borderLight: "border-blue-200",
    borderDark: "dark:border-blue-700",
    checkboxBg: "bg-blue-600",
    textLight: "text-blue-900",
    textDark: "dark:text-blue-200"
  },
  {
    key: "create",
    label: "Create",
    bgLight: "bg-green-50",
    bgDark: "dark:bg-green-900/20",
    borderLight: "border-green-200",
    borderDark: "dark:border-green-700",
    checkboxBg: "bg-green-600",
    textLight: "text-green-900",
    textDark: "dark:text-green-200"
  },
  {
    key: "edit",
    label: "Edit",
    bgLight: "bg-yellow-50",
    bgDark: "dark:bg-yellow-900/20",
    borderLight: "border-yellow-200",
    borderDark: "dark:border-yellow-700",
    checkboxBg: "bg-yellow-600",
    textLight: "text-yellow-900",
    textDark: "dark:text-yellow-200"
  },
  {
    key: "delete",
    label: "Delete",
    bgLight: "bg-red-50",
    bgDark: "dark:bg-red-900/20",
    borderLight: "border-red-200",
    borderDark: "dark:border-red-700",
    checkboxBg: "bg-red-600",
    textLight: "text-red-900",
    textDark: "dark:text-red-200"
  },
  {
    key: "approve",
    label: "Approve",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-900/20",
    borderLight: "border-purple-200",
    borderDark: "dark:border-purple-700",
    checkboxBg: "bg-purple-600",
    textLight: "text-purple-900",
    textDark: "dark:text-purple-200"
  },
  {
    key: "export",
    label: "Export",
    bgLight: "bg-cyan-50",
    bgDark: "dark:bg-cyan-900/20",
    borderLight: "border-cyan-200",
    borderDark: "dark:border-cyan-700",
    checkboxBg: "bg-cyan-600",
    textLight: "text-cyan-900",
    textDark: "dark:text-cyan-200"
  },
];

const PermissionCheckboxGroup: React.FC<PermissionCheckboxGroupProps> = ({
  resource,
  resourceLabel,
  permissions,
  onChange,
  disabled = false,
}) => {
  const label = resourceLabel || getResourceLabel(resource);
  const handleToggle = (action: PermissionAction) => {
    const newPermissions = {
      ...permissions,
      [action]: !permissions[action],
    };
    onChange(resource, newPermissions);
  };

  const handleSelectAll = () => {
    const allSelected = ACTIONS.every((action) => permissions[action.key]);

    const newPermissions: Partial<ResourcePermissions> = {};
    ACTIONS.forEach((action) => {
      newPermissions[action.key] = !allSelected;
    });

    onChange(resource, newPermissions);
  };

  const allSelected = ACTIONS.every((action) => permissions[action.key]);
  const someSelected = ACTIONS.some((action) => permissions[action.key]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white dark:bg-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{label}</h4>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            disabled
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              : allSelected
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
              : someSelected
              ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              : "bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Permission Checkboxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ACTIONS.map((action) => {
          const isChecked = permissions[action.key] === true;

          return (
            <label
              key={action.key}
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all ${
                disabled
                  ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700"
                  : isChecked
                  ? `${action.bgLight} ${action.bgDark} border ${action.borderLight} ${action.borderDark}`
                  : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(action.key)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isChecked
                    ? `${action.checkboxBg} border-transparent`
                    : "bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                }`}
              >
                {isChecked && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm ${isChecked ? `${action.textLight} ${action.textDark} font-medium` : "text-gray-700 dark:text-gray-300"}`}>
                {action.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Selected count */}
      {someSelected && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {ACTIONS.filter((a) => permissions[a.key]).length} of {ACTIONS.length} permissions selected
        </div>
      )}
    </div>
  );
};

export default PermissionCheckboxGroup;
