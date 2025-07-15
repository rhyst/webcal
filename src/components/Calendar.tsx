import React, { useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import iCalendarPlugin from "@fullcalendar/icalendar";
import rrulePlugin from "@fullcalendar/rrule";
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
  const calendarRef = useRef<FullCalendar>(null);
  const calendars = useCalendarStore((state) => state.calendars);
  const events = useCalendarStore((state) => state.events);
  const setDateRange = useCalendarStore((state) => state.setDateRange);
  const fetchEvents = useCalendarStore((state) => state.fetchEvents);
  const getEvent = useCalendarStore((state) => state.getEvent);
  const openEventModal = useModalStore((state) => state.openEventModal);

  const handleDateClick = (arg: DateSelectArg) => {
    openEventModal(false, undefined, arg.startStr, arg.endStr, true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const event = getEvent(
      arg.event.extendedProps.calendarUid,
      arg.event.extendedProps.uid,
    );
    if (!event) {
      return;
    }
    openEventModal(true, event, event.startISO, event.endISO, event.allDay);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setDateRange({ start: arg.startStr, end: arg.endStr });
    fetchEvents();
  };

  useEffect(() => {
    if (calendarRef.current) {
      const start = calendarRef.current.getApi().view.activeStart;
      const end = calendarRef.current.getApi().view.activeEnd;
      setDateRange({ start: start.toISOString(), end: end.toISOString() });
      fetchEvents();
    }
  }, [calendars, fetchEvents]);

  return (
    <div className={`w-full h-full m-0 p-0 ${className}`}>
      <div className="h-full w-full">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
            iCalendarPlugin,
            rrulePlugin,
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            list: "Agenda",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
          }}
          eventSources={calendars.map((cal) => {
            if (!cal.enabled) return {};
            if (cal.type === "ics") {
              return {
                url: cal.useProxy ? proxyUrl(cal.url) : cal.url,
                format: "ics",
                color: cal.color,
                id: cal.uid,
                display: "block",
              };
            }
            return {
              events: Object.values(events[cal.uid] || {}),
              eventDataTransform: (event) => {
                return {
                  title: event.title,
                  start: event.startISO,
                  end: event.endISO,
                  allDay: event.allDay,
                  rrule: event.rrule,
                  extendedProps: {
                    uid: event.uid,
                    calendarUid: cal.uid,
                  },
                };
              },
              backgroundColor: cal.color,
              borderColor: cal.color,
            };
          })}
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
