/**
 * Statistical utility functions for predictive analytics
 */

export interface DataPoint {
  x: number; // Usually time (index or timestamp)
  y: number; // Value
}

/**
 * Calculate mean (average) of an array of numbers
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = mean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Calculate median value
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate percentile rank of a value in a dataset
 */
export function percentileRank(value: number, dataset: number[]): number {
  if (dataset.length === 0) return 0;
  const sorted = [...dataset].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return (below / sorted.length) * 100;
}

/**
 * Simple Linear Regression
 * Returns slope (m) and intercept (b) for y = mx + b
 */
export function linearRegression(data: DataPoint[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  if (data.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
  const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (coefficient of determination)
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
  const ssResidual = data.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

/**
 * Predict next values using linear regression
 */
export function predictLinear(
  historicalData: DataPoint[],
  futurePoints: number
): DataPoint[] {
  const { slope, intercept } = linearRegression(historicalData);
  const lastX = historicalData[historicalData.length - 1]?.x || 0;

  const predictions: DataPoint[] = [];
  for (let i = 1; i <= futurePoints; i++) {
    const x = lastX + i;
    const y = slope * x + intercept;
    predictions.push({ x, y: Math.max(0, y) }); // Ensure non-negative
  }

  return predictions;
}

/**
 * Simple Moving Average
 */
export function movingAverage(values: number[], period: number): number[] {
  if (period <= 0 || period > values.length) {
    return values;
  }

  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    result.push(mean(window));
  }

  return result;
}

/**
 * Weighted Moving Average (more recent values have higher weight)
 */
export function weightedMovingAverage(values: number[], period: number): number[] {
  if (period <= 0 || period > values.length) {
    return values;
  }

  const result: number[] = [];
  const weights = Array.from({ length: period }, (_, i) => i + 1);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const weightedSum = window.reduce((sum, val, idx) => sum + val * weights[idx], 0);
    result.push(weightedSum / weightSum);
  }

  return result;
}

/**
 * Exponential Moving Average
 * More weight to recent values, smoothly decreasing for older values
 */
export function exponentialMovingAverage(
  values: number[],
  smoothingFactor: number = 0.3
): number[] {
  if (values.length === 0) return [];

  const result: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const ema = smoothingFactor * values[i] + (1 - smoothingFactor) * result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate growth rate between two values
 */
export function growthRate(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

/**
 * Calculate trend (increasing, decreasing, or stable)
 */
export function calculateTrend(values: number[], threshold: number = 5): {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
} {
  if (values.length < 2) {
    return { direction: 'stable', percentage: 0 };
  }

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = mean(firstHalf);
  const secondAvg = mean(secondHalf);

  const change = growthRate(firstAvg, secondAvg);

  if (Math.abs(change) < threshold) {
    return { direction: 'stable', percentage: change };
  }

  return {
    direction: change > 0 ? 'increasing' : 'decreasing',
    percentage: change
  };
}

/**
 * Forecast with confidence intervals
 */
export function forecastWithConfidence(
  historicalData: DataPoint[],
  futurePoints: number,
  confidenceLevel: number = 0.85
): {
  predictions: DataPoint[];
  upperBound: DataPoint[];
  lowerBound: DataPoint[];
  confidence: number;
} {
  const predictions = predictLinear(historicalData, futurePoints);
  const historicalValues = historicalData.map(d => d.y);
  const stdDev = standardDeviation(historicalValues);

  // Z-score for confidence level (simplified)
  const zScore = confidenceLevel === 0.85 ? 1.44 :
                 confidenceLevel === 0.90 ? 1.65 :
                 confidenceLevel === 0.95 ? 1.96 : 1.65;

  const margin = stdDev * zScore;

  const upperBound = predictions.map(p => ({
    x: p.x,
    y: p.y + margin
  }));

  const lowerBound = predictions.map(p => ({
    x: p.x,
    y: Math.max(0, p.y - margin)
  }));

  // Calculate confidence based on R-squared
  const { r2 } = linearRegression(historicalData);
  const confidence = r2 * 100;

  return {
    predictions,
    upperBound,
    lowerBound,
    confidence
  };
}

/**
 * Detect seasonality in time series data
 */
export function detectSeasonality(values: number[], period: number = 12): {
  hasSeasonality: boolean;
  strength: number;
  pattern: number[];
} {
  if (values.length < period * 2) {
    return { hasSeasonality: false, strength: 0, pattern: [] };
  }

  // Calculate average for each position in the period
  const pattern: number[] = Array(period).fill(0);
  const counts: number[] = Array(period).fill(0);

  values.forEach((value, index) => {
    const position = index % period;
    pattern[position] += value;
    counts[position]++;
  });

  // Average each position
  for (let i = 0; i < period; i++) {
    pattern[i] = counts[i] > 0 ? pattern[i] / counts[i] : 0;
  }

  // Calculate strength (coefficient of variation)
  const patternMean = mean(pattern);
  const patternStdDev = standardDeviation(pattern);
  const strength = patternMean > 0 ? (patternStdDev / patternMean) * 100 : 0;

  // Significant if CV > 10%
  const hasSeasonality = strength > 10;

  return { hasSeasonality, strength, pattern };
}

/**
 * Normalize values to 0-100 scale
 */
export function normalize(
  value: number,
  min: number,
  max: number,
  targetMin: number = 0,
  targetMax: number = 100
): number {
  if (max === min) return targetMin;
  const normalized = ((value - min) / (max - min)) * (targetMax - targetMin) + targetMin;
  return Math.max(targetMin, Math.min(targetMax, normalized));
}

/**
 * Calculate correlation between two datasets
 */
export function correlation(dataset1: number[], dataset2: number[]): number {
  if (dataset1.length !== dataset2.length || dataset1.length === 0) {
    return 0;
  }

  const n = dataset1.length;
  const mean1 = mean(dataset1);
  const mean2 = mean(dataset2);

  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = dataset1[i] - mean1;
    const diff2 = dataset2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate volatility (relative standard deviation)
 */
export function volatility(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  const stdDev = standardDeviation(values);
  return (stdDev / Math.abs(avg)) * 100;
}
