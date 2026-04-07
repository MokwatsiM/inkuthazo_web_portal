import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import { ResourceType, PermissionAction } from '../types/role';

interface PermissionState {
  allowed: boolean;
  disabled: boolean;
  tooltip?: string;
}

/**
 * Hook that returns the permission state for a specific action
 * Useful for disabling buttons or showing tooltips
 *
 * @example
 * const createState = usePermissionState('members', 'create');
 * <Button disabled={createState.disabled} title={createState.tooltip}>
 *   Add Member
 * </Button>
 */
export const usePermissionState = (
  resource: ResourceType,
  action: PermissionAction
): PermissionState => {
  const { hasPermission } = usePermissions();

  return useMemo(() => {
    const allowed = hasPermission(resource, action);

    return {
      allowed,
      disabled: !allowed,
      tooltip: allowed
        ? undefined
        : `You don't have permission to ${action} ${resource.replace(/_/g, ' ')}`
    };
  }, [hasPermission, resource, action]);
};

/**
 * Hook that returns multiple permission states at once
 *
 * @example
 * const permissions = usePermissionStates('members', ['create', 'edit', 'delete']);
 * <Button disabled={permissions.create.disabled}>Add</Button>
 * <Button disabled={permissions.edit.disabled}>Edit</Button>
 */
export const usePermissionStates = (
  resource: ResourceType,
  actions: PermissionAction[]
): Record<PermissionAction, PermissionState> => {
  const { hasPermission } = usePermissions();

  return useMemo(() => {
    const states: Record<string, PermissionState> = {};

    actions.forEach((action) => {
      const allowed = hasPermission(resource, action);
      states[action] = {
        allowed,
        disabled: !allowed,
        tooltip: allowed
          ? undefined
          : `You don't have permission to ${action} ${resource.replace(/_/g, ' ')}`
      };
    });

    return states as Record<PermissionAction, PermissionState>;
  }, [hasPermission, resource, actions]);
};
