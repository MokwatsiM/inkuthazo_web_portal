import { Timestamp } from "firebase/firestore";

export type EventType = "meeting" | "event" | "reminder";
export type RecurrenceType = "none" | "monthly-date" | "monthly-day";

export interface Event {
  id: string;
  title: string;
  description: string;
  venue?: string;
  start: Timestamp;
  end: Timestamp;
  allDay: boolean;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  color?: string;
  type: EventType;
  recurrence?: {
    type: RecurrenceType;
    dayOfMonth?: number;
    weekNumber?: number;
    dayOfWeek?: number;
  };
}

export type EventInput = Omit<Event, "id" | "created_at" | "updated_at">;
