import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import CalendarModal from "./CalendarModal.tsx";
import Calendar from "./Calendar.tsx";
import type { Calendar as ICalendar } from "./types.ts";


function App() {
  const [calendars, setCalendars] = useState<ICalendar[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDetails, setEditDetails] = useState<Partial<ICalendar>>({});
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

  const handleAddCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newUsername || !newPassword) return;
    let displayName = "";
    let color = "";

    setCalendars([
      ...calendars,
      {
        url: newUrl,
        username: newUsername,
        password: newPassword,
        displayName: displayName || newUrl,
        color: color || undefined,
      },
    ]);
    setNewUrl("");
    setNewUsername("");
    setNewPassword("");
    setShowAdd(false);
  };

  const handleRemove = (idx: number) => {
    setCalendars(calendars.filter((_, i) => i !== idx));
  };

  const handleEditCalendar = (idx: number) => {
    setEditingIdx(idx);
    setEditDetails({ ...calendars[idx] }); // ensure a new object is set
  };
  const handleEditCalendarChange = (
    field: keyof ICalendar,
    value: string | boolean,
  ) => {
    setEditDetails((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditCalendarSave = () => {
    if (editingIdx === null) return;
    setCalendars((cals) =>
      cals.map((c, i) => (i === editingIdx ? { ...c, ...editDetails } : c)),
    );
    setEditingIdx(null);
  };
  const handleEditCalendarCancel = () => {
    setEditingIdx(null);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "relative",
      }}
    >
      <Sidebar
        calendars={calendars}
        onRemove={handleRemove}
        showAdd={showAdd}
        setShowAdd={setShowAdd}
        newUrl={newUrl}
        setNewUrl={setNewUrl}
        newUsername={newUsername}
        setNewUsername={setNewUsername}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        handleAddCalendar={handleAddCalendar}
        onEditCalendar={handleEditCalendar}
        loading={loading} // <-- pass loading to Sidebar
        onImportCalendars={(imported) => setCalendars(imported)}
      />
      {editingIdx !== null && (
        <CalendarModal
          key={editingIdx}
          calendar={editDetails as ICalendar}
          onChange={handleEditCalendarChange}
          onSave={handleEditCalendarSave}
          onCancel={handleEditCalendarCancel}
        />
      )}
      <main style={{ flex: 1, height: "100vh", position: "relative" }}>
        <Calendar
          calendars={calendars}
          loading={loading}
          setLoading={setLoading}
        />{" "}
        {/* pass loading and setLoading */}
      </main>
    </div>
  );
}

export default App;
