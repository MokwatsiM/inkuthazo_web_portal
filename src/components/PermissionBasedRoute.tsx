import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import type { PermissionAction, ResourceType } from '../types/role';
import { logger } from "../utils/logger";
import LoadingSpinner from './ui/LoadingSpinner';


interface PermissionBasedRouteProps {
  children: React.ReactNode;
  resource: ResourceType;
  action?: PermissionAction;
}

/**
 * Route wrapper that checks if the user has permission to access a resource
 * Redirects to landing page if user doesn't have the required permission
 */
const PermissionBasedRoute: React.FC<PermissionBasedRouteProps> = ({
  children,
  resource,
  action = 'view' // Default to 'view' permission
}) => {
  const { hasPermission, loading, roleName } = usePermissions();

  logger.debug('[PermissionBasedRoute] Checking access:', {
    resource,
    action,
    loading,
    userRole: roleName,
    hasPermission: hasPermission(resource, action)
  });

  // Wait for permissions to load before making a decision. Rendering the
  // children here would briefly flash gated pages open, so show a spinner.
  if (loading) {
    return <LoadingSpinner />;
  }

  const permitted = hasPermission(resource, action);

  if (!permitted) {
    logger.debug('[PermissionBasedRoute] ACCESS DENIED - Redirecting to landing page', {
      resource,
      action,
      userRole: roleName
    });
    return <Navigate to="/" replace />;
  }

  logger.debug('[PermissionBasedRoute] ACCESS GRANTED', { resource, action });
  return <>{children}</>;
};

export default PermissionBasedRoute;
