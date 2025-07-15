import type { DAVObject } from "tsdav";

export interface Calendar {
  uid: string;
  url: string;
  username: string;
  password: string;
  name: string;
  color: string;
  enabled: boolean;
  type?: "caldav" | "ics"; // Add calendar type
  useProxy?: boolean; // Add proxy flag
  raw?: DAVObject;
}

// Define a type for calendar events
export interface CalendarEvent {
  uid: string;
  calendarUid: string;
  title: string;
  startISO: string;
  endISO: string;
  allDay: boolean;
  rrule?: string;
  raw?: DAVObject;
}
