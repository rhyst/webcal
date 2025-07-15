import { create } from "zustand";
import type { Calendar, CalendarEvent } from "../types";

interface CalendarModalState {
  open: boolean;
  isEdit: boolean;
  calendar?: Calendar;
}

interface EventModalState {
  open: boolean;
  isEdit: boolean;
  startISO?: string;
  endISO?: string;
  allDay?: boolean;
  event?: CalendarEvent;
}

interface ModalState {
  // Calendar modal state
  calendarModal: CalendarModalState;

  // Event modal state
  eventModal: EventModalState;

  // Calendar modal actions
  openCalendarModal: (isEdit: boolean, calendar?: Calendar) => void;
  closeCalendarModal: () => void;

  // Event modal actions
  openEventModal: (
    isEdit: boolean,
    event?: CalendarEvent,
    startISO?: string,
    endISO?: string,
    allDay?: boolean,
  ) => void;
  closeEventModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // Initial state
  calendarModal: {
    open: false,
    isEdit: false,
  },

  eventModal: {
    open: false,
    isEdit: false,
  },

  // Calendar modal actions
  openCalendarModal: (isEdit, calendar) =>
    set({
      calendarModal: {
        open: true,
        isEdit,
        calendar,
      },
    }),

  closeCalendarModal: () =>
    set({
      calendarModal: {
        open: false,
        isEdit: false,
      },
    }),

  // Event modal actions
  openEventModal: (isEdit, event, startISO, endISO, allDay) =>
    set({
      eventModal: {
        open: true,
        isEdit,
        event,
        startISO,
        endISO,
        allDay,
      },
    }),

  closeEventModal: () =>
    set({
      eventModal: {
        open: false,
        isEdit: false,
      },
    }),
}));
