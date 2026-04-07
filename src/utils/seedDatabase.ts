import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { members, contributions, payouts } from '../db/sampleData';
import logger from './logger';

export const seedDatabase = async () => {
  try {
    // Seed members
    for (const member of members) {
      const { id, ...memberData } = member;
      await setDoc(doc(db, 'members', id), memberData);
    }
    logger.debug('Members seeded successfully');

    // Seed contributions
    for (const contribution of contributions) {
      const { id, ...contributionData } = contribution;
      await setDoc(doc(db, 'contributions', id), contributionData);
    }
    logger.debug('Contributions seeded successfully');

    // Seed payouts
    for (const payout of payouts) {
      const { id, ...payoutData } = payout;
      await setDoc(doc(db, 'payouts', id), payoutData);
    }
    logger.debug('Payouts seeded successfully');

    logger.debug('Database seeded successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};