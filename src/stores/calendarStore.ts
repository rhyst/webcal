import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  createCalendarObject,
  deleteCalendarObject,
  fetchCalendarObjects,
  getBasicAuthHeaders,
  updateCalendarObject,
} from "tsdav";
import type { DAVObject } from "tsdav";
import ICAL from "ical.js.2";
import type { Calendar, CalendarEvent } from "../types";
import { proxyUrl, unmangleProxiedUrl } from "../utils";

interface CalendarState {
  // State
  calendars: Calendar[];
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  dateRange: { start: string; end: string } | null;

  // Actions
  setCalendars: (calendars: Calendar[]) => void;
  addCalendar: (calendar: Calendar) => void;
  updateCalendar: (calendar: Calendar) => void;
  removeCalendar: (uid: string) => void;
  importCalendars: (calendars: Calendar[]) => void;

  setEvents: (events: CalendarEvent[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (dateRange: { start: string; end: string } | null) => void;

  // Async actions
  fetchEvents: () => Promise<void>;
  saveEvent: (
    event: CalendarEvent,
    isEdit: boolean,
    originalEvent?: CalendarEvent,
  ) => Promise<void>;
  deleteEvent: (event: CalendarEvent) => Promise<void>;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useCalendarStore = create<CalendarState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    calendars: [],
    events: [],
    loading: false,
    error: null,
    dateRange: null,

    // Calendar actions
    setCalendars: (calendars) => set({ calendars }),

    addCalendar: (calendar) =>
      set((state) => ({
        calendars: [...state.calendars, calendar],
      })),

    updateCalendar: (calendar) =>
      set((state) => ({
        calendars: state.calendars.map((c) =>
          c.uid === calendar.uid ? { ...c, ...calendar } : c,
        ),
      })),

    removeCalendar: (uid) =>
      set((state) => ({
        calendars: state.calendars.filter((cal) => cal.uid !== uid),
      })),

    importCalendars: (calendars) => set({ calendars }),

    // Event actions
    setEvents: (events) => set({ events }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setDateRange: (dateRange) => set({ dateRange }),

    // Async actions
    fetchEvents: async () => {
      const { calendars, dateRange, setEvents, setError, setLoading } = get();

      if (!dateRange) return;

      setLoading(true);
      setError(null);

      try {
        const events: CalendarEvent[] = [];
        const enabledCalendars = calendars.filter(
          (cal) => cal.enabled !== false,
        );
        const caldavCalendars = enabledCalendars.filter(
          (cal) => !cal.type || cal.type === "caldav",
        );

        for (const cal of caldavCalendars) {
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
                    rrule: recur.toString(),
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
        setLoading(false);
      }
    },

    saveEvent: async (
      event: CalendarEvent,
      isEdit: boolean,
      originalEvent?: CalendarEvent,
    ) => {
      const { calendars, setLoading, setError, fetchEvents } = get();

      setLoading(true);
      setError(null);

      try {
        const calendar = calendars.find((c) => c.uid === event.calendarUid);
        if (!calendar) {
          throw new Error("Calendar not found");
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
        if (event.allDay) {
          ICALEvent.startDate.isDate = true;
          ICALEvent.endDate.isDate = true;
        }
        if (event.rrule) {
          veventComp.addPropertyWithValue(
            "rrule",
            ICAL.Recur.fromString(event.rrule.split("RRULE:")[1]),
          );
        }
        vcal.addSubcomponent(veventComp);
        const iCalString = vcal.toString();

        const auth = getBasicAuthHeaders({
          username: calendar.username,
          password: calendar.password,
        });

        if (isEdit && originalEvent) {
          // Update existing event
          if (!originalEvent.raw) {
            throw new Error("Original event data not found");
          }
          await updateCalendarObject({
            calendarObject: {
              data: iCalString,
              url: calendar.useProxy
                ? proxyUrl(originalEvent.raw.url)
                : originalEvent.raw.url,
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

        // Refetch events
        await fetchEvents();
      } catch (e: any) {
        setError(e.message || "Failed to save event");
        throw e;
      } finally {
        setLoading(false);
      }
    },

    deleteEvent: async (event: CalendarEvent) => {
      const { calendars, setLoading, setError, fetchEvents } = get();

      setLoading(true);
      setError(null);

      try {
        const calendar = calendars.find((c) => c.uid === event.calendarUid);
        if (!calendar || !event.raw) {
          throw new Error("Calendar or event data not found");
        }

        const auth = getBasicAuthHeaders({
          username: calendar.username,
          password: calendar.password,
        });

        await deleteCalendarObject({
          calendarObject: {
            ...event.raw,
            url: calendar.useProxy ? proxyUrl(event.raw.url) : event.raw.url,
          },
          headers: auth,
        });

        // Refetch events
        await fetchEvents();
      } catch (e: any) {
        setError(e.message || "Failed to delete event");
        throw e;
      } finally {
        setLoading(false);
      }
    },

    // Persistence
    loadFromStorage: () => {
      const saved = localStorage.getItem("caldav_calendars");
      if (saved) {
        try {
          const calendars = JSON.parse(saved);
          set({ calendars });
        } catch (e) {
          console.error("Failed to load calendars from storage:", e);
        }
      }
    },

    saveToStorage: () => {
      const { calendars } = get();
      localStorage.setItem("caldav_calendars", JSON.stringify(calendars));
    },
  })),
);

// Subscribe to calendar changes and save to localStorage
useCalendarStore.subscribe(
  (state) => state.calendars,
  (calendars) => {
    localStorage.setItem("caldav_calendars", JSON.stringify(calendars));
  },
);
