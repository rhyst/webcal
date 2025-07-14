import type { DAVObject } from "tsdav";

export interface Calendar {
  uid: string;
  url: string;
  username: string;
  password: string;
  name: string;
  color: string;
  enabled: boolean;
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
  raw?: DAVObject;
}
