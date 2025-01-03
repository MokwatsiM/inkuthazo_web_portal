import { User } from 'firebase/auth';
import type { Member } from './index';

export interface Session {
  user: User | null;
  userDetails: Member | null;
  lastActivity: number;
  expiresAt: number;
}

export interface SessionState extends Session {
  isAuthenticated: boolean;
  isExpired: boolean;
}