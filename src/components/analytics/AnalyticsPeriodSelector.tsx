import React from 'react';
import Button from '../ui/Button';

export type AnalyticsPeriod = '3m' | '6m' | '12m' | 'all';

interface AnalyticsPeriodSelectorProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
}

const AnalyticsPeriodSelector = React.memo<AnalyticsPeriodSelectorProps>(({
  period,
  onPeriodChange,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      <div className="flex space-x-2">
        <Button
          variant={period === '3m' ? 'primary' : 'secondary'}
          onClick={() => onPeriodChange('3m')}
        >
          3 Months
        </Button>
        <Button
          variant={period === '6m' ? 'primary' : 'secondary'}
          onClick={() => onPeriodChange('6m')}
        >
          6 Months
        </Button>
        <Button
          variant={period === '12m' ? 'primary' : 'secondary'}
          onClick={() => onPeriodChange('12m')}
        >
          12 Months
        </Button>
        <Button
          variant={period === 'all' ? 'primary' : 'secondary'}
          onClick={() => onPeriodChange('all')}
        >
          All Time
        </Button>
      </div>
    </div>
  );
});

AnalyticsPeriodSelector.displayName = 'AnalyticsPeriodSelector';

export default AnalyticsPeriodSelector;
