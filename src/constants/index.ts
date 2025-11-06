// Application-wide constants

// Pagination
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  MAX_VISIBLE_PAGES: 7,
} as const;

// Cache
export const CACHE = {
  DEFAULT_TTL: 15, // minutes
  MEMBER_TTL: 60, // minutes
  CONTRIBUTION_TTL: 30, // minutes
  ANALYTICS_TTL: 15, // minutes
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
  // Legacy names for backward compatibility
  DEFAULT_TTL_MINUTES: 5,
  MEMBERS_TTL_MINUTES: 10,
  CONTRIBUTIONS_TTL_MINUTES: 5,
  ANALYTICS_TTL_MINUTES: 15,
} as const;

// Session
export const SESSION = {
  TIMEOUT_MINUTES: 30,
  WARNING_MINUTES: 25,
  CHECK_INTERVAL_MS: 60000, // 1 minute
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] as const,
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'] as const,
} as const;

// Member
export const MEMBER = {
  MAX_DEPENDANTS: 3,
  AVATAR_SIZE: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg',
  },
} as const;

// Contribution Types
export const CONTRIBUTION_TYPES = ['monthly', 'registration', 'other'] as const;
export const CONTRIBUTION_STATUSES = ['pending', 'approved', 'rejected'] as const;

// User Roles
export const USER_ROLES = ['admin', 'member', 'dc_member'] as const;

// Member Statuses
export const MEMBER_STATUSES = ['pending', 'approved', 'active', 'inactive'] as const;

// Payout Statuses
export const PAYOUT_STATUSES = ['pending', 'approved', 'paid'] as const;

// Claim Types
export const CLAIM_TYPES = ['death', 'funeral'] as const;
export const CLAIM_STATUSES = ['pending', 'approved', 'rejected'] as const;

// Expense Types
export const EXPENSE_TYPES = ['one-off', 'recurring'] as const;
export const EXPENSE_STATUSES = ['pending', 'paid', 'cancelled'] as const;

// Event Types
export const EVENT_TYPES = ['meeting', 'event', 'reminder'] as const;

// Recurrence Types
export const RECURRENCE_TYPES = ['none', 'monthly-date', 'monthly-day'] as const;

// Configuration Types
export const CONFIGURATION_TYPES = ['monthly_fee', 'late_penalty', 'registration_fee', 'other'] as const;

// Notification Types
export const NOTIFICATION_TYPES = ['success', 'error', 'warning', 'info'] as const;
export const NOTIFICATION_DURATION = {
  DEFAULT: 5000,
  SHORT: 3000,
  LONG: 8000,
} as const;

// Relationships
export const RELATIONSHIPS = ['spouse', 'child', 'parent', 'sibling', 'other'] as const;

// Disciplinary Status
export const DISCIPLINARY_STATUSES = ['pending', 'resolved'] as const;

// Host Assignment Statuses
export const HOST_ASSIGNMENT_STATUSES = ['pending', 'confirmed', 'completed', 'missed'] as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  FULL: 'dd MMM yyyy HH:mm',
  SHORT: 'dd/MM/yyyy',
  MONTH_YEAR: 'MMMM yyyy',
} as const;

// Analytics
export const ANALYTICS = {
  EVENTS: {
    PAGE_VIEW: 'page_view',
    CONTRIBUTION_ADDED: 'contribution_added',
    MEMBER_REGISTERED: 'member_registered',
    CLAIM_SUBMITTED: 'claim_submitted',
  },
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 1000000,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_FAILED: 'Please check your input and try again',
} as const;
