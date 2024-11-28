import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { members, contributions, payouts } from '../db/sampleData';

export const seedDatabase = async () => {
  try {
    // Seed members
    for (const member of members) {
      const { id, ...memberData } = member;
      await setDoc(doc(db, 'members', id), memberData);
    }
    console.log('Members seeded successfully');

    // Seed contributions
    for (const contribution of contributions) {
      const { id, ...contributionData } = contribution;
      await setDoc(doc(db, 'contributions', id), contributionData);
    }
    console.log('Contributions seeded successfully');

    // Seed payouts
    for (const payout of payouts) {
      const { id, ...payoutData } = payout;
      await setDoc(doc(db, 'payouts', id), payoutData);
    }
    console.log('Payouts seeded successfully');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};