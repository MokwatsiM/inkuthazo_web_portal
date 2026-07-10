import { describe, it, expect, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';

// permissionService re-exports role lookups from roleService, which pulls in
// the live Firebase app config; mock it so these pure permission checks run
// without env vars (e.g. in CI, where no .env exists).
vi.mock('./roleService', () => ({
  getRoleById: vi.fn(),
  getRoleByName: vi.fn(),
}));

import {
  hasPermission,
  hasAnyPermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
} from './permissionService';
import type { Role } from '../types/role';

const makeRole = (permissions: Role['permissions']): Role => ({
  id: 'treasurer',
  name: 'treasurer',
  description: 'Test role',
  isSystemRole: false,
  permissions,
  createdAt: Timestamp.now(),
  createdBy: 'test',
});

const treasurer = makeRole({
  contributions: { view: true, create: true, edit: true, delete: false },
  payouts: { view: true },
});

describe('hasPermission', () => {
  it('allows an action granted to the role', () => {
    expect(hasPermission(treasurer, 'contributions', 'edit').allowed).toBe(true);
  });

  it('denies an action explicitly set to false', () => {
    const check = hasPermission(treasurer, 'contributions', 'delete');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('delete');
  });

  it('denies an action missing from the resource permissions', () => {
    expect(hasPermission(treasurer, 'payouts', 'create').allowed).toBe(false);
  });

  it('denies access to a resource the role has no entry for', () => {
    const check = hasPermission(treasurer, 'role_management', 'view');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('role_management');
  });

  it('denies everything when no role is assigned', () => {
    const check = hasPermission(null, 'contributions', 'view');
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('No role assigned');
  });
});

describe('hasAnyPermission', () => {
  it('is true when at least one action is allowed', () => {
    expect(hasAnyPermission(treasurer, 'contributions')).toBe(true);
  });

  it('is false when all actions are false', () => {
    const role = makeRole({ expenses: { view: false, create: false } });
    expect(hasAnyPermission(role, 'expenses')).toBe(false);
  });

  it('is false for an unknown resource or missing role', () => {
    expect(hasAnyPermission(treasurer, 'audit_logs')).toBe(false);
    expect(hasAnyPermission(null, 'contributions')).toBe(false);
  });
});

describe('convenience helpers', () => {
  it('map to the matching actions', () => {
    expect(canView(treasurer, 'contributions')).toBe(true);
    expect(canCreate(treasurer, 'contributions')).toBe(true);
    expect(canEdit(treasurer, 'contributions')).toBe(true);
    expect(canDelete(treasurer, 'contributions')).toBe(false);
  });
});
