import React, { useState } from "react";
import Button from "./Button";
import Text from "./Text";
import Modal from "react-modal";
import type { Calendar } from "./types";
import Input from "./Input";
import Checkbox from "./Checkbox";

const COLORS = [
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

interface EditCalendarModalProps {
  open: boolean;
  isEdit: boolean;
  calendar?: Calendar;
  onSave: (calendar: Calendar) => void;
  onClose: () => void;
}

const EditCalendarModal: React.FC<EditCalendarModalProps> = ({
  open,
  isEdit,
  calendar,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(calendar?.name || "");
  const [color, setColor] = useState(calendar?.color || COLORS[0]);
  const [url, setUrl] = useState(calendar?.url || "");
  const [username, setUserName] = useState(calendar?.username || "");
  const [password, setPassword] = useState(calendar?.password || "");
  const [enabled, setEnabled] = useState<boolean>(calendar?.enabled || true);

  const handleSave = () => {
    onSave({
      ...calendar,
      uid: calendar?.uid || Math.random().toString(36).slice(2) + Date.now(),
      name,
      color,
      url,
      username,
      password,
      enabled,
    });
  };

  return (
    <Modal
      isOpen={open}
      onRequestClose={onClose}
      overlayClassName="fixed inset-0 bg-black/35 z-50 flex items-center justify-center"
      className="bg-white dark:bg-neutral-900 p-8 rounded-xl min-w-[340px] shadow-xl border border-[#e0e0e0] dark:border-gray-700 flex flex-col gap-3 outline-none"
      ariaHideApp={false}
    >
      <Text
        as="h3"
        size="lg"
        weight="semibold"
        color="blue"
        className="m-0 mb-2"
      >
        {isEdit ? "Edit" : "Create"} Calendar
      </Text>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Name:
        </Text>
        <Input
          type="text"
          value={name || ""}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Color:
        </Text>
        <div className="flex gap-2 mb-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${color === c ? "border-blue-700 ring-2 ring-blue-200" : "border-[#eee]"}`}
              style={{ background: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            >
              {color === c && (
                <span className="w-3 h-3 bg-white rounded-full block" />
              )}
            </button>
          ))}
          <input
            type="color"
            value={color || "#4285F4"}
            onChange={(e) => setColor(e.target.value)}
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
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isEdit}
          className="text-[#888] disabled:bg-[#f3f3f3] disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Username:
        </Text>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div>
        <Text as="label" size="sm" weight="medium" color="gray">
          Password:
        </Text>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
          <Checkbox
            checked={enabled !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnabled(e.target.checked)}
            className="mr-1.5"
            size={20}
            label="Enabled"
          />
      </div>
      <div className="mt-2 flex gap-2 justify-end">
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

export default EditCalendarModal;
