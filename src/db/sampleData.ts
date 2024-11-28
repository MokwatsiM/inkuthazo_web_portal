import { Timestamp } from 'firebase/firestore';

export const members = [
  {
    id: 'member1',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+27123456789',
    join_date: Timestamp.fromDate(new Date('2023-01-15')),
    status: 'active'
  },
  {
    id: 'member2',
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+27123456790',
    join_date: Timestamp.fromDate(new Date('2023-02-20')),
    status: 'active'
  },
  {
    id: 'member3',
    full_name: 'Peter Jones',
    email: 'peter.jones@example.com',
    phone: '+27123456791',
    join_date: Timestamp.fromDate(new Date('2023-03-10')),
    status: 'active'
  },
  {
    id: 'member4',
    full_name: 'Mary Williams',
    email: 'mary.williams@example.com',
    phone: '+27123456792',
    join_date: Timestamp.fromDate(new Date('2023-04-05')),
    status: 'inactive'
  },
  {
    id: 'member5',
    full_name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '+27123456793',
    join_date: Timestamp.fromDate(new Date('2023-05-12')),
    status: 'active'
  }
];

export const contributions = [
  {
    id: 'contrib1',
    member_id: 'member1',
    amount: 500.00,
    date: Timestamp.fromDate(new Date('2024-01-15')),
    type: 'monthly',
    proof_of_payment: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=800&auto=format&fit=crop'
  },
  {
    member_id: 'member2',
    amount: 1000.00,
    date: Timestamp.fromDate(new Date('2024-01-20')),
    type: 'registration',
    proof_of_payment: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop'
  },
  {
    member_id: 'member3',
    amount: 500.00,
    date: Timestamp.fromDate(new Date('2024-02-10')),
    type: 'monthly',
    proof_of_payment: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop'
  },
  {
    member_id: 'member4',
    amount: 500.00,
    date: Timestamp.fromDate(new Date('2024-02-05')),
    type: 'monthly',
    proof_of_payment: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&auto=format&fit=crop'
  },
  {
    member_id: 'member5',
    amount: 750.00,
    date: Timestamp.fromDate(new Date('2024-02-12')),
    type: 'other',
    proof_of_payment: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=800&auto=format&fit=crop'
  },
  // Additional monthly contributions
  {
    member_id: 'member1',
    amount: 500.00,
    date: Timestamp.fromDate(new Date('2024-02-15')),
    type: 'monthly',
    proof_of_payment: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800&auto=format&fit=crop'
  },
  {
    member_id: 'member2',
    amount: 500.00,
    date: Timestamp.fromDate(new Date('2024-02-20')),
    type: 'monthly',
    proof_of_payment: 'https://images.unsplash.com/photo-1554224155-6723056edc89?w=800&auto=format&fit=crop'
  },
  {
    member_id: 'member3',
    amount: 500.00,
    date: Timestamp.fromDate(new Date('2024-03-10')),
    type: 'monthly',
    proof_of_payment: 'https://images.unsplash.com/photo-1554224154-fb5a76c6eb08?w=800&auto=format&fit=crop'
  }
];

export const payouts = [
  {
    amount: 5000.00,
    date: Timestamp.fromDate(new Date('2024-02-15')),
    reason: 'Family member funeral assistance',
    status: 'paid'
  },
  {
    amount: 7500.00,
    date: Timestamp.fromDate(new Date('2024-02-20')),
    reason: 'Member funeral benefit',
    status: 'pending'
  },
  {
    amount: 6000.00,
    date: Timestamp.fromDate(new Date('2024-03-10')),
    reason: 'Family member funeral assistance',
    status: 'approved'
  }
];