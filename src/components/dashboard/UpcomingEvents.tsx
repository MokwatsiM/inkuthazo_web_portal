import React from "react";
import { Calendar, MapPin, Clock, Users, ChevronRight } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import { Link } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'meeting' | 'reminder' | 'event';
  venue?: string;
  attendees?: number;
  isUserAttending?: boolean;
}

interface UpcomingEventsProps {
  events: Event[];
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  title = "Upcoming Events",
  maxItems = 5,
  showViewAll = true
}) => {
  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'event': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'reminder': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getTypeLabel = (type: Event['type']) => {
    switch (type) {
      case 'meeting': return 'Meeting';
      case 'event': return 'Event';
      case 'reminder': return 'Reminder';
      default: return 'Event';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return formatDate(date, 'MMM dd');
  };

  const sortedEvents = events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxItems);

  if (sortedEvents.length === 0) {
    return (
      <div className="bg-surface dark:bg-surface-dark rounded-xl p-6 border border-line dark:border-line-dark">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
            {title}
          </h2>
        </div>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-text-tertiary dark:text-text-tertiary-dark mx-auto mb-4" />
          <p className="text-text-secondary dark:text-text-secondary-dark">No upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl p-6 border border-line dark:border-line-dark">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
          {title}
        </h2>
        {showViewAll && (
          <Link
            to="/calendar"
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="group flex items-start gap-4 p-4 rounded-lg border border-line dark:border-line-dark
                     hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-sm transition-all"
          >
            {/* Date Column */}
            <div className="text-center min-w-[60px]">
              <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(event.type)}`}>
                {getTypeLabel(event.type)}
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                  {getDateLabel(event.date)}
                </p>
                <p className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                  {formatDate(event.date, 'HH:mm')}
                </p>
              </div>
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-primary dark:text-text-primary-dark group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {event.title}
              </h4>
              {event.description && (
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                {event.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{event.venue}</span>
                  </div>
                )}
                {event.attendees && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{event.attendees} attending</span>
                  </div>
                )}
                {event.isUserAttending && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                    <span>Attending</span>
                  </div>
                )}
              </div>
            </div>

            {/* Time until event */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                <Clock className="h-3 w-3" />
                <span>
                  {Math.ceil((event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;