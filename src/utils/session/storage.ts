import { Session } from '../../types/session';
import { SESSION_STORAGE_KEY, LAST_ACTIVITY_KEY } from './constants';

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
};

export const updateLastActivity = (): void => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

export const getLastActivity = (): number => {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  return lastActivity ? parseInt(lastActivity, 10) : Date.now();
};