import * as functions from 'firebase-functions';

export interface ErrorContext {
  functionName: string;
  userId?: string;
  data?: any;
  error: any;
}

export class AppError extends Error {
  public readonly statusCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: string = 'internal', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleFunctionError(context: ErrorContext): functions.https.HttpsError {
  const { functionName, userId, data, error } = context;

  // Log the error with context
  functions.logger.error(`Error in ${functionName}:`, {
    userId,
    data,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    timestamp: new Date().toISOString(),
  });

  // Handle known error types
  if (error instanceof functions.https.HttpsError) {
    return error;
  }

  if (error instanceof AppError) {
    return new functions.https.HttpsError(
      error.statusCode as any,
      error.message
    );
  }

  // Handle Google API errors
  if (error.code >= 400 && error.code < 500) {
    return new functions.https.HttpsError(
      'invalid-argument',
      `Google Sheets API error: ${error.message}`
    );
  }

  if (error.code >= 500) {
    return new functions.https.HttpsError(
      'internal',
      'Google Sheets service temporarily unavailable'
    );
  }

  // Handle Firestore errors
  if (error.code === 'permission-denied') {
    return new functions.https.HttpsError(
      'permission-denied',
      'Insufficient permissions'
    );
  }

  if (error.code === 'not-found') {
    return new functions.https.HttpsError(
      'not-found',
      'Resource not found'
    );
  }

  // Default error
  return new functions.https.HttpsError(
    'internal',
    `An error occurred in ${functionName}`
  );
}

export function validateInput(data: any, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new AppError(
        `Missing required field: ${field}`,
        'invalid-argument'
      );
    }
  }
}

export function logFunctionStart(functionName: string, data?: any, userId?: string): void {
  functions.logger.info(`${functionName} started:`, {
    functionName,
    userId,
    data: data ? Object.keys(data) : undefined,
    timestamp: new Date().toISOString(),
  });
}

export function logFunctionSuccess(functionName: string, result?: any, userId?: string): void {
  functions.logger.info(`${functionName} completed successfully:`, {
    functionName,
    userId,
    resultKeys: result ? Object.keys(result) : undefined,
    timestamp: new Date().toISOString(),
  });
}