import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';
import logger from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents entire app from crashing due to component errors
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      logger.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Log to error reporting service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);

    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark p-4">
          <div className="max-w-md w-full">
            <div className="bg-surface dark:bg-surface-dark border border-line dark:border-line-dark rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <h1 className="text-2xl font-semibold text-center text-text-primary dark:text-text-primary-dark mb-2">
                Something went wrong
              </h1>

              <p className="text-center text-text-secondary dark:text-text-secondary-dark mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page or
                return to the home page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 p-4 bg-surface-hover dark:bg-surface-dark rounded-lg border border-line dark:border-line-dark">
                  <summary className="cursor-pointer text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
                        Error:
                      </p>
                      <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-text-tertiary dark:text-text-tertiary-dark overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="secondary"
                  icon={RefreshCw}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="primary"
                  icon={Home}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
