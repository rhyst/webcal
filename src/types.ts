import type { DAVObject } from "tsdav";

export interface Calendar {
  url: string;
  username: string;
  password: string;
  displayName?: string;
  color?: string;
  enabled?: boolean;
}

// Define a type for calendar events
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    uid: string;
    calendar: Calendar;
    davObject: DAVObject;
  };
}
