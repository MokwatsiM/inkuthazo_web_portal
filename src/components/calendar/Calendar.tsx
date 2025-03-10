import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import type { Event } from "../../types/event";

const Calendar: React.FC = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsRef = collection(db, "events");
      const eventsSnapshot = await getDocs(query(eventsRef));
      const eventsData = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    const baseEventId = info.event.id.split("-")[0];
    const event = events.find((e) => e.id === baseEventId);
    if (event) {
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  };

  const handleDateSelect = () => {
    if (isAdmin) {
      setIsAddModalOpen(true);
    }
  };

  const getEventColor = (type: Event["type"]) => {
    switch (type) {
      case "meeting":
        return {
          backgroundColor: "#4F46E5", // Indigo
          borderColor: "#4338CA",
          textColor: "#ffffff",
          display: "block", // Force block display
        };
      case "event":
        return {
          backgroundColor: "#10B981", // Green
          borderColor: "#059669",
          textColor: "#ffffff",
          display: "block",
        };
      case "reminder":
        return {
          backgroundColor: "#F59E0B", // Yellow
          borderColor: "#D97706",
          textColor: "#ffffff",
          display: "block",
        };
      default:
        return {
          backgroundColor: "#6B7280", // Gray
          borderColor: "#4B5563",
          textColor: "#ffffff",
          display: "block",
        };
    }
  };

  const findNthDayInMonth = (
    year: number,
    month: number,
    dayOfWeek: number,
    n: number
  ): Date | null => {
    const date = new Date(year, month, 1);

    // Find the first occurrence of the day
    while (date.getDay() !== dayOfWeek) {
      date.setDate(date.getDate() + 1);
    }

    // Move to the nth occurrence
    date.setDate(date.getDate() + (n - 1) * 7);

    // If we've moved to the next month, return null
    if (date.getMonth() !== month) {
      return null;
    }

    return date;
  };

  const copyTimeToDate = (source: Date, target: Date): Date => {
    const result = new Date(target);
    result.setHours(source.getHours());
    result.setMinutes(source.getMinutes());
    result.setSeconds(source.getSeconds());
    result.setMilliseconds(source.getMilliseconds());
    return result;
  };

  const generateRecurringEvents = (event: Event): any[] => {
    const eventColors = getEventColor(event.type);

    if (!event.recurrence) {
      return [
        {
          id: event.id,
          title: event.title,
          start: event.start.toDate(),
          end: event.end.toDate(),
          allDay: event.allDay,
          ...eventColors,
          classNames: ["event-item"],
          extendedProps: {
            description: event.description,
            venue: event.venue,
          },
        },
      ];
    }

    const recurringEvents = [];
    const originalStart = event.start.toDate();
    const originalEnd = event.end.toDate();
    const duration = originalEnd.getTime() - originalStart.getTime();

    // Generate events for the next 12 months
    for (let i = 0; i < 12; i++) {
      let recurringDate: Date | null = null;

      const targetMonth = originalStart.getMonth() + i;
      const targetYear =
        originalStart.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;

      if (event.recurrence.type === "monthly-date") {
        // Same date every month
        const targetDate = new Date(
          targetYear,
          normalizedMonth,
          event.recurrence.dayOfMonth!
        );

        // Check if the date is valid
        if (targetDate.getMonth() === normalizedMonth) {
          // Copy the original time to the new date
          recurringDate = copyTimeToDate(originalStart, targetDate);
        }
      } else if (event.recurrence.type === "monthly-day") {
        // Same week and day every month (e.g., 2nd Sunday)
        const baseDate = findNthDayInMonth(
          targetYear,
          normalizedMonth,
          event.recurrence.dayOfWeek!,
          event.recurrence.weekNumber!
        );

        if (baseDate) {
          // Copy the original time to the new date
          recurringDate = copyTimeToDate(originalStart, baseDate);
        }
      }

      // Only add if we found a valid date
      if (recurringDate) {
        const recurringEndDate = new Date(recurringDate.getTime() + duration);

        recurringEvents.push({
          id: `${event.id}-${i}`,
          title: `${event.title} (Recurring)`,
          start: recurringDate,
          end: recurringEndDate,
          allDay: event.allDay,
          ...eventColors,
          classNames: ["event-item"],
          extendedProps: {
            description: event.description,
            venue: event.venue,
          },
        });
      }
    }

    return recurringEvents;
  };

  const calendarEvents = events.flatMap((event) =>
    generateRecurringEvents(event)
  );

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Calendar</h2>
        {isAdmin && (
          <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Event
          </Button>
        )}
      </div>

      <style>
        {`
          .fc {
            max-width: 100%;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
          }
          
          .fc .fc-toolbar {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .fc .fc-toolbar-title {
            font-size: 1.25rem;
          }

          .fc-event {
            cursor: pointer;
            padding: 2px 4px;
            font-size: 0.875rem;
            margin: 1px 0;
          }

          .fc-timegrid-event {
            min-height: 2em;
          }

          .fc-timegrid-event .fc-event-main {
            padding: 2px 4px;
          }

          .fc-v-event {
            border: none;
            background-color: var(--fc-event-bg-color);
          }

          .fc-h-event {
            border: none;
            background-color: var(--fc-event-bg-color);
          }

          @media (max-width: 640px) {
            .fc .fc-toolbar {
              display: flex;
              flex-direction: column;
              align-items: stretch;
            }

            .fc .fc-toolbar-title {
              font-size: 1.1rem;
              text-align: center;
            }

            .fc .fc-button {
              padding: 0.4rem 0.8rem;
              font-size: 0.875rem;
            }

            .fc .fc-view-harness {
              min-height: 400px;
            }

            .fc-event {
              font-size: 0.75rem;
            }
          }

          .fc-day-today {
            background-color: #f3f4f6 !important;
          }

          .dark .fc-day-today {
            background-color: rgba(55, 65, 81, 0.3) !important;
          }

          .fc-button-primary {
            background-color: #6366f1 !important;
            border-color: #4f46e5 !important;
          }

          .fc-button-primary:hover {
            background-color: #4f46e5 !important;
            border-color: #4338ca !important;
          }

          .fc-button-primary:disabled {
            background-color: #818cf8 !important;
            border-color: #6366f1 !important;
          }

          .dark .fc {
            color: #e5e7eb;
          }

          .dark .fc-button-primary {
            color: #ffffff;
          }

          .dark .fc-day, .dark .fc-day-top {
            background-color: #1f2937;
            border-color: #374151;
          }

          .dark .fc th {
            background-color: #111827;
            border-color: #374151;
            color: #9ca3af;
          }
        `}
      </style>

      <div className="h-[600px] sm:h-[800px]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: isMobile ? "prev,next" : "prev,next today",
            center: "title",
            right: isMobile
              ? "dayGridMonth,timeGridDay"
              : "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView={isMobile ? "dayGridMonth" : "dayGridMonth"}
          editable={isAdmin}
          selectable={isAdmin}
          selectMirror={true}
          dayMaxEvents={isMobile ? 2 : true}
          weekends={true}
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
          contentHeight="auto"
          aspectRatio={isMobile ? 0.8 : 1.35}
          expandRows={true}
          handleWindowResize={true}
          views={{
            dayGridMonth: {
              titleFormat: { year: "numeric", month: "short" },
              dayHeaderFormat: { weekday: isMobile ? "narrow" : "short" },
            },
            timeGridWeek: {
              titleFormat: { year: "numeric", month: "short" },
              dayHeaderFormat: {
                weekday: isMobile ? "narrow" : "short",
                day: "numeric",
              },
            },
            timeGridDay: {
              titleFormat: { year: "numeric", month: "short", day: "numeric" },
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
          }}
          eventContent={(arg) => {
            return (
              <>
                <div className="fc-event-main-frame">
                  <div className="fc-event-title-container">
                    <div className="fc-event-title">{arg.event.title}</div>
                  </div>
                  {!arg.event.allDay && (
                    <div className="fc-event-time">{arg.timeText}</div>
                  )}
                  {arg.event.extendedProps.venue && (
                    <div className="text-xs opacity-75">
                      @ {arg.event.extendedProps.venue}
                    </div>
                  )}
                </div>
              </>
            );
          }}
        />
      </div>

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEventAdded={fetchEvents}
      />

      {selectedEvent && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onEventUpdated={fetchEvents}
        />
      )}
    </div>
  );
};

export default Calendar;
