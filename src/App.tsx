import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import CalendarModal from "./CalendarModal.tsx";
import Calendar from "./Calendar.tsx";
import type { Calendar as ICalendar } from "./types.ts";

interface CalendarModalState {
  open: boolean;
  isEdit: boolean;
  calendar?: ICalendar;
}

function App() {
  const [calendars, setCalendars] = useState<ICalendar[]>([]);
  const [modal, setModal] = useState<CalendarModalState>({
    open: false,
    isEdit: false,
  });
  const [loading, setLoading] = useState(false); // <-- add loading state here

  // Load calendars from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("caldav_calendars");
    if (saved) setCalendars(JSON.parse(saved));
  }, []);

  // Save calendars to localStorage when changed
  useEffect(() => {
    localStorage.setItem("caldav_calendars", JSON.stringify(calendars));
  }, [calendars]);

  const handleRemove = (uid: string) => {
    setCalendars(calendars.filter((cal) => cal.uid !== uid));
  };

  const handleEditCalendar = (uid: string) => {
    const calendar = calendars.find((c) => c.uid === uid);
    if (!calendar) {
      return;
    }
    setModal({ open: true, isEdit: true, calendar }); // ensure a new object is set
  };

  const handleSaveCalendar = (calendar: ICalendar) => {
    setCalendars((cals) =>
      cals.find((c) => c.uid === calendar.uid)
        ? cals.map((c) => (c.uid === calendar.uid ? { ...c, ...calendar } : c))
        : [...cals, calendar],
    );
    setModal({ open: false, isEdit: false });
  };

  const handleClose = () => {
    setModal({ open: false, isEdit: false });
  };

  return (
    <main className="h-screen w-screen flex">
      <Sidebar
        calendars={calendars}
        loading={loading}
        onClickRemove={handleRemove}
        onClickAdd={() => setModal({ open: true, isEdit: false })}
        onClickCalendar={handleEditCalendar}
        onClickImport={(imported) => setCalendars(imported)}
      />
      <Calendar
        className="flex flex-1 h-screen"
        calendars={calendars}
        loading={loading}
        setLoading={setLoading}
      />
      {modal.open && (
        <CalendarModal
          open={modal.open}
          isEdit={modal.isEdit}
          calendar={modal.calendar}
          onSave={handleSaveCalendar}
          onClose={handleClose}
        />
      )}
    </main>
  );
}

export default App;
