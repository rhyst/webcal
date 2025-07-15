import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import CalendarModal from "./CalendarModal.tsx";
import Calendar from "./Calendar.tsx";
import type { Calendar as ICalendar } from "./types.ts";
import { useCalendarStore } from "./stores/calendarStore";

interface CalendarModalState {
  open: boolean;
  isEdit: boolean;
  calendar?: ICalendar;
}

function App() {
  const [modal, setModal] = useState<CalendarModalState>({
    open: false,
    isEdit: false,
  });
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
  const {
    calendars,
    loading,
    loadFromStorage,
    removeCalendar,
    importCalendars,
  } = useCalendarStore();

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

  const handleRemove = (uid: string) => {
    removeCalendar(uid);
  };

  const handleEditCalendar = (uid: string) => {
    const calendar = calendars.find((c) => c.uid === uid);
    if (!calendar) {
      return;
    }
    setModal({ open: true, isEdit: true, calendar }); // ensure a new object is set
  };

  const handleSaveCalendar = (calendar: ICalendar) => {
    const { addCalendar, updateCalendar } = useCalendarStore.getState();
    const existingCalendar = calendars.find((c) => c.uid === calendar.uid);

    if (existingCalendar) {
      updateCalendar(calendar);
    } else {
      addCalendar(calendar);
    }
    setModal({ open: false, isEdit: false });
  };

  const handleClose = () => {
    setModal({ open: false, isEdit: false });
  };

  return (
    <main className="h-screen w-screen flex bg-white dark:bg-neutral-900">
      <Sidebar
        isDark={darkMode}
        width={sidebarWidth}
        onClickAdd={() => setModal({ open: true, isEdit: false })}
        onClickCalendar={handleEditCalendar}
        onClickDarkMode={(dark) => setDarkMode(dark)}
        onWidthChange={setSidebarWidth}
      />
      <Calendar className="flex flex-1 h-screen" />
      {modal.open && (
        <CalendarModal
          open={modal.open}
          isEdit={modal.isEdit}
          calendar={modal.calendar}
          onClose={handleClose}
        />
      )}
    </main>
  );
}

export default App;
