import React, { useState } from "react";
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import { format, getWeekOfMonth } from "date-fns";
import type { Event, RecurrenceType } from "../../types/event";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onEventUpdated: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onEventUpdated,
}) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    venue: event.venue || "",
    start: format(event.start.toDate(), "yyyy-MM-dd"),
    startTime: format(event.start.toDate(), "HH:mm"),
    end: format(event.end.toDate(), "yyyy-MM-dd"),
    endTime: format(event.end.toDate(), "HH:mm"),
    allDay: event.allDay,
    type: event.type,
    recurrenceType: event.recurrence?.type || ("none" as RecurrenceType),
  });

  // Calculate week number and day of week when start date changes
  const [weekNumber, setWeekNumber] = useState<number>(
    getWeekOfMonth(event.start.toDate())
  );
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    event.start.toDate().getDay()
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    event.start.toDate().getDate()
  );

  if (!isOpen) return null;

  const getRecurrenceDescription = () => {
    if (formData.recurrenceType === "monthly-date") {
      return `This event will repeat on day ${dayOfMonth} of every month`;
    } else if (formData.recurrenceType === "monthly-day") {
      const weeks = ["first", "second", "third", "fourth", "last"];
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return `This event will repeat on the ${weeks[weekNumber - 1]} ${
        days[dayOfWeek]
      } of every month`;
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDate = new Date(`${formData.start}T${formData.startTime}`);
      const endDate = new Date(`${formData.end}T${formData.endTime}`);

      const eventRef = doc(db, "events", event.id);
      const updateData: Partial<Event> = {
        title: formData.title,
        description: formData.description,

        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        allDay: formData.allDay,
        type: formData.type,
        updated_at: Timestamp.now(),
      };
      // Only add venue if it's not empty
      if (formData.venue.trim()) {
        updateData.venue = formData.venue.trim();
      }

      // Add recurrence data if selected
      if (formData.recurrenceType !== "none") {
        updateData.recurrence = {
          type: formData.recurrenceType,
          ...(formData.recurrenceType === "monthly-date" && { dayOfMonth }),
          ...(formData.recurrenceType === "monthly-day" && {
            weekNumber,
            dayOfWeek,
          }),
        };
      } else {
        // Remove recurrence by setting it to undefined instead of null
        updateData.recurrence = undefined;
      }

      await updateDoc(eventRef, updateData);
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteDoc(doc(db, "events", event.id));
      onEventUpdated();
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 z-50">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {isAdmin ? "Edit Event" : "Event Details"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  readOnly={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  readOnly={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, venue: e.target.value }))
                  }
                  placeholder="Enter event venue or location"
                  readOnly={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as Event["type"],
                    }))
                  }
                  disabled={!isAdmin}
                >
                  <option value="event">Event</option>
                  <option value="meeting">Meeting</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recurrence
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  value={formData.recurrenceType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recurrenceType: e.target.value as RecurrenceType,
                    }))
                  }
                  disabled={!isAdmin}
                >
                  <option value="none">No Recurrence</option>
                  <option value="monthly-date">Same Date Monthly</option>
                  <option value="monthly-day">Same Day Monthly</option>
                </select>
                {formData.recurrenceType !== "none" && formData.start && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {getRecurrenceDescription()}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allDay"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.allDay}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allDay: e.target.checked,
                    }))
                  }
                  disabled={!isAdmin}
                />
                <label
                  htmlFor="allDay"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                >
                  All Day Event
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                    value={formData.start}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setWeekNumber(getWeekOfMonth(date));
                      setDayOfWeek(date.getDay());
                      setDayOfMonth(date.getDate());
                      setFormData((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }));
                    }}
                    readOnly={!isAdmin}
                  />
                </div>
                {!formData.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      readOnly={!isAdmin}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                    value={formData.end}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, end: e.target.value }))
                    }
                    readOnly={!isAdmin}
                  />
                </div>
                {!formData.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      readOnly={!isAdmin}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={onClose}>
                  {isAdmin ? "Cancel" : "Close"}
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleDelete}
                      className="!bg-red-100 !text-red-700 hover:!bg-red-200"
                    >
                      Delete
                    </Button>
                    <Button type="submit">Update Event</Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;
