import React, { useState } from "react";
import { format, parseISO, isValid, parse, formatISO } from "date-fns";
import Button from "./Button";
import Text from "./Text";
import Modal from "react-modal";
import type { Calendar, CalendarEvent } from "./types";
import Input from "./Input";
import Checkbox from "./Checkbox";
import Select from "./Select";

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
      className="bg-white dark:bg-neutral-900 text-[#222] dark:text-gray-100 p-8 rounded-xl min-w-[340px] shadow-xl border border-[#e0e0e0] dark:border-gray-700 flex flex-col gap-3 outline-none"
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
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          <Checkbox
            checked={allDay}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAllDay(e.target.checked)
            }
            className="mr-1.5"
            color="#2b6cb0"
            size={20}
          />
          All day
        </Text>
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Start:
        </Text>
        <Input
          type={allDay ? "date" : "datetime-local"}
          value={formatInputDate(start, allDay)}
          onChange={handleStartChange}
          required
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          End:
        </Text>
        <Input
          type={allDay ? "date" : "datetime-local"}
          value={formatInputDate(end, allDay)}
          onChange={handleEndChange}
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Calendar:
        </Text>
        <Select
          options={calendars.map((cal) => ({
            value: cal.uid,
            label: cal.name,
          }))}
          value={
            calendars.length
              ? { value: calendar.uid, label: calendar.name }
              : null
          }
          onChange={(option) => {
            if (option) {
              setCalendar(calendars.find((c) => c.uid === option.value)!);
            }
          }}
          isDisabled={isEdit}
          className="w-full"
        />
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
