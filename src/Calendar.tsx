import React, { useEffect, useState } from "react";
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
import EventModal from "./EventModal";
import type { CalendarEvent } from "./types";
import { useCalendarStore } from "./stores/calendarStore";
import { proxyUrl } from "./utils";

interface CalendarProps {
  className?: string;
}

interface EventModalState {
  open: boolean;
  isEdit: boolean;
  startISO?: string;
  endISO?: string;
  allDay?: boolean;
  event?: CalendarEvent;
}

const Calendar: React.FC<CalendarProps> = ({ className }) => {
  const [modal, setModal] = useState<EventModalState>({
    open: false,
    isEdit: false,
  });

  // Get store state and actions
  const {
    calendars,
    events,
    error,
    dateRange,
    setDateRange,
    fetchEvents,
    saveEvent,
    deleteEvent,
  } = useCalendarStore();

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
    setModal({
      open: true,
      isEdit: false,
      startISO: arg.startStr,
      endISO: arg.endStr,
      allDay: true,
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const event = events.find((e) => e.uid === arg.event.extendedProps.uid);
    if (!event) {
      return;
    }
    setModal({
      open: true,
      isEdit: true,
      event,
      startISO: event.startISO,
      endISO: event.endISO,
      allDay: event.allDay,
    });
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setDateRange({ start: arg.startStr, end: arg.endStr });
  };

  const handleModalClose = () => {
    setModal({ open: false, isEdit: false });
  };

  const handleEventSave = async (event: CalendarEvent) => {
    try {
      await saveEvent(event, modal.isEdit, modal.event);
      setModal({ open: false, isEdit: false });
    } catch (e) {
      // Error is handled in the store
      console.error("Failed to save event:", e);
    }
  };

  const handleEventDelete = async (event: CalendarEvent) => {
    try {
      await deleteEvent(event);
      setModal({ open: false, isEdit: false });
    } catch (e) {
      // Error is handled in the store
      console.error("Failed to delete event:", e);
    }
  };

  return (
    <div className={`w-full h-full m-0 p-0 ${className}`}>
      {error && <p className="fixed text-red-600 p-4">{error}</p>}
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
      {modal.open && (
        <EventModal
          open={modal.open}
          isEdit={modal.isEdit}
          start={modal.startISO}
          end={modal.endISO}
          allDay={modal.allDay}
          calendars={calendars}
          event={modal.event}
          onClose={handleModalClose}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
        />
      )}
    </div>
  );
};

export default Calendar;
