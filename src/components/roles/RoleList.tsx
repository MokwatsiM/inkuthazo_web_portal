import React, { useState } from "react";
import { Edit2, Trash2, Users, Shield, Lock } from "lucide-react";
import { RoleWithStats } from "../../types/role";
import EditRoleModal from "./EditRoleModal";
import DeleteRoleConfirmation from "./DeleteRoleConfirmation";
import { getPermissionSummary } from "../../services/permissionService";

interface RoleListProps {
  roles: RoleWithStats[];
  onRoleUpdated: () => void;
}

const RoleList: React.FC<RoleListProps> = ({ roles, onRoleUpdated }) => {
  const [selectedRole, setSelectedRole] = useState<RoleWithStats | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = (role: RoleWithStats) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDelete = (role: RoleWithStats) => {
    setSelectedRole(role);
    setShowDeleteConfirm(true);
  };

  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setSelectedRole(null);
  };

  const handleSuccess = () => {
    handleCloseModals();
    onRoleUpdated();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map((role) => {
                const summary = getPermissionSummary(role);

                return (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {role.isSystemRole ? (
                          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{role.name}</div>
                          {role.isSystemRole && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              System Role
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                        {role.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role.isSystemRole
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                        }`}
                      >
                        {role.isSystemRole ? "System" : "Custom"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {role.memberCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {summary.allowedPermissions} / {summary.totalPermissions}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {summary.accessibleResources} resources
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          disabled={role.isSystemRole}
                          className={`p-2 rounded-lg transition-colors ${
                            role.isSystemRole
                              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                              : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                          }`}
                          title={
                            role.isSystemRole
                              ? "System roles cannot be deleted"
                              : "Delete role"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {roles.map((role) => {
            const summary = getPermissionSummary(role);

            return (
              <div key={role.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2">
                    {role.isSystemRole ? (
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                    ) : (
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{role.name}</h3>
                      {role.isSystemRole && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                          <Lock className="w-3 h-3" />
                          System Role
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      role.isSystemRole
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                    }`}
                  >
                    {role.isSystemRole ? "System" : "Custom"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{role.description}</p>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{role.memberCount}</span>
                    <span>members</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {summary.allowedPermissions}/{summary.totalPermissions}
                    </span>
                    <span> permissions</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    disabled={role.isSystemRole}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      role.isSystemRole
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <EditRoleModal
          role={selectedRole}
          onClose={handleCloseModals}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedRole && (
        <DeleteRoleConfirmation
          role={selectedRole}
          onClose={handleCloseModals}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default RoleList;
