import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import iCalendarPlugin from "@fullcalendar/icalendar";
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
import ICAL from "ical.js.2";
import EventModal from "./EventModal";
import type { Calendar as ICalendar, CalendarEvent } from "./types";
import { proxyUrl, unmangleProxiedUrl } from "./utils";

interface CalendarProps {
  className?: string;
  calendars: ICalendar[];
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

interface EventModalState {
  open: boolean;
  isEdit: boolean;
  startISO?: string;
  endISO?: string;
  allDay?: boolean;
  event?: CalendarEvent;
}

async function fetchEvents({
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
    const events: CalendarEvent[] = [];
    for (const cal of calendars) {
      const url = cal.useProxy ? proxyUrl(cal.url) : cal.url;
      const auth = getBasicAuthHeaders({
        username: cal.username,
        password: cal.password,
      });
      const objects: DAVObject[] = await fetchCalendarObjects({
        calendar: { url },
        timeRange: { start: dateRange.start, end: dateRange.end },
        headers: auth,
      });
      objects.forEach((obj) => {
        try {
          let vcalendar = new ICAL.Component(ICAL.parse(obj.data));
          let vevent = vcalendar.getFirstSubcomponent("vevent");
          if (!vevent) {
            return;
          }
          // Let's start with RRULEs
          let recur = vevent.getFirstPropertyValue("rrule") as
            | ICAL.Recur
            | undefined;
          if (!recur) {
            const icalEvent = new ICAL.Event(vevent);
            events.push({
              uid: icalEvent.uid,
              title: icalEvent.summary || "No Title",
              startISO: icalEvent.startDate.toString(),
              endISO: icalEvent.endDate.toString(),
              allDay: icalEvent.startDate ? icalEvent.startDate.isDate : false,
              calendarUid: cal.uid,
              raw: {
                ...obj,
                url: cal.useProxy
                  ? unmangleProxiedUrl(cal.url, obj.url)
                  : obj.url,
              },
            });
            return;
          }
          const rangeStart = ICAL.Time.fromDateTimeString(dateRange.start);
          const rangeEnd = ICAL.Time.fromDateTimeString(dateRange.end);
          let dtstart = vevent.getFirstPropertyValue("dtstart");
          if (!dtstart) {
            return;
          }
          let iterator = recur.iterator(dtstart as ICAL.Time);
          // Iterate through the start dates in the range.
          for (
            let next = iterator.next();
            next && next.compare(rangeEnd) < 0;
            next = iterator.next()
          ) {
            const icalEvent = new ICAL.Event(vevent);
            const occurence = icalEvent.getOccurrenceDetails(next);
            if (occurence.endDate.compare(rangeStart) >= 0) {
              events.push({
                uid: icalEvent.uid,
                title: icalEvent.summary || "No Title",
                startISO: occurence.startDate.toString(),
                endISO: occurence.endDate.toString(),
                allDay: icalEvent.startDate
                  ? icalEvent.startDate.isDate
                  : false,
                calendarUid: cal.uid,
                raw: {
                  ...obj,
                  url: cal.useProxy
                    ? unmangleProxiedUrl(cal.url, obj.url)
                    : obj.url,
                },
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
    setEvents(events);
  } catch (e: any) {
    console.log(e);
    setError(e.message || "Failed to fetch events");
  } finally {
    if (setLoading) setLoading(false);
  }
}

const Calendar: React.FC<CalendarProps> = ({
  className,
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
    const enabledCalendars = calendars.filter((cal) => cal.enabled !== false);
    // Only fetch events for CalDAV calendars
    const caldavCalendars = enabledCalendars.filter(
      (cal) => !cal.type || cal.type === "caldav",
    );
    fetchEvents({
      calendars: caldavCalendars,
      dateRange,
      setEvents,
      setError,
      setLoading,
    });
  }, [calendars, dateRange, setLoading]);

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
    setLoading(true);
    setError(null);
    try {
      const calendar = calendars.find((c) => c.uid === event.calendarUid);
      if (!calendar) {
        return;
      }
      // Build VEVENT using ical.js
      const uid = event.uid;
      // Create VCALENDAR component
      const vcal = new ICAL.Component(["vcalendar", [], []]);
      vcal.addPropertyWithValue("version", "2.0");
      // Create VEVENT component
      const veventComp = new ICAL.Component("vevent");
      veventComp.addPropertyWithValue(
        "dtstamp",
        ICAL.Time.fromJSDate(new Date()),
      );
      veventComp.addPropertyWithValue("prodid", "webcal");
      // Create ICALEvent
      const ICALEvent = new ICAL.Event(veventComp);
      ICALEvent.uid = uid;
      ICALEvent.summary = event?.title || "";
      ICALEvent.startDate = ICAL.Time.fromDateTimeString(event.startISO);
      ICALEvent.endDate = ICAL.Time.fromDateTimeString(event.endISO);
      if (modal.allDay) {
        ICALEvent.startDate.isDate = true;
        ICALEvent.endDate.isDate = true;
      }
      vcal.addSubcomponent(veventComp);
      const iCalString = vcal.toString();
      const auth = getBasicAuthHeaders({
        username: calendar.username,
        password: calendar.password,
      });
      if (modal.isEdit && modal.event) {
        // Update existing event
        if (!event.raw) {
          return;
        }
        await updateCalendarObject({
          calendarObject: {
            data: iCalString,
            url: calendar.useProxy ? proxyUrl(event.raw.url) : event.raw.url,
          },
          headers: auth,
        });
      } else {
        // Create new event
        await createCalendarObject({
          calendar: {
            ...calendar,
            url: calendar.useProxy ? proxyUrl(calendar.url) : calendar.url,
          },
          filename: event.uid + ".ics",
          iCalString: iCalString,
          headers: auth,
        });
      }
      setModal({ open: false, isEdit: false });
      // Refetch events
      if (dateRange) {
        await fetchEvents({ calendars, dateRange, setEvents, setError });
      }
    } catch (e: any) {
      setError(e.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleEventDelete = (event: CalendarEvent) => {
    setLoading(true);
    setError(null);
    try {
      const calendar = calendars.find((c) => c.uid === event.calendarUid);
      if (!calendar || !event.raw) {
        return;
      }
      const auth = getBasicAuthHeaders({
        username: calendar.username,
        password: calendar.password,
      });
      deleteCalendarObject({
        calendarObject: {
          ...event.raw,
          url: calendar.useProxy ? proxyUrl(event.raw.url) : event.raw.url,
        },
        headers: auth,
      });
      setModal({ open: false, isEdit: false });
      // Refetch events
      if (dateRange) {
        fetchEvents({ calendars, dateRange, setEvents, setError });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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
