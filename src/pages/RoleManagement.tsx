import React, { useState, useEffect } from "react";
import { Shield, Plus, Search, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getAllRolesWithStats } from "../services/roleService";
import { initializeSystemRoles, areRolesInitialized } from "../utils/initializeRoles";
import { fixRoleDocumentIds } from "../scripts/fixRoleDocumentIds";
import { RoleWithStats } from "../types/role";
import RoleList from "../components/roles/RoleList";
import CreateRoleModal from "../components/roles/CreateRoleModal";
import logger from "../utils/logger";

const RoleManagement: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleWithStats[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<RoleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSystemOnly, setShowSystemOnly] = useState(false);
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [initMessage, setInitMessage] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (!userDetails) return;

    if (!isAdmin) {
      navigate("/");
    }
  }, [userDetails, isAdmin, navigate]);

  // Check if roles are initialized
  useEffect(() => {
    const checkInitialization = async () => {
      const initialized = await areRolesInitialized();
      setIsInitialized(initialized);
    };
    checkInitialization();
  }, []);

  // Load roles
  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await getAllRolesWithStats();
      setRoles(rolesData);
      setFilteredRoles(rolesData);
    } catch (error) {
      logger.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Filter roles based on search and filters
  useEffect(() => {
    let filtered = roles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // System/Custom filter
    if (showSystemOnly) {
      filtered = filtered.filter((role) => role.isSystemRole);
    } else if (showCustomOnly) {
      filtered = filtered.filter((role) => !role.isSystemRole);
    }

    setFilteredRoles(filtered);
  }, [searchTerm, showSystemOnly, showCustomOnly, roles]);

  // Initialize system roles
  const handleInitializeRoles = async () => {
    if (!userDetails) return;

    setInitializing(true);
    setInitMessage("");

    try {
      const result = await initializeSystemRoles(userDetails.id);

      if (result.success) {
        setInitMessage(`✅ ${result.message}`);
        setIsInitialized(true);
        await loadRoles();
      } else {
        setInitMessage(`⚠️ ${result.message}\nErrors: ${result.errors.join(", ")}`);
      }
    } catch (error: any) {
      setInitMessage(`❌ Failed to initialize roles: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  // Migrate role document IDs
  const handleMigrateRoleIds = async () => {
    setMigrating(true);
    setMigrationMessage("");

    try {
      const result = await fixRoleDocumentIds();

      if (result.success) {
        setMigrationMessage(
          `✅ Migration completed!\n` +
          `Migrated: ${result.migrated} roles\n` +
          `Skipped: ${result.skipped} roles (already correct)\n` +
          `Total: ${result.total} roles\n\n` +
          `Please refresh the page to see the changes.`
        );
        await loadRoles();
      }
    } catch (error: any) {
      setMigrationMessage(`❌ Migration failed: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const stats = {
    total: roles.length,
    system: roles.filter((r) => r.isSystemRole).length,
    custom: roles.filter((r) => !r.isSystemRole).length,
    totalMembers: roles.reduce((sum, r) => sum + r.memberCount, 0),
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage user roles with customizable permissions
        </p>
      </div>

      {/* Initialization Warning */}
      {!isInitialized && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                System Roles Not Initialized
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                The role system hasn't been set up yet. Click the button below to create the default
                system roles (Admin, Member, DC Member, Chairperson).
              </p>
              <button
                onClick={handleInitializeRoles}
                disabled={initializing}
                className="bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {initializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Initialize System Roles
                  </>
                )}
              </button>
              {initMessage && (
                <p className="mt-2 text-sm whitespace-pre-wrap text-yellow-800 dark:text-yellow-200">
                  {initMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Migration Notice */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Role Document ID Migration
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              If you're experiencing "Role not found" errors after deploying new Firestore rules,
              click below to migrate existing role documents to use their names as document IDs.
              This is a one-time operation that's required for the permission-based rules to work.
            </p>
            <button
              onClick={handleMigrateRoleIds}
              disabled={migrating}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {migrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Migrate Role Document IDs
                </>
              )}
            </button>
            {migrationMessage && (
              <p className="mt-2 text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                {migrationMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Roles</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-700">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">System Roles</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.system}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow p-4 border border-purple-200 dark:border-purple-700">
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Custom Roles</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.custom}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-4 border border-green-200 dark:border-green-700">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">Total Members</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalMembers}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSystemOnly(!showSystemOnly);
                setShowCustomOnly(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSystemOnly
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              System Roles
            </button>
            <button
              onClick={() => {
                setShowCustomOnly(!showCustomOnly);
                setShowSystemOnly(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showCustomOnly
                  ? "bg-purple-600 dark:bg-purple-700 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Custom Roles
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Role
          </button>
        </div>
      </div>

      {/* Role List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <RefreshCw className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading roles...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <Shield className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No roles found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {searchTerm
              ? "Try adjusting your search"
              : "Create your first custom role to get started"}
          </p>
        </div>
      ) : (
        <RoleList roles={filteredRoles} onRoleUpdated={loadRoles} />
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRoles();
          }}
        />
      )}
    </div>
  );
};

export default RoleManagement;
