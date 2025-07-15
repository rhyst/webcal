import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CalendarModal from "./components/CalendarModal";
import EventModal from "./components/EventModal";
import Calendar from "./components/Calendar";
import { useCalendarStore } from "./stores/calendarStore";
import { useModalStore } from "./stores/modalStore";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const stored = localStorage.getItem("dark_mode");
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("sidebar_width");
    return stored ? parseInt(stored, 10) : 320;
  });

  // Get store actions and state
  const calendars = useCalendarStore((state) => state.calendars);
  const loadFromStorage = useCalendarStore((state) => state.loadFromStorage);
  const saveEvent = useCalendarStore((state) => state.saveEvent);
  const deleteEvent = useCalendarStore((state) => state.deleteEvent);

  // Get modal store
  const calendarModal = useModalStore((state) => state.calendarModal);
  const eventModal = useModalStore((state) => state.eventModal);
  const openCalendarModal = useModalStore((state) => state.openCalendarModal);
  const closeCalendarModal = useModalStore((state) => state.closeCalendarModal);
  const closeEventModal = useModalStore((state) => state.closeEventModal);

  // Persist Darkmode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("dark_mode", String(darkMode));
  }, [darkMode]);

  // Persist sidebarwidth
  useEffect(() => {
    localStorage.setItem("sidebar_width", String(sidebarWidth));
  }, [sidebarWidth]);

  // Load calendars from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleEditCalendar = (uid: string) => {
    const calendar = calendars.find((c) => c.uid === uid);
    if (!calendar) {
      return;
    }
    openCalendarModal(true, calendar);
  };

  const handleEventSave = async (event: any) => {
    try {
      await saveEvent(event, eventModal.isEdit, eventModal.event);
      closeEventModal();
    } catch (e) {
      // Error is handled in the store
      console.error("Failed to save event:", e);
    }
  };

  const handleEventDelete = async (event: any) => {
    try {
      await deleteEvent(event);
      closeEventModal();
    } catch (e) {
      // Error is handled in the store
      console.error("Failed to delete event:", e);
    }
  };

  return (
    <main className="h-screen w-screen flex bg-white dark:bg-neutral-900">
      <Sidebar
        isDark={darkMode}
        width={sidebarWidth}
        onClickAdd={() => openCalendarModal(false)}
        onClickCalendar={handleEditCalendar}
        onClickDarkMode={(dark) => setDarkMode(dark)}
        onWidthChange={setSidebarWidth}
      />
      <Calendar className="flex flex-1 h-screen" />

      {/* Calendar Modal */}
      {calendarModal.open && (
        <CalendarModal
          open={calendarModal.open}
          isEdit={calendarModal.isEdit}
          calendar={calendarModal.calendar}
          onClose={closeCalendarModal}
        />
      )}

      {/* Event Modal */}
      {eventModal.open && (
        <EventModal
          open={eventModal.open}
          isEdit={eventModal.isEdit}
          start={eventModal.startISO}
          end={eventModal.endISO}
          allDay={eventModal.allDay}
          calendars={calendars}
          event={eventModal.event}
          onClose={closeEventModal}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
        />
      )}
    </main>
  );
}

export default App;
