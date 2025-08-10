import { Timestamp } from 'firebase/firestore';

export type ConfigurationType = 'monthly_fee' | 'late_penalty' | 'registration_fee' | 'other';

export interface Configuration {
  id: string;
  type: ConfigurationType;
  name: string;
  description: string;
  value: number;
  effective_date: Timestamp;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  is_active: boolean;
}

export interface ConfigurationInput {
  type: ConfigurationType;
  name: string;
  description: string;
  value: number;
  effective_date: Date;
}