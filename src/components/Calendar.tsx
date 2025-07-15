import React, { useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import iCalendarPlugin from "@fullcalendar/icalendar";
import type {
  DateSelectArg,
  EventClickArg,
  DatesSetArg,
} from "@fullcalendar/core";
import { useCalendarStore } from "../stores/calendarStore";
import { useModalStore } from "../stores/modalStore";
import { proxyUrl } from "../utils";

interface CalendarProps {
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ className }) => {
  // Get store state and actions
  const { calendars, events, dateRange, setDateRange, fetchEvents } =
    useCalendarStore();

  // Get modal store
  const { openEventModal } = useModalStore();

  useEffect(() => {
    const enabledCalendars = calendars.filter((cal) => cal.enabled !== false);
    // Only fetch events for CalDAV calendars
    const caldavCalendars = enabledCalendars.filter(
      (cal) => !cal.type || cal.type === "caldav",
    );

    if (caldavCalendars.length > 0 && dateRange) {
      fetchEvents();
    }
  }, [calendars, dateRange, fetchEvents]);

  // Handlers for FullCalendar
  const handleDateClick = (arg: DateSelectArg) => {
    openEventModal(false, undefined, arg.startStr, arg.endStr, true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const event = events.find((e) => e.uid === arg.event.extendedProps.uid);
    if (!event) {
      return;
    }
    openEventModal(true, event, event.startISO, event.endISO, event.allDay);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setDateRange({ start: arg.startStr, end: arg.endStr });
  };

  return (
    <div className={`w-full h-full m-0 p-0 ${className}`}>
      <div className="h-full w-full">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
            iCalendarPlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          eventSources={[
            // ICS Events
            ...calendars
              .filter((cal) => cal.enabled !== false && cal.type === "ics")
              .map((cal) => ({
                url: cal.useProxy ? proxyUrl(cal.url) : cal.url,
                format: "ics",
                color: cal.color,
                id: cal.uid,
                display: "block",
                // Optionally, you can add extra params here
              })),
            // Caldav events
            {
              events: events.map((event) => {
                const calendar = calendars.find(
                  (c) => c.uid === event.calendarUid,
                );
                return {
                  title: event.title,
                  start: event.startISO,
                  end: event.endISO,
                  backgroundColor: calendar?.color,
                  borderColor: calendar?.color,
                  extendedProps: {
                    uid: event.uid,
                  },
                };
              }),
            },
          ]}
          editable={true}
          selectable={true}
          height="100%"
          select={handleDateClick}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
        />
      </div>
    </div>
  );
};

export default Calendar;
