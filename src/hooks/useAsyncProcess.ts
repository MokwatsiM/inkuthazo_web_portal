import { useState, useCallback } from "react";

export interface ProcessStep {
  step: string;
  percentage: number;
}

export interface AsyncProcessState {
  isLoading: boolean;
  progress: ProcessStep | null;
  error: string | null;
}

export interface UseAsyncProcessOptions {
  showProgress?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useAsyncProcess = (options: UseAsyncProcessOptions = {}) => {
  const [state, setState] = useState<AsyncProcessState>({
    isLoading: false,
    progress: null,
    error: null,
  });

  const execute = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    steps?: ProcessStep[]
  ): Promise<T | null> => {
    setState({
      isLoading: true,
      progress: null,
      error: null,
    });

    try {
      let result: T;

      if (steps && options.showProgress) {
        // Execute with progress steps
        for (let i = 0; i < steps.length; i++) {
          setState(prev => ({
            ...prev,
            progress: steps[i],
          }));

          if (i === steps.length - 1) {
            // Execute the actual function on the last step
            result = await asyncFunction();
          } else {
            // Add a small delay for progress visualization
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        // Keep completion message visible briefly
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Execute without progress
        result = await asyncFunction();
      }

      options.onSuccess?.();
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));

      options.onError?.(errorMessage);
      return null;

    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: null,
      }));
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Predefined step templates for common operations
export const ProcessSteps = {
  fileGeneration: [
    { step: "Preparing data...", percentage: 25 },
    { step: "Processing...", percentage: 50 },
    { step: "Generating file...", percentage: 75 },
    { step: "Download ready!", percentage: 100 },
  ],

  dataFetching: [
    { step: "Fetching data...", percentage: 30 },
    { step: "Processing results...", percentage: 70 },
    { step: "Complete!", percentage: 100 },
  ],

  invoice: [
    { step: "Calculating invoice details...", percentage: 30 },
    { step: "Generating PDF document...", percentage: 80 },
    { step: "Download ready!", percentage: 100 },
  ],

  report: (type: string) => [
    { step: `Fetching ${type} data...`, percentage: 25 },
    { step: "Processing report...", percentage: 50 },
    { step: "Generating document...", percentage: 75 },
    { step: "Download ready!", percentage: 100 },
  ],
};