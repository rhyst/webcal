import React, { useState } from "react";
import { format, parseISO, isValid, parse, formatISO } from "date-fns";
import Button from "./Button";
import Text from "./Text";
import Modal from "react-modal";
import type { Calendar } from "./types";


interface EventModalProps {
  open: boolean;
  isEdit: boolean;
  title?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  calendar?: Calendar;
  calendars: Calendar[];
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
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
  calendar,
  calendars,
  onClose,
  onSave,
  onDelete,
  ...details
}) => {
  const [title, setTitle] = useState(details.title || "");
  const [allDay, setAllDay] = useState(details.allDay || false);
  const [start, setStart] = useState(details.start || formatISO(new Date()));
  const [end, setEnd] = useState(details.end || formatISO(new Date()));
  const [calendarIdx, setCalendarIdx] = useState(calendars.findIndex(cal => cal.url === calendar?.url));

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStart(formatOutputDate(event.target.value, allDay));
  };

  const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnd(formatOutputDate(event.target.value, allDay));
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
          value={calendarIdx}
          onChange={(e) => setCalendarIdx(Number(e.target.value))}
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        >
          {calendars.map((cal, i) => (
            <option key={i} value={i}>
              {cal.displayName || `Calendar ${i + 1}`}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex gap-2 justify-end">
        {isEdit ? (
          <Button type="button" onClick={onDelete} variant="danger">
            Delete
          </Button>
        ) : null}
        <Button type="submit" variant="primary" onClick={onSave}>
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
