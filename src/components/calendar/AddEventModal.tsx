import React, { useState, useEffect } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import { getWeekOfMonth } from "date-fns";
import type { EventInput, RecurrenceType } from "../../types/event";
import logger from "../../utils/logger";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onEventAdded,
}) => {
  const { userDetails } = useAuth();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    venue: string;
    start: string;
    startTime: string;
    end: string;
    endTime: string;
    allDay: boolean;
    type: EventInput["type"];
    recurrenceType: RecurrenceType;
  }>({
    title: "",
    description: "",
    venue: "",
    start: "",
    startTime: "09:00",
    end: "",
    endTime: "17:00",
    allDay: false,
    type: "event",
    recurrenceType: "none",
  });

  // Calculate week number and day of week when start date changes
  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [dayOfMonth, setDayOfMonth] = useState<number>(0);

  useEffect(() => {
    if (formData.start) {
      const startDate = new Date(formData.start);
      setWeekNumber(getWeekOfMonth(startDate));
      setDayOfWeek(startDate.getDay());
      setDayOfMonth(startDate.getDate());
    }
  }, [formData.start]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!userDetails?.id) throw new Error("User not authenticated");

      const startDate = new Date(`${formData.start}T${formData.startTime}`);
      const endDate = new Date(`${formData.end}T${formData.endTime}`);

      const eventData: Partial<EventInput> = {
        title: formData.title,
        description: formData.description,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        allDay: formData.allDay,
        type: formData.type,
        created_by: userDetails.id,
      };

      // Only add venue if it's not empty
      if (formData.venue.trim()) {
        eventData.venue = formData.venue.trim();
      }

      // Add recurrence data if selected
      if (formData.recurrenceType !== "none") {
        eventData.recurrence = {
          type: formData.recurrenceType,
          ...(formData.recurrenceType === "monthly-date" && { dayOfMonth }),
          ...(formData.recurrenceType === "monthly-day" && {
            weekNumber,
            dayOfWeek,
          }),
        };
      }

      await addDoc(collection(db, "events"), {
        ...eventData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      onEventAdded();
      onClose();

      // Reset form data
      setFormData({
        title: "",
        description: "",
        venue: "",
        start: "",
        startTime: "09:00",
        end: "",
        endTime: "17:00",
        allDay: false,
        type: "event",
        recurrenceType: "none",
      });
    } catch (error) {
      logger.error("Error adding event:", error);
    }
  };

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
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 z-50">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Add New Event</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, venue: e.target.value }))
                  }
                  placeholder="Enter event venue or location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as EventInput["type"],
                    }))
                  }
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
                  className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  value={formData.recurrenceType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recurrenceType: e.target.value as RecurrenceType,
                    }))
                  }
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
                    className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                    value={formData.start}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
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
                      className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
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
                    className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                    value={formData.end}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, end: e.target.value }))
                    }
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
                      className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Add Event</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
