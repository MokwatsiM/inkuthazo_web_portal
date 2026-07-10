import { describe, it, expect } from 'vitest';
import {
  mean,
  median,
  standardDeviation,
  percentileRank,
  linearRegression,
  predictLinear,
  movingAverage,
  weightedMovingAverage,
  exponentialMovingAverage,
  growthRate,
  calculateTrend,
  normalize,
  correlation,
  volatility,
  detectSeasonality,
  forecastWithConfidence,
} from './statistics';

describe('mean', () => {
  it('averages values', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns 0 for an empty array', () => {
    expect(mean([])).toBe(0);
  });
});

describe('median', () => {
  it('returns the middle value for odd-length arrays', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('averages the two middle values for even-length arrays', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns 0 for an empty array', () => {
    expect(median([])).toBe(0);
  });
});

describe('standardDeviation', () => {
  it('computes population standard deviation', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });

  it('is 0 for identical values', () => {
    expect(standardDeviation([3, 3, 3])).toBe(0);
  });
});

describe('percentileRank', () => {
  it('returns the percentage of values below the given value', () => {
    expect(percentileRank(3, [1, 2, 3, 4])).toBe(50);
  });

  it('returns 0 for an empty dataset', () => {
    expect(percentileRank(10, [])).toBe(0);
  });
});

describe('linearRegression', () => {
  it('recovers slope and intercept of a perfect line', () => {
    const data = [0, 1, 2, 3].map((x) => ({ x, y: 2 * x + 1 }));
    const { slope, intercept, r2 } = linearRegression(data);
    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(1);
    expect(r2).toBeCloseTo(1);
  });

  it('returns zeros with fewer than two points', () => {
    expect(linearRegression([{ x: 1, y: 1 }])).toEqual({
      slope: 0,
      intercept: 0,
      r2: 0,
    });
  });
});

describe('predictLinear', () => {
  it('extrapolates the fitted line', () => {
    const data = [0, 1, 2].map((x) => ({ x, y: 10 * x }));
    const predictions = predictLinear(data, 2);
    expect(predictions).toHaveLength(2);
    expect(predictions[0].x).toBe(3);
    expect(predictions[0].y).toBeCloseTo(30);
    expect(predictions[1].y).toBeCloseTo(40);
  });

  it('clamps predictions at zero for downward trends', () => {
    const data = [0, 1, 2].map((x) => ({ x, y: 10 - 10 * x }));
    const predictions = predictLinear(data, 3);
    expect(predictions.every((p) => p.y >= 0)).toBe(true);
  });
});

describe('movingAverage', () => {
  it('averages each rolling window', () => {
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1.5, 2.5, 3.5]);
  });

  it('returns input unchanged when the period is invalid', () => {
    expect(movingAverage([1, 2], 0)).toEqual([1, 2]);
    expect(movingAverage([1, 2], 3)).toEqual([1, 2]);
  });
});

describe('weightedMovingAverage', () => {
  it('weights recent values more heavily', () => {
    // window [1, 2] with weights [1, 2] -> (1*1 + 2*2) / 3
    expect(weightedMovingAverage([1, 2], 2)[0]).toBeCloseTo(5 / 3);
  });
});

describe('exponentialMovingAverage', () => {
  it('starts at the first value and smooths subsequent ones', () => {
    const result = exponentialMovingAverage([10, 20], 0.5);
    expect(result).toEqual([10, 15]);
  });

  it('returns an empty array for empty input', () => {
    expect(exponentialMovingAverage([])).toEqual([]);
  });
});

describe('growthRate', () => {
  it('computes percentage growth', () => {
    expect(growthRate(100, 150)).toBe(50);
    expect(growthRate(100, 50)).toBe(-50);
  });

  it('handles a zero baseline', () => {
    expect(growthRate(0, 10)).toBe(100);
    expect(growthRate(0, 0)).toBe(0);
  });
});

describe('calculateTrend', () => {
  it('detects an increasing trend', () => {
    const { direction } = calculateTrend([10, 10, 20, 20]);
    expect(direction).toBe('increasing');
  });

  it('detects a decreasing trend', () => {
    const { direction } = calculateTrend([20, 20, 10, 10]);
    expect(direction).toBe('decreasing');
  });

  it('treats small changes as stable', () => {
    const { direction } = calculateTrend([100, 100, 102, 102]);
    expect(direction).toBe('stable');
  });

  it('is stable with fewer than two values', () => {
    expect(calculateTrend([5])).toEqual({ direction: 'stable', percentage: 0 });
  });
});

describe('normalize', () => {
  it('scales a value into the target range', () => {
    expect(normalize(5, 0, 10)).toBe(50);
  });

  it('clamps values outside the source range', () => {
    expect(normalize(20, 0, 10)).toBe(100);
    expect(normalize(-5, 0, 10)).toBe(0);
  });

  it('returns targetMin when min equals max', () => {
    expect(normalize(5, 5, 5)).toBe(0);
  });
});

describe('correlation', () => {
  it('is 1 for perfectly correlated data', () => {
    expect(correlation([1, 2, 3], [10, 20, 30])).toBeCloseTo(1);
  });

  it('is -1 for perfectly inverse data', () => {
    expect(correlation([1, 2, 3], [30, 20, 10])).toBeCloseTo(-1);
  });

  it('is 0 for mismatched lengths', () => {
    expect(correlation([1, 2], [1, 2, 3])).toBe(0);
  });
});

describe('volatility', () => {
  it('is 0 for constant values', () => {
    expect(volatility([5, 5, 5])).toBe(0);
  });

  it('returns relative standard deviation as a percentage', () => {
    // mean 5, stddev 1 -> 20%
    expect(volatility([4, 5, 6])).toBeCloseTo((Math.sqrt(2 / 3) / 5) * 100);
  });
});

describe('detectSeasonality', () => {
  it('requires at least two full periods of data', () => {
    expect(detectSeasonality([1, 2, 3], 12)).toEqual({
      hasSeasonality: false,
      strength: 0,
      pattern: [],
    });
  });

  it('detects a strongly repeating pattern', () => {
    const values = [10, 100, 10, 100, 10, 100, 10, 100];
    const result = detectSeasonality(values, 2);
    expect(result.hasSeasonality).toBe(true);
    expect(result.pattern).toEqual([10, 100]);
  });
});

describe('forecastWithConfidence', () => {
  it('produces symmetric bounds around the prediction', () => {
    const data = [0, 1, 2, 3].map((x) => ({ x, y: 5 * x + 3 }));
    const { predictions, upperBound, lowerBound, confidence } =
      forecastWithConfidence(data, 2);
    expect(predictions).toHaveLength(2);
    expect(upperBound[0].y).toBeGreaterThanOrEqual(predictions[0].y);
    expect(lowerBound[0].y).toBeLessThanOrEqual(predictions[0].y);
    expect(confidence).toBeCloseTo(100);
  });
});
