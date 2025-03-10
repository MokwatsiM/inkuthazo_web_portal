import { createEvents, DateArray } from "ics";
import { format } from "date-fns";
import type { Event } from "../../types/event";

const dateToArray = (date: Date): DateArray => [
  date.getFullYear(),
  date.getMonth() + 1,
  date.getDate(),
  date.getHours(),
  date.getMinutes(),
];

export const generateICSFile = (events: Event[]): string => {
  const icsEvents = events.map((event) => {
    const start = event.start.toDate();
    const end = event.end.toDate();

    const eventData = {
      start: dateToArray(start),
      end: dateToArray(end),
      title: event.title,
      description: event.description,
      location: event.venue,
      status: "CONFIRMED" as const,
      busyStatus: "BUSY" as const,
    };

    if (event.recurrence) {
      return {
        ...eventData,
        recurrenceRule: generateRecurrenceRule(event),
      };
    }

    return eventData;
  });

  const { error, value } = createEvents(icsEvents);

  if (error) {
    throw new Error("Failed to generate ICS file");
  }

  return value || "";
};

const generateRecurrenceRule = (event: Event): string => {
  if (!event.recurrence) return "";

  const { type, dayOfMonth, weekNumber, dayOfWeek } = event.recurrence;

  if (type === "monthly-date") {
    // RRULE for same date monthly (e.g., every 15th of the month)
    return `FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`;
  } else if (type === "monthly-day") {
    // RRULE for same day monthly (e.g., every second Sunday)
    const weekNumbers = ["1", "2", "3", "4", "-1"];
    const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

    if (weekNumber && dayOfWeek !== undefined) {
      return `FREQ=MONTHLY;BYDAY=${weekNumbers[weekNumber - 1]}${
        days[dayOfWeek]
      }`;
    }
  }

  return "";
};

export const downloadICSFile = (events: Event[]): void => {
  try {
    const icsContent = generateICSFile(events);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `events-${format(new Date(), "yyyy-MM-dd")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading ICS file:", error);
    throw error;
  }
};
