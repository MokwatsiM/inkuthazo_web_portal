import React, { useState } from "react";
import { X, Trash2, AlertTriangle, Loader, Shield, Users } from "lucide-react";
import { deleteRole } from "../../services/roleService";
import { RoleWithStats } from "../../types/role";
import logger from "../../utils/logger";

interface DeleteRoleConfirmationProps {
  role: RoleWithStats;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteRoleConfirmation: React.FC<DeleteRoleConfirmationProps> = ({
  role,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = !role.isSystemRole && role.memberCount === 0;
  const requiredConfirmText = role.name.toUpperCase();

  const handleDelete = async () => {
    if (confirmText !== requiredConfirmText) {
      setError("Confirmation text does not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteRole(role.id);
      onSuccess();
    } catch (err: any) {
      logger.error("Error deleting role:", err);
      setError(err.message || "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Role</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* System Role Warning */}
          {role.isSystemRole && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Cannot Delete System Role</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>{role.name}</strong> is a system role and cannot be deleted. System roles are
                    essential for the application to function properly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members Warning */}
          {!role.isSystemRole && role.memberCount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Role Has Active Members</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>{role.memberCount}</strong> member(s) are currently assigned to this role.
                    You must reassign these members to another role before deleting this one.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Can Delete Warning */}
          {canDelete && (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Warning: This action cannot be undone</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      You are about to permanently delete the role <strong>{role.name}</strong>.
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                      <li>All permission configurations will be lost</li>
                      <li>This action is irreversible</li>
                      <li>You will need to recreate the role if needed later</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Role Details */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Role Details</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{role.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {role.isSystemRole ? "System Role" : "Custom Role"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Members:</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{role.memberCount}</dd>
                  </div>
                </dl>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{requiredConfirmText}</span> to confirm deletion
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={requiredConfirmText}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            {canDelete ? "Cancel" : "Close"}
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== requiredConfirmText}
              className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Role
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleConfirmation;
