import { startOfMonth, isSameMonth } from 'date-fns';
import type { Contribution } from '../types/contribution';

export const hasDuplicateContribution = (
  contributions: Contribution[],
  newContribution: Pick<Contribution, 'type' | 'date'>
): boolean => {
  // Only validate monthly and registration contributions
  if (newContribution.type === 'other') {
    return false;
  }

  const newContributionMonth = startOfMonth(newContribution.date.toDate());
  
  return contributions.some(contribution => {
    // Check if there's already a contribution of the same type in the same month
    return contribution.type === newContribution.type &&
           isSameMonth(contribution.date.toDate(), newContributionMonth);
  });
};