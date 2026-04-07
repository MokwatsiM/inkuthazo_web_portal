import React, { useState } from "react";
import { X, Save, AlertCircle, Loader, Shield } from "lucide-react";
import { updateRole } from "../../services/roleService";
import { useAuth } from "../../hooks/useAuth";
import { RoleWithStats, UpdateRoleDTO, ResourcePermissions, ResourceType, RolePermissions } from "../../types/role";
import { PERMISSIONS_CATALOG, getPermissionCategories } from "../../constants/permissions";
import PermissionCheckboxGroup from "./PermissionCheckboxGroup";
import logger from "../../utils/logger";

interface EditRoleModalProps {
  role: RoleWithStats;
  onClose: () => void;
  onSuccess: () => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({ role, onClose, onSuccess }) => {
  const { userDetails } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - initialize with existing role data
  const [description, setDescription] = useState(role.description);
  const [permissions, setPermissions] = useState<RolePermissions>(role.permissions);

  // Get all unique resources from the permissions catalog
  const allResources = Array.from(
    new Set(PERMISSIONS_CATALOG.map((p) => p.resource))
  ) as ResourceType[];

  // Group resources by category
  const categories = getPermissionCategories();

  const handlePermissionChange = (
    resource: ResourceType,
    resourcePermissions: Partial<ResourcePermissions>
  ) => {
    setPermissions((prev: RolePermissions) => ({
      ...prev,
      [resource]: resourcePermissions,
    }));
  };

  const validateForm = (): string | null => {
    if (!description.trim()) {
      return "Description is required";
    }

    if (description.length < 10) {
      return "Description must be at least 10 characters";
    }

    // Check if at least one permission is granted
    const hasAnyPermission = Object.values(permissions).some((resourcePerms) =>
      Object.values(resourcePerms || {}).some((value) => value === true)
    );

    if (!hasAnyPermission) {
      return "At least one permission must be granted";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!userDetails) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: UpdateRoleDTO = {
        description: description.trim(),
        permissions,
        updatedBy: userDetails.id,
      };

      await updateRole(role.id, updateData);
      onSuccess();
    } catch (err: any) {
      logger.error("Error updating role:", err);
      setError(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllPermissions = () => {
    const allPermissions: RolePermissions = {} as RolePermissions;
    allResources.forEach((resource) => {
      allPermissions[resource] = {
        view: true,
        create: true,
        edit: true,
        delete: true,
        approve: true,
        export: true,
      };
    });
    setPermissions(allPermissions);
  };

  const handleClearAllPermissions = () => {
    const emptyPermissions: RolePermissions = {} as RolePermissions;
    allResources.forEach((resource) => {
      emptyPermissions[resource] = {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
      };
    });
    setPermissions(emptyPermissions);
  };

  const handleResetToOriginal = () => {
    setDescription(role.description);
    setPermissions(role.permissions);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Role</h2>
            {role.isSystemRole && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                <Shield className="w-3 h-3" />
                System Role
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* System Role Warning */}
            {role.isSystemRole && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">System Role</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This is a system role. You can modify permissions and description, but the role name cannot be changed.
                  </p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={role.name}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Role name cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this role can do and its responsibilities..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={loading}
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum 10 characters
                </p>
              </div>

              {/* Member Count Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Members with this role:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{role.memberCount}</span>
                </div>
                {role.memberCount > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Permission changes will affect all {role.memberCount} member(s) with this role
                  </p>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Permissions <span className="text-red-500 dark:text-red-400">*</span>
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                    disabled={loading}
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllPermissions}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    disabled={loading}
                  >
                    Clear All
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={handleResetToOriginal}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select which actions this role can perform on each resource
              </p>

              {/* Permissions by Category */}
              {categories.map((category) => {
                const categoryResources = PERMISSIONS_CATALOG.filter(
                  (p) => p.category === category
                )
                  .map((p) => p.resource)
                  .filter((value, index, self) => self.indexOf(value) === index) as ResourceType[];

                if (categoryResources.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {category}
                    </h4>
                    <div className="space-y-3">
                      {categoryResources.map((resource) => (
                        <PermissionCheckboxGroup
                          key={resource}
                          resource={resource}
                          permissions={permissions[resource] || {}}
                          onChange={handlePermissionChange}
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Role
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;
