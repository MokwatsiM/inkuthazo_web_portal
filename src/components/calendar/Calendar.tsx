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
import { addMonths, getWeekOfMonth } from "date-fns";
import type { Event } from "../../types/event";

const Calendar: React.FC = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    // Extract the base event ID by removing any recurring instance suffix
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
        return "#4F46E5"; // Indigo
      case "event":
        return "#10B981"; // Green
      case "reminder":
        return "#F59E0B"; // Yellow
      default:
        return "#6B7280"; // Gray
    }
  };

  const generateRecurringEvents = (event: Event): any[] => {
    if (!event.recurrence) {
      return [
        {
          id: event.id,
          title: event.title,
          start: event.start.toDate(),
          end: event.end.toDate(),
          allDay: event.allDay,
          backgroundColor: getEventColor(event.type),
          borderColor: getEventColor(event.type),
        },
      ];
    }

    const recurringEvents = [];
    const startDate = event.start.toDate();
    const endDate = event.end.toDate();
    const duration = endDate.getTime() - startDate.getTime();

    // Generate events for the next 12 months
    for (let i = 0; i < 12; i++) {
      let recurringDate: Date;

      if (event.recurrence.type === "monthly-date") {
        // Same date every month
        recurringDate = addMonths(startDate, i);
        recurringDate.setDate(event.recurrence.dayOfMonth!);
      } else if (event.recurrence.type === "monthly-day") {
        // Same week and day every month (e.g., 2nd Sunday)
        recurringDate = addMonths(startDate, i);

        // Find the correct day in the month
        let currentDate = new Date(
          recurringDate.getFullYear(),
          recurringDate.getMonth(),
          1
        );
        while (
          getWeekOfMonth(currentDate) !== event.recurrence.weekNumber! ||
          currentDate.getDay() !== event.recurrence.dayOfWeek!
        ) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (currentDate.getMonth() !== recurringDate.getMonth()) {
            // Skip if we can't find the day in this month
            continue;
          }
        }
        recurringDate = currentDate;
      } else {
        continue;
      }

      // Only add if the date is valid
      if (recurringDate.toString() !== "Invalid Date") {
        const recurringEndDate = new Date(recurringDate.getTime() + duration);

        recurringEvents.push({
          id: `${event.id}-${i}`,
          title: `${event.title} (Recurring)`,
          start: recurringDate,
          end: recurringEndDate,
          allDay: event.allDay,
          backgroundColor: getEventColor(event.type),
          borderColor: getEventColor(event.type),
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
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Calendar</h2>
        {isAdmin && (
          <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Event
          </Button>
        )}
      </div>

      <div className="h-[800px]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView="dayGridMonth"
          editable={isAdmin}
          selectable={isAdmin}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
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
