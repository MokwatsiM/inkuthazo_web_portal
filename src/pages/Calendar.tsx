import React from "react";
import Calendar from "../components/calendar/calendar";

const CalendarPage: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Calendar</h2>
      </div>
      <Calendar />
    </div>
  );
};

export default CalendarPage;
