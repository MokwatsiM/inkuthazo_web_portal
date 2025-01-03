import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { 
  SESSION_TIMEOUT,
  INACTIVITY_WARNING_THRESHOLD 
} from '../utils/session/constants';
import {
  saveSession,
  // getSession,
  clearSession,
  updateLastActivity,
  getLastActivity
} from '../utils/session/storage';
import type { SessionState } from '../types/session';

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
    isExpired: false
  });

  const handleActivity = useCallback(() => {
    if (!sessionState.isAuthenticated) return;
    updateLastActivity();
    setSessionState(prev => ({
      ...prev,
      lastActivity: Date.now(),
      expiresAt: Date.now() + SESSION_TIMEOUT * 60 * 1000
    }));
  }, [sessionState.isAuthenticated]);

  const handleSessionExpired = useCallback(() => {
    clearSession();
    signOut();
    const returnUrl = location.pathname !== '/auth/login' ? `?returnUrl=${encodeURIComponent(location.pathname)}` : '';
    navigate(`/auth/login${returnUrl}`);
  }, [navigate, location.pathname, signOut]);

  const checkSession = useCallback(() => {
    const lastActivity = getLastActivity();
    const now = Date.now();
    const timeSinceLastActivity = (now - lastActivity) / 1000 / 60; // in minutes

    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
      handleSessionExpired();
      return;
    }

    if (timeSinceLastActivity >= SESSION_TIMEOUT - INACTIVITY_WARNING_THRESHOLD) {
      const timeLeft = Math.round(SESSION_TIMEOUT - timeSinceLastActivity);
      showWarning(
        `Your session will expire in ${timeLeft} minutes due to inactivity. Please save your work.`,
        'Session Expiring Soon'
      );
    }
  }, [handleSessionExpired, showWarning]);


  // Initialize session
  useEffect(() => {
    if (user && userDetails) {
      const session = {
        user,
        userDetails,
        lastActivity: Date.now(),
        expiresAt: Date.now() + SESSION_TIMEOUT * 60 * 1000
      };
      saveSession(session);
      setSessionState({
        ...session,
        isAuthenticated: true,
        isExpired: false
      });
    } else {
      clearSession();
      setSessionState(prev => ({
        ...prev,
        isAuthenticated: false,
        isExpired: true
      }));
    }
  }, [user, userDetails]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  // Set up session check interval
  useEffect(() => {
    if (!sessionState.isAuthenticated) return;

    const interval = setInterval(checkSession, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [sessionState.isAuthenticated, checkSession]);

  return {
    ...sessionState,
    handleActivity,
    checkSession
  };
};