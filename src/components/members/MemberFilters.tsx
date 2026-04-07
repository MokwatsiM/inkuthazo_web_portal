import React, { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { StatusPill } from "../ui/Badge";
import Button from "../ui/Button";
import logger from "../../utils/logger";

export interface FilterOptions {
  status: string[];
  joinDateRange: {
    start: string;
    end: string;
  };
  quickFilter: 'all' | 'recent' | 'pending' | 'active' | 'approved';
}

interface MemberFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'approved', label: 'Approved', count: 0 },
    { value: 'active', label: 'Active', count: 0 },
    { value: 'inactive', label: 'Inactive', count: 0 },
  ];

  const quickFilters = [
    { value: 'all' as const, label: 'All Members', count: totalCount },
    { value: 'recent' as const, label: 'Recent (30 days)', count: 0 },
    { value: 'pending' as const, label: 'Pending Approval', count: 0 },
    { value: 'active' as const, label: 'Active Members', count: 0 },
  ];

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];

    onFiltersChange({
      ...filters,
      status: newStatuses,
    });
  };

  const handleQuickFilter = (quickFilter: FilterOptions['quickFilter']) => {
    onFiltersChange({
      ...filters,
      quickFilter,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      joinDateRange: { start: '', end: '' },
      quickFilter: 'all',
    });
  };

  const hasActiveFilters = filters.status.length > 0 ||
    filters.quickFilter !== 'all' ||
    filters.joinDateRange.start ||
    filters.joinDateRange.end;

  return (
    <div className="bg-surface dark:bg-surface-dark border-b border-line dark:border-line-dark">
      {/* Quick filters */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </div>
            {filteredCount !== totalCount && (
              <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                Showing {filteredCount} of {totalCount} members
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="small"
                onClick={clearAllFilters}
                icon={X}
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              icon={ChevronDown}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>

        {/* Quick filter buttons */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleQuickFilter(filter.value)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filters.quickFilter === filter.value
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-700'
                  : 'bg-surface-2 dark:bg-surface-2-dark text-text-primary dark:text-text-primary-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark border border-transparent'
                }
              `}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-1 text-xs opacity-75">({filter.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-line dark:border-line-dark">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Status
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => handleStatusToggle(option.value)}
                      className="w-4 h-4 text-primary-600 border-line dark:border-line-dark rounded focus:ring-primary-500"
                    />
                    <StatusPill status={option.value as any} />
                    {option.count > 0 && (
                      <span className="text-xs text-text-secondary dark:text-text-secondary-dark">({option.count})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Date range filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Join Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.joinDateRange.start}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    joinDateRange: { ...filters.joinDateRange, start: e.target.value }
                  })}
                  className="block w-full rounded-input border border-line dark:border-line-dark text-sm focus:border-primary-500 focus:ring-primary-500 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.joinDateRange.end}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    joinDateRange: { ...filters.joinDateRange, end: e.target.value }
                  })}
                  className="block w-full rounded-input border border-line dark:border-line-dark text-sm focus:border-primary-500 focus:ring-primary-500 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Additional filters space */}
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Actions
              </label>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="small"
                  fullWidth
                  onClick={() => {
                    // Export filtered members
                    logger.debug('Export filtered members');
                  }}
                >
                  Export Filtered
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberFilters;