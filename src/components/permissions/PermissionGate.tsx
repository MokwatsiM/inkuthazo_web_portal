import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { ResourceType, PermissionAction } from '../../types/role';

interface PermissionGateProps {
  children: React.ReactNode;
  resource: ResourceType;
  action: PermissionAction;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Use this to show/hide UI elements based on permissions
 *
 * @example
 * <PermissionGate resource="members" action="create">
 *   <Button>Add Member</Button>
 * </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  fallback = null
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
