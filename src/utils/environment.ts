/**
 * Environment utility functions
 */

// Check if we're in development mode
export const isDevelopment = () => import.meta.env.MODE === "development";

// Check if we're in production mode
export const isProduction = () => import.meta.env.MODE === "production";

// Get current environment name
export const getEnvironment = () => import.meta.env.MODE;

// Get Firebase project ID for current environment
export const getFirebaseProjectId = () => {
  return isDevelopment()
    ? import.meta.env.VITE_DEV_FIREBASE_PROJECT_ID
    : import.meta.env.VITE_FIREBASE_PROJECT_ID;
};

// Log environment info (useful for debugging)
export const logEnvironmentInfo = () => {
  if (isDevelopment()) {
    console.log("Running in development environment");
    console.log(
      "Firebase Project:",
      import.meta.env.VITE_DEV_FIREBASE_PROJECT_ID
    );
  }
};
