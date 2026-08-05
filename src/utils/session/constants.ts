// Log out after this many minutes of inactivity.
export const SESSION_TIMEOUT = 30;

// Show the "expiring soon" warning when this many minutes of idle time remain.
export const INACTIVITY_WARNING_THRESHOLD = 5;

// Absolute maximum session age. Force re-login this long after sign-in,
// regardless of activity.
export const SESSION_MAX_AGE_HOURS = 24;

// Local storage keys
export const SESSION_STORAGE_KEY = 'app_session';
export const LAST_ACTIVITY_KEY = 'last_activity';
export const SESSION_START_KEY = 'session_start';
