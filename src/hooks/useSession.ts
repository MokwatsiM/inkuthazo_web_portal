import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import {
  SESSION_TIMEOUT,
  SESSION_MAX_AGE_HOURS,
} from '../utils/session/constants';
import {
  saveSession,
  clearSession,
  updateLastActivity,
  getLastActivity,
  ensureSessionStart,
  getSessionStart,
} from '../utils/session/storage';
import type { SessionState } from '../types/session';

/**
 * Enforces two logout policies on top of Firebase's persisted auth:
 *   1. Idle timeout — sign out after SESSION_TIMEOUT minutes of no activity.
 *   2. Absolute max age — sign out SESSION_MAX_AGE_HOURS after sign-in,
 *      regardless of activity.
 *
 * Critically, the session is re-checked on mount AND whenever the tab regains
 * focus/visibility — not only on a background interval. That closes the gap
 * where closing the tab froze the idle clock, so returning days later kept you
 * logged in.
 */
export const useSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userDetails, signOut } = useAuth();
  const { showWarning } = useNotifications();
  const [sessionState, setSessionState] = useState<SessionState>({
    user: null,
    userDetails: null,
    lastActivity: Date.now(),
    expiresAt: Date.now() + SESSION_TIMEOUT * 60 * 1000,
    isAuthenticated: false,
    isExpired: false,
  });

  const handleActivity = useCallback(() => {
    if (!sessionState.isAuthenticated) return;
    updateLastActivity();
    setSessionState((prev) => ({
      ...prev,
      lastActivity: Date.now(),
      expiresAt: Date.now() + SESSION_TIMEOUT * 60 * 1000,
    }));
  }, [sessionState.isAuthenticated]);

  const handleSessionExpired = useCallback(
    (reason: 'idle' | 'max-age') => {
      clearSession();
      signOut();
      const returnUrl =
        location.pathname !== '/auth/login'
          ? `?returnUrl=${encodeURIComponent(location.pathname)}`
          : '';
      navigate(`/auth/login${returnUrl}`);
      showWarning(
        reason === 'idle'
          ? 'You were signed out after a period of inactivity.'
          : 'Your session expired. Please sign in again.',
        'Signed out'
      );
    },
    [navigate, location.pathname, signOut, showWarning]
  );

  const checkSession = useCallback(() => {
    // Only meaningful while Firebase considers the user signed in.
    if (!user) return;

    const now = Date.now();

    // 1. Absolute max age
    const start = getSessionStart();
    if (start && now - start >= SESSION_MAX_AGE_HOURS * 60 * 60 * 1000) {
      handleSessionExpired('max-age');
      return;
    }

    // 2. Idle timeout
    const minutesIdle = (now - getLastActivity()) / 1000 / 60;
    if (minutesIdle >= SESSION_TIMEOUT) {
      handleSessionExpired('idle');
      return;
    }
    // The "expiring soon" warning is rendered by SessionTimeoutWarning (a
    // persistent banner), so no toast is fired here to avoid duplicate alerts.
  }, [user, handleSessionExpired]);

  // Initialise session state + record sign-in time for the max-age check.
  useEffect(() => {
    if (user && userDetails) {
      ensureSessionStart();
      const session = {
        user,
        userDetails,
        lastActivity: getLastActivity(),
        expiresAt: Date.now() + SESSION_TIMEOUT * 60 * 1000,
      };
      saveSession(session);
      setSessionState({
        ...session,
        isAuthenticated: true,
        isExpired: false,
      });
      // Immediately validate — catches returning after a long time away with
      // an already-expired session before any interval tick.
      checkSession();
    } else {
      clearSession();
      setSessionState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isExpired: true,
      }));
    }
    // checkSession intentionally omitted to avoid re-running on every render;
    // it reads fresh values from storage each call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userDetails]);

  // Track user activity.
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [handleActivity]);

  // Re-check whenever the tab regains focus / becomes visible. This is the key
  // fix: the idle clock keeps running while the tab is closed/backgrounded, so
  // we must re-evaluate on return rather than trusting only the interval.
  useEffect(() => {
    if (!sessionState.isAuthenticated) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    window.addEventListener('focus', checkSession);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', checkSession);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [sessionState.isAuthenticated, checkSession]);

  // Background interval as a fallback while the tab stays open and idle.
  useEffect(() => {
    if (!sessionState.isAuthenticated) return;
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, [sessionState.isAuthenticated, checkSession]);

  return {
    ...sessionState,
    handleActivity,
    checkSession,
  };
};
