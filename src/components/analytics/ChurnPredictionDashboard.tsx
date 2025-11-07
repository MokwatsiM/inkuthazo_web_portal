import React, { useMemo, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ChurnAnalysis, MemberChurnPrediction } from '../../types/predictiveAnalytics';

interface ChurnPredictionDashboardProps {
  churnAnalysis: ChurnAnalysis | null;
  isLoading?: boolean;
  onMemberClick?: (memberId: string) => void;
}

const ChurnPredictionDashboard = React.memo<ChurnPredictionDashboardProps>(({
  churnAnalysis,
  isLoading = false,
  onMemberClick,
}) => {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const riskDistributionData = useMemo(() => {
    if (!churnAnalysis) return [];

    return [
      {
        id: 'High Risk',
        label: 'High Risk',
        value: churnAnalysis.riskDistribution.high,
        color: '#ef4444',
      },
      {
        id: 'Medium Risk',
        label: 'Medium Risk',
        value: churnAnalysis.riskDistribution.medium,
        color: '#f59e0b',
      },
      {
        id: 'Low Risk',
        label: 'Low Risk',
        value: churnAnalysis.riskDistribution.low,
        color: '#10b981',
      },
    ];
  }, [churnAnalysis]);

  const filteredMembers = useMemo(() => {
    if (!churnAnalysis) return [];
    if (selectedRiskLevel === 'all') return churnAnalysis.atRiskMembers;
    return churnAnalysis.atRiskMembers.filter(
      (member) => member.riskLevel === selectedRiskLevel
    );
  }, [churnAnalysis, selectedRiskLevel]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!churnAnalysis) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">No churn prediction data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Member Churn Prediction
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total At Risk</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {churnAnalysis.atRiskMembers.length}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {churnAnalysis.totalMembers > 0 
                ? ((churnAnalysis.atRiskMembers.length / churnAnalysis.totalMembers) * 100).toFixed(1)
                : '0'}% of members
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-400">High Risk</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
              {churnAnalysis.riskDistribution.high}
            </p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">Immediate attention</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Medium Risk</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600 dark:text-yellow-400">
              {churnAnalysis.riskDistribution.medium}
            </p>
            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">Monitor closely</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Low Risk</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
              {churnAnalysis.riskDistribution.low}
            </p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">Keep engaged</p>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Risk Distribution
        </h3>
        <div className="h-64">
          <ResponsivePie
            data={riskDistributionData}
            margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ datum: 'data.color' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#374151"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="#ffffff"
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#374151',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
              },
            ]}
          />
        </div>
      </div>

      {/* Recommendations */}
      {churnAnalysis.atRiskMembers.some(member => member.recommendations?.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Recommended Actions
          </h3>
          <ul className="space-y-2">
            {churnAnalysis.atRiskMembers
              .flatMap(member => member.recommendations || [])
              .slice(0, 5)
              .map((recommendation: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">{recommendation}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* At-Risk Members List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">At-Risk Members</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRiskLevel('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedRiskLevel === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedRiskLevel('high')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedRiskLevel === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setSelectedRiskLevel('medium')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedRiskLevel === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSelectedRiskLevel('low')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedRiskLevel === 'low'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Low
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No members found with {selectedRiskLevel} risk level
            </p>
          ) : (
            filteredMembers.map((member) => (
              <MemberChurnCard
                key={member.memberId}
                member={member}
                onClick={onMemberClick}
                getRiskColor={getRiskColor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

ChurnPredictionDashboard.displayName = 'ChurnPredictionDashboard';

// Sub-component for member churn card
interface MemberChurnCardProps {
  member: MemberChurnPrediction;
  onClick?: (memberId: string) => void;
  getRiskColor: (riskLevel: string) => string;
}

const MemberChurnCard = React.memo<MemberChurnCardProps>(({ member, onClick, getRiskColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-4 ${getRiskColor(member.riskLevel)}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4
              className="font-semibold cursor-pointer hover:underline"
              onClick={() => onClick?.(member.memberId)}
            >
              {member.memberName}
            </h4>
            <span className="text-xs font-medium px-2 py-1 rounded uppercase">
              {member.riskLevel} Risk
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <span className="text-sm font-medium">Risk Score:</span>
              <span className="ml-2 text-lg font-bold">{member.riskScore.toFixed(0)}/100</span>
            </div>
            <div>
              <span className="text-sm font-medium">Confidence:</span>
              <span className="ml-2">{(member.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium hover:underline"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 pt-3 border-t border-current/20">
          {/* Risk Factors */}
          <div>
            <h5 className="text-sm font-semibold mb-2">Risk Factors:</h5>
            <div className="space-y-1">
              {member.riskFactors.map((factor, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{factor.factor}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/30 rounded-full h-2">
                      <div
                        className="bg-current h-2 rounded-full"
                        style={{ width: `${factor.score}%` }}
                      ></div>
                    </div>
                    <span className="font-medium w-12 text-right">{factor.score.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {member.recommendations.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold mb-2">Recommended Actions:</h5>
              <ul className="space-y-1">
                {member.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MemberChurnCard.displayName = 'MemberChurnCard';

export default ChurnPredictionDashboard;
