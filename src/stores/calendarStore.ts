import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
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
import { RRule } from "rrule";
import { parseISO } from "date-fns";

// New events structure: organized by calendar UID then event UID
interface EventsByCalendar {
  [calendarUid: string]: {
    [eventUid: string]: CalendarEvent;
  };
}

interface CalendarState {
  // State
  calendars: Calendar[];
  events: EventsByCalendar;
  loading: boolean;
  error: string | null;
  dateRange: { start: string; end: string } | null;

  // Actions
  setCalendars: (calendars: Calendar[]) => void;
  addCalendar: (calendar: Calendar) => void;
  updateCalendar: (calendar: Calendar) => void;
  removeCalendar: (uid: string) => void;
  importCalendars: (calendars: Calendar[]) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (dateRange: { start: string; end: string } | null) => void;

  // Helper getters
  getEvents: () => CalendarEvent[];
  getEventsForCalendar: (calendarUid: string) => CalendarEvent[];
  getEvent: (
    calendarUid: string,
    eventUid: string,
  ) => CalendarEvent | undefined;

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
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      calendars: [],
      events: {},
      loading: false,
      error: null,
      dateRange: null,

      // Calendar actions
      setCalendars: (calendars) =>
        set((state) => {
          state.calendars = calendars;
        }),

      addCalendar: (calendar) =>
        set((state) => {
          state.calendars.push(calendar);
        }),

      updateCalendar: (calendar) =>
        set((state) => {
          const index = state.calendars.findIndex(
            (c) => c.uid === calendar.uid,
          );
          if (index !== -1) {
            state.calendars[index] = { ...state.calendars[index], ...calendar };
          }
        }),

      removeCalendar: (uid) =>
        set((state) => {
          state.calendars = state.calendars.filter((cal) => cal.uid !== uid);
          // Also remove events for this calendar
          delete state.events[uid];
        }),

      importCalendars: (calendars) =>
        set((state) => {
          state.calendars = calendars;
        }),

      // Event actions
      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setDateRange: (dateRange) =>
        set((state) => {
          state.dateRange = dateRange;
        }),

      // Helper getters
      getEvents: () => {
        const { events } = get();
        return Object.values(events).flatMap((calendarEvents) =>
          Object.values(calendarEvents),
        );
      },

      getEventsForCalendar: (calendarUid: string) => {
        const { events } = get();
        return Object.values(events[calendarUid] || {});
      },

      getEvent: (calendarUid: string, eventUid: string) => {
        const { events } = get();
        return events[calendarUid]?.[eventUid];
      },

      // Async actions
      fetchEvents: async () => {
        const { calendars, dateRange } = get();

        if (!dateRange) return;

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const caldavCalendars = calendars.filter(
            (cal) =>
              (!cal.type || cal.type === "caldav") && cal.enabled !== false,
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
                const vcalendar = new ICAL.Component(ICAL.parse(obj.data));
                const vevent = vcalendar.getFirstSubcomponent("vevent");
                if (!vevent) {
                  return;
                }
                const dtstart = vevent.getFirstPropertyValue("dtstart");
                const recur = vevent.getFirstPropertyValue("rrule") as
                  | ICAL.Recur
                  | undefined;
                let rrule: string | undefined;
                if (recur) {
                  const rruleObj = RRule.fromString(recur.toString()).options;
                  rruleObj.dtstart = parseISO(dtstart?.toString() || "");
                  rrule = new RRule(rruleObj).toString();
                }
                const icalEvent = new ICAL.Event(vevent);
                set((state) => {
                  if (!state.events[cal.uid]) {
                    state.events[cal.uid] = {};
                  }
                  state.events[cal.uid][icalEvent.uid] = {
                    uid: icalEvent.uid,
                    title: icalEvent.summary || "No Title",
                    startISO: icalEvent.startDate.toString(),
                    endISO: icalEvent.endDate.toString(),
                    allDay: icalEvent.startDate
                      ? icalEvent.startDate.isDate
                      : false,
                    calendarUid: cal.uid,
                    rrule,
                    raw: {
                      ...obj,
                      url: cal.useProxy
                        ? unmangleProxiedUrl(cal.url, obj.url)
                        : obj.url,
                    },
                  };
                });
              } catch (e) {
                console.error(e);
              }
            });
          }
        } catch (e: any) {
          console.log(e);
          set((state) => {
            state.error = e.message || "Failed to fetch events";
          });
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      saveEvent: async (
        event: CalendarEvent,
        isEdit: boolean,
        originalEvent?: CalendarEvent,
      ) => {
        const { calendars, fetchEvents } = get();

        set((state) => {
          state.loading = true;
          state.error = null;
        });

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
              ICAL.Recur.fromString(event.rrule),
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
          set((state) => {
            state.error = e.message || "Failed to save event";
          });
          throw e;
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      deleteEvent: async (event: CalendarEvent) => {
        const { calendars, fetchEvents } = get();

        set((state) => {
          state.loading = true;
          state.error = null;
        });

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
          set((state) => {
            state.error = e.message || "Failed to delete event";
          });
          throw e;
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      // Persistence
      loadFromStorage: () => {
        const saved = localStorage.getItem("caldav_calendars");
        if (saved) {
          try {
            const calendars = JSON.parse(saved);
            set((state) => {
              state.calendars = calendars;
            });
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
  ),
);

// Subscribe to calendar changes and save to localStorage
useCalendarStore.subscribe(
  (state) => state.calendars,
  (calendars) => {
    localStorage.setItem("caldav_calendars", JSON.stringify(calendars));
  },
);
