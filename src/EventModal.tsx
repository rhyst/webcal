import React, { useState } from "react";
import { format, parseISO, isValid, parse, formatISO } from "date-fns";
import Button from "./Button";
import Text from "./Text";
import Modal from "react-modal";
import type { Calendar, CalendarEvent } from "./types";

interface EventModalProps {
  open: boolean;
  isEdit: boolean;
  start?: string;
  end?: string;
  allDay?: boolean;
  event?: CalendarEvent;
  calendars: Calendar[];
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

function formatInputDate(value: string, allDay: boolean): string {
  if (!value) return "";
  try {
    const date = parseISO(value);
    if (!isValid(date)) return "";
    return allDay
      ? format(date, "yyyy-MM-dd")
      : format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

function formatOutputDate(value: string, allDay: boolean): string {
  if (!value) return "";
  try {
    const date = parse(
      value,
      allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm",
      new Date(),
    );
    if (!isValid(date)) return "";
    return formatISO(date);
  } catch {
    return "";
  }
}

const EventModal: React.FC<EventModalProps> = ({
  open,
  isEdit,
  event,
  calendars,
  onClose,
  onSave,
  onDelete,
  ...details
}) => {
  const [title, setTitle] = useState(event?.title || "");
  const [allDay, setAllDay] = useState(details.allDay || false);
  const [start, setStart] = useState(
    details.start ? formatISO(parseISO(details.start)) : formatISO(new Date()),
  );
  const [end, setEnd] = useState(
    details.end ? formatISO(parseISO(details.end)) : formatISO(new Date()),
  );
  const [calendar, setCalendar] = useState(
    calendars.find((c) => c.uid === event?.calendarUid) || calendars[0],
  );

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStart(formatOutputDate(event.target.value, allDay));
  };

  const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnd(formatOutputDate(event.target.value, allDay));
  };

  const handleSave = () => {
    const data: CalendarEvent = {
      ...event,
      uid: event?.uid || Math.random().toString(36).slice(2) + Date.now(),
      title,
      startISO: start,
      endISO: end,
      allDay,
      calendarUid: calendar.uid,
    };
    onSave(data);
  };

  return (
    <Modal
      isOpen={open}
      onRequestClose={onClose}
      overlayClassName="fixed inset-0 bg-black/35 z-50 flex items-center justify-center"
      className="bg-white text-[#222] p-8 rounded-xl min-w-[340px] shadow-xl border border-[#e0e0e0] flex flex-col gap-3 outline-none"
      ariaHideApp={false}
    >
      <Text
        as="h3"
        size="lg"
        weight="semibold"
        color="blue"
        className="m-0 mb-2"
      >
        {isEdit ? "Edit Event" : "Create Event"}
      </Text>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Title:
        </Text>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="mr-1.5"
          />
          All day
        </Text>
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Start:
        </Text>
        <input
          type={allDay ? "date" : "datetime-local"}
          value={formatInputDate(start, allDay)}
          onChange={handleStartChange}
          required
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          End:
        </Text>
        <input
          type={allDay ? "date" : "datetime-local"}
          value={formatInputDate(end, allDay)}
          onChange={handleEndChange}
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Calendar:
        </Text>
        <select
          disabled={isEdit}
          value={calendar.uid}
          onChange={(e) =>
            setCalendar(calendars.find((c) => c.uid === e.target.value)!)
          }
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        >
          {calendars.map((cal) => (
            <option key={cal.uid} value={cal.uid}>
              {cal.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex gap-2 justify-end">
        {isEdit && event ? (
          <Button
            type="button"
            onClick={() => onDelete(event)}
            variant="danger"
          >
            Delete
          </Button>
        ) : null}
        <Button type="submit" variant="primary" onClick={handleSave}>
          Save
        </Button>
        <Button type="button" onClick={onClose} variant="secondary">
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default EventModal;
