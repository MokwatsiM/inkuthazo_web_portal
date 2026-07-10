import React, { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";
import { Role, ResourceType, PermissionAction } from "../types/role";
import {
  hasPermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
  canExport,
  getAccessibleResources,
  getAllowedActions,
  hasAnyPermission,
} from "../services/permissionService";
import { logger } from "../utils/logger";

/**
 * Custom hook for managing and checking user permissions
 * Provides real-time permission updates via Firestore listeners:
 * - Listener on the member document detects role changes
 * - Listener on the role document detects permission changes
 */
export const usePermissions = () => {
  const { userDetails } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roleListenerRef = useRef<(() => void) | null>(null);
  const memberListenerRef = useRef<(() => void) | null>(null);

  // Fetch and listen to user's role with caching
  useEffect(() => {
    logger.debug('[usePermissions] Effect triggered', {
      userRole: userDetails?.role,
      userId: userDetails?.id
    });

    if (!userDetails?.role || !userDetails?.id) {
      logger.debug('[usePermissions] No user role/id found, setting to null');
      setUserRole(null);
      setLoading(false);
      return;
    }

    const userId = userDetails.id;

    const setupPermissions = () => {
      try {
        setLoading(true);
        setError(null);

        // Listen to the member document to pick up role changes
        const memberRef = doc(db, "members", userId);
        memberListenerRef.current = onSnapshot(
          memberRef,
          (memberSnapshot) => {
            if (!memberSnapshot.exists()) {
              logger.error('[usePermissions] Member document not found');
              setError("Member not found");
              setUserRole(null);
              setLoading(false);
              return;
            }

            const currentRole = memberSnapshot.data().role;

            // Listen to the role document to pick up permission changes
            if (roleListenerRef.current) {
              roleListenerRef.current();
            }

            const roleRef = doc(db, "roles", currentRole);
            roleListenerRef.current = onSnapshot(
              roleRef,
              (roleSnapshot) => {
                if (!roleSnapshot.exists()) {
                  logger.error('[usePermissions] Role document not found:', currentRole);
                  setError("Role not found");
                  setUserRole(null);
                  setLoading(false);
                  return;
                }

                setUserRole({
                  id: roleSnapshot.id,
                  ...roleSnapshot.data(),
                } as Role);
                setLoading(false);
              },
              (err) => {
                logger.error("[usePermissions] Error listening to role:", err);
                setError("Failed to load permissions");
                setLoading(false);
              }
            );
          },
          (err) => {
            logger.error("[usePermissions] Error listening to member:", err);
            setError("Failed to load member data");
            setLoading(false);
          }
        );
      } catch (err) {
        logger.error("[usePermissions] Error setting up permissions:", err);
        setError("Failed to load permissions");
        setLoading(false);
      }
    };

    setupPermissions();

    return () => {
      logger.debug('[usePermissions] Cleaning up listeners');
      if (roleListenerRef.current) {
        roleListenerRef.current();
      }
      if (memberListenerRef.current) {
        memberListenerRef.current();
      }
    };
  }, [userDetails?.role, userDetails?.id]);

  /**
   * Check if user has specific permission
   */
  const checkPermission = useCallback(
    (resource: ResourceType, action: PermissionAction): boolean => {
      const result = hasPermission(userRole, resource, action);
      logger.debug('[usePermissions] checkPermission called:', {
        resource,
        action,
        userRole: userRole?.name,
        allowed: result.allowed,
        reason: result.reason
      });
      return result.allowed;
    },
    [userRole]
  );

  /**
   * Check if user has view permission
   */
  const checkView = useCallback(
    (resource: ResourceType): boolean => {
      return canView(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user has create permission
   */
  const checkCreate = useCallback(
    (resource: ResourceType): boolean => {
      return canCreate(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user has edit permission
   */
  const checkEdit = useCallback(
    (resource: ResourceType): boolean => {
      return canEdit(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user has delete permission
   */
  const checkDelete = useCallback(
    (resource: ResourceType): boolean => {
      return canDelete(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user has approve permission
   */
  const checkApprove = useCallback(
    (resource: ResourceType): boolean => {
      return canApprove(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user has export permission
   */
  const checkExport = useCallback(
    (resource: ResourceType): boolean => {
      return canExport(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user has ANY permission for a resource
   */
  const checkAnyPermission = useCallback(
    (resource: ResourceType): boolean => {
      return hasAnyPermission(userRole, resource);
    },
    [userRole]
  );

  /**
   * Get all resources user can view
   */
  const getViewableResources = useCallback((): ResourceType[] => {
    return getAccessibleResources(userRole);
  }, [userRole]);

  /**
   * Get all allowed actions for a resource
   */
  const getResourceActions = useCallback(
    (resource: ResourceType): PermissionAction[] => {
      return getAllowedActions(userRole, resource);
    },
    [userRole]
  );

  /**
   * Check if user is admin (backward compatibility)
   */
  const isAdmin = useCallback((): boolean => {
    return userDetails?.role === "admin";
  }, [userDetails?.role]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (roleName: string): boolean => {
      return userDetails?.role === roleName;
    },
    [userDetails?.role]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      return roleNames.includes(userDetails?.role || "");
    },
    [userDetails?.role]
  );

  return {
    // Role information
    userRole,
    roleName: userDetails?.role,
    loading,
    error,

    // Permission check functions
    hasPermission: checkPermission,
    canView: checkView,
    canCreate: checkCreate,
    canEdit: checkEdit,
    canDelete: checkDelete,
    canApprove: checkApprove,
    canExport: checkExport,
    hasAnyPermission: checkAnyPermission,

    // Resource helpers
    getViewableResources,
    getResourceActions,

    // Role helpers (backward compatibility)
    isAdmin,
    hasRole,
    hasAnyRole,
  };
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  resource: ResourceType,
  action: PermissionAction,
  fallback?: React.ReactNode
) => {
  return (props: P) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(resource, action)) {
      return React.createElement(React.Fragment, null, fallback || null);
    }

    return React.createElement(Component, props);
  };
};
