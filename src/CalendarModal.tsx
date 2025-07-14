import React from "react";
import Button from "./Button";
import Text from "./Text";
import Modal from "react-modal";

const GOOGLE_COLORS = [
  "#4285F4", // Blue
  "#34A853", // Green
  "#EA4335", // Red
  "#FBBC05", // Yellow
  "#A142F4", // Purple
  "#24C1E0", // Teal
  "#F29900", // Orange
  "#D50000", // Pink
  "#616161", // Gray
  "#00B8D9", // Cyan
  "#3F51B5", // Indigo
  "#7CB342", // Light Green
];

interface CalDAVCalendar {
  url: string;
  username: string;
  password: string;
  displayName?: string;
  color?: string;
  enabled?: boolean;
}

interface EditCalendarModalProps {
  calendar: CalDAVCalendar;
  onChange: (field: keyof CalDAVCalendar, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditCalendarModal: React.FC<EditCalendarModalProps> = ({
  calendar,
  onChange,
  onSave,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={true}
      onRequestClose={onCancel}
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
        Edit Calendar
      </Text>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Display Name:
        </Text>
        <input
          type="text"
          value={calendar.displayName || ""}
          onChange={(e) => onChange("displayName", e.target.value)}
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Color:
        </Text>
        <div className="flex gap-2 mb-2 flex-wrap">
          {GOOGLE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${calendar.color === color ? "border-blue-700 ring-2 ring-blue-200" : "border-[#eee]"}`}
              style={{ background: color }}
              aria-label={color}
              onClick={() => onChange("color", color)}
            >
              {calendar.color === color && (
                <span className="w-3 h-3 bg-white rounded-full block" />
              )}
            </button>
          ))}
          <input
            type="color"
            value={calendar.color || "#4285F4"}
            onChange={(e) => onChange("color", e.target.value)}
            className="w-7 h-7 p-0 border-none bg-transparent cursor-pointer"
            style={{ background: "none" }}
            aria-label="Custom color"
          />
        </div>
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          URL:
        </Text>
        <input
          type="text"
          value={calendar.url}
          readOnly
          className="w-full p-1.5 rounded border border-[#ccc] text-[#888] bg-[#f3f3f3] cursor-not-allowed"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Username:
        </Text>
        <input
          type="text"
          value={calendar.username}
          onChange={(e) => onChange("username", e.target.value)}
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Password:
        </Text>
        <input
          type="password"
          value={calendar.password}
          onChange={(e) => onChange("password", e.target.value)}
          className="w-full p-1.5 rounded border border-[#ccc] text-[#222] bg-[#fafbfc]"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          <input
            type="checkbox"
            checked={calendar.enabled !== false}
            onChange={e => onChange("enabled", e.target.checked)}
            className="mr-1.5"
          />
          Enabled
        </Text>
      </div>
      <div className="mt-2 flex gap-2 justify-end">
        <Button type="submit" variant="primary" onClick={onSave}>
          Save
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary">
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default EditCalendarModal;
