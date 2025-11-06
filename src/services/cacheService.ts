// src/services/cacheService.ts
import { CACHE } from '../constants';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  duration: number; // Cache duration in minutes
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private stats: CacheStats;

  private constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, size: 0 };

    // Cleanup expired entries every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), CACHE.CLEANUP_INTERVAL);
    }
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  set<T>(key: string, data: T, duration: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration * 60 * 1000 // Convert minutes to milliseconds
    });
    this.stats.size = this.cache.size;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
      this.stats = { hits: 0, misses: 0, size: 0 };
    }
    this.stats.size = this.cache.size;
  }

  /**
   * Clear all keys matching a pattern
   */
  clearPattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size = this.cache.size;
    return count;
  }

  isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() > item.expiresAt;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    this.stats.size = this.cache.size;
    return removed;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total === 0 ? 0 : (this.stats.hits / total) * 100;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }
}

export const cacheService = CacheService.getInstance();

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // Members
  member: (id: string) => `member:${id}`,
  members: (filters?: string) => `members:${filters || 'all'}`,
  membersList: () => 'members:list',

  // Contributions
  contribution: (id: string) => `contribution:${id}`,
  contributions: (filters?: string) => `contributions:${filters || 'all'}`,
  memberContributions: (memberId: string) => `contributions:member:${memberId}`,

  // Claims
  claim: (id: string) => `claim:${id}`,
  claims: (filters?: string) => `claims:${filters || 'all'}`,
  memberClaims: (memberId: string) => `claims:member:${memberId}`,

  // Payouts
  payout: (id: string) => `payout:${id}`,
  payouts: (filters?: string) => `payouts:${filters || 'all'}`,

  // Expenses
  expense: (id: string) => `expense:${id}`,
  expenses: (filters?: string) => `expenses:${filters || 'all'}`,

  // Dependants
  dependant: (id: string) => `dependant:${id}`,
  memberDependants: (memberId: string) => `dependants:member:${memberId}`,

  // Configuration
  configuration: (key: string, date?: Date) =>
    `config:${key}:${date?.toISOString() || 'current'}`,
  configurations: () => 'configurations:all',

  // Analytics
  analytics: (period: string) => `analytics:${period}`,
  dashboardStats: () => 'dashboard:stats',
};

/**
 * Cache invalidation patterns for data changes
 */
export const InvalidationPatterns = {
  onMemberChange: () => {
    cacheService.clearPattern('members:');
    cacheService.clearPattern('dashboard:');
    cacheService.clearPattern('analytics:');
  },

  onContributionChange: (memberId?: string) => {
    cacheService.clearPattern('contributions:');
    if (memberId) {
      cacheService.clear(CacheKeys.memberContributions(memberId));
      cacheService.clear(CacheKeys.member(memberId));
    }
    cacheService.clearPattern('dashboard:');
    cacheService.clearPattern('analytics:');
  },

  onClaimChange: (memberId?: string) => {
    cacheService.clearPattern('claims:');
    if (memberId) {
      cacheService.clear(CacheKeys.memberClaims(memberId));
    }
    cacheService.clearPattern('dashboard:');
    cacheService.clearPattern('analytics:');
  },

  onPayoutChange: () => {
    cacheService.clearPattern('payouts:');
    cacheService.clearPattern('dashboard:');
    cacheService.clearPattern('analytics:');
  },

  onExpenseChange: () => {
    cacheService.clearPattern('expenses:');
    cacheService.clearPattern('dashboard:');
    cacheService.clearPattern('analytics:');
  },

  onConfigurationChange: () => {
    cacheService.clearPattern('config:');
    cacheService.clear(CacheKeys.configurations());
  },
};
