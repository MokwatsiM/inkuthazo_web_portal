import { Session } from '../../types/session';
import {
  SESSION_STORAGE_KEY,
  LAST_ACTIVITY_KEY,
  SESSION_START_KEY,
} from './constants';

export const saveSession = (session: Session): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const getSession = (): Session | null => {
  const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(SESSION_START_KEY);
};

export const updateLastActivity = (): void => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

export const getLastActivity = (): number => {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  return lastActivity ? parseInt(lastActivity, 10) : Date.now();
};

/**
 * Record when the current session began (used for the absolute max-age check).
 * Only sets it if not already present, so it survives page reloads and marks
 * the real sign-in time rather than resetting on every mount.
 */
export const ensureSessionStart = (): void => {
  if (!localStorage.getItem(SESSION_START_KEY)) {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }
};

/** Epoch ms when the session started, or null if none recorded. */
export const getSessionStart = (): number | null => {
  const start = localStorage.getItem(SESSION_START_KEY);
  return start ? parseInt(start, 10) : null;
};