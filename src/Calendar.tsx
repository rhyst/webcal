import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import {
  createCalendarObject,
  deleteCalendarObject,
  fetchCalendarObjects,
  getBasicAuthHeaders,
  updateCalendarObject,
} from "tsdav";
import type { DAVObject } from "tsdav";
import type {
  DateSelectArg,
  EventClickArg,
  DatesSetArg,
} from "@fullcalendar/core";
import ICAL from "ical.js";
import EventModal from "./EventModal";
import type { Calendar as ICalendar, CalendarEvent } from "./types";


interface CalendarProps {
  calendars: ICalendar[];
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const CALENDAR_COLORS = [
  "#1976d2",
  "#388e3c",
  "#d32f2f",
  "#fbc02d",
  "#7b1fa2",
  "#0288d1",
  "#c2185b",
  "#ffa000",
  "#455a64",
  "#388e3c",
];

interface EventModalState {
  open: boolean;
  isEdit: boolean;
  calendar?: ICalendar;
  event?: CalendarEvent;
  start?: string; // ISO
  end?: string; // ISO
  allDay?: boolean;
}

// Utility function to check if all required EventModalState fields are set
function isValidEvent(modal: EventModalState): modal is Required<EventModalState> {
  if (!modal.start || !modal.end || !modal.event || !modal.calendar || modal.allDay === undefined) return false; return true;
}

// Utility to fetch all events for the given calendars and date range
async function fetchAllEvents({
  calendars,
  dateRange,
  setEvents,
  setError,
  setLoading,
}: {
  calendars: ICalendar[];
  dateRange: { start: string; end: string } | null;
  setEvents: (events: CalendarEvent[]) => void;
  setError: (err: string | null) => void;
  setLoading?: (loading: boolean) => void;
}) {
  if (!dateRange) return;
  if (setLoading) setLoading(true);
  setError(null);
  try {
    const allEvents: CalendarEvent[] = [];
    for (const [i, cal] of calendars.entries()) {
      const color = cal.color || CALENDAR_COLORS[i % CALENDAR_COLORS.length];
      const auth = getBasicAuthHeaders({
        username: cal.username,
        password: cal.password,
      });
      fetch("/").then(r => console.log("fetch works", r));

      const objects: DAVObject[] = await fetchCalendarObjects({
        calendar: { url: cal.url },
        timeRange: { start: dateRange.start, end: dateRange.end },
        headers: auth,
        fetchOptions: {
          window: null
        }

      });
      const fcEvents = objects.flatMap((obj) => {
        let events: CalendarEvent[] = [];
        try {
          const comp = ICAL.Component.fromString(obj.data);
          const vevents = comp.getAllSubcomponents("vevent");
          for (const vevent of vevents) {
            const ICALEvent = new ICAL.Event(vevent);
            events.push({
              id: obj.url + (ICALEvent.uid ? ":" + ICALEvent.uid : ""),
              title: ICALEvent.summary || "No Title",
              start: ICALEvent.startDate.toString(),
              end: ICALEvent.endDate.toString(),
              allDay: ICALEvent.startDate ? ICALEvent.startDate.isDate : false,
              backgroundColor: color,
              borderColor: color,
              extendedProps: { uid: ICALEvent.uid, calendar: cal, davObject: obj },
            });
          }
        } catch (e) { }
        return events;
      });
      allEvents.push(...fcEvents);
    }
    setEvents(allEvents);
  } catch (e: any) {
    console.log(e)
    setError(e.message || "Failed to fetch events");
  } finally {
    if (setLoading) setLoading(false);
  }
}

const Calendar: React.FC<CalendarProps> = ({
  calendars,
  setLoading,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<EventModalState>({
    open: false,
    isEdit: false,
  });
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  useEffect(() => {
    const enabledCalendars = calendars.filter(cal => cal.enabled !== false);
    fetchAllEvents({ calendars: enabledCalendars, dateRange, setEvents, setError, setLoading });
  }, [calendars, dateRange, setLoading]);

  // Handlers for FullCalendar
  const handleDateClick = (arg: DateSelectArg) => {
    setModal({
      open: true,
      isEdit: false,
      start: arg.startStr,
      end: arg.endStr,
      allDay: true,
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const event = events.find(e => e.extendedProps.uid === arg.event.extendedProps.uid);
    if (!event) {
      return
    }
    setModal({
      open: true,
      isEdit: true,
      event,
      start: event.start,
      end: event.end,
      calendar: event.extendedProps.calendar
    });
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setDateRange({ start: arg.startStr, end: arg.endStr });
  };

  const handleModalClose = () => {
    setModal({ open: false, isEdit: false });
  };

  const handleModalDelete = () => {
    if (!isValidEvent(modal)) {
      return;
    }
    const auth = getBasicAuthHeaders({
      username: modal.calendar.username,
      password: modal.calendar.password,
    });
    deleteCalendarObject({
      calendarObject: modal.event.extendedProps.davObject,
      headers: auth,
    });
    setModal({ open: false, isEdit: false });
    // Refetch events
    if (dateRange) {
      fetchAllEvents({ calendars, dateRange, setEvents, setError });
    }
  };

  const handleModalSave = async () => {
    setLoading(true);
    setError(null);
    if (!isValidEvent(modal)) {
      return;
    }
    try {

      // Build VEVENT using ical.js
      const uid =
        modal.isEdit && modal.event.extendedProps.uid
          ? modal.event.extendedProps.uid
          : Math.random().toString(36).slice(2) + Date.now();
      // Create VCALENDAR component
      const vcal = new ICAL.Component(["vcalendar", [], []]);
      vcal.addPropertyWithValue("version", "2.0");
      // Create VEVENT component
      const veventComp = new ICAL.Component("vevent");
      const event = new ICAL.Event(veventComp);
      event.uid = uid;
      event.summary = modal.event?.title || "";
      veventComp.addPropertyWithValue(
        "dtstamp",
        ICAL.Time.fromJSDate(new Date()),
      );
      veventComp.addPropertyWithValue("prodid", "webcal");
      const start = ICAL.Time.fromDateTimeString(modal.start);
      const end = ICAL.Time.fromDateTimeString(modal.end);
      event.startDate = start;
      event.endDate = end;
      if (modal.allDay) {
        start.isDate = true;
        end.isDate = true;
      }
      vcal.addSubcomponent(veventComp);
      const auth = getBasicAuthHeaders({
        username: modal.calendar?.username,
        password: modal.calendar?.password,
      });
      const ical = vcal.toString();
      if (modal.isEdit && modal.event) {
        // Update existing event
        const url = modal.event.id.split(":")[0];
        await updateCalendarObject({
          calendarObject: {
            data: ical,
            url,
          },
          headers: auth,
        });
      } else {
        // Create new event
        await createCalendarObject({
          calendar: modal.calendar,
          filename: event.uid + ".ics",
          iCalString: ical,
          headers: auth,
        });
      }
      setModal({ open: false, isEdit: false });
      // Refetch events
      if (dateRange) {
        await fetchAllEvents({ calendars, dateRange, setEvents, setError });
      }
    } catch (e: any) {
      setError(e.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full m-0 p-0 bg-white z-0 relative">
      {error && <p className="text-red-600 p-4">{error}</p>}
      <div className="h-full">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          events={events}
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
          title={modal.event?.title}
          start={modal.start}
          end={modal.end}
          allDay={modal.allDay}
          calendar={modal.calendar}
          calendars={calendars}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
        />
      )}
    </div>
  );
};

export default Calendar;
