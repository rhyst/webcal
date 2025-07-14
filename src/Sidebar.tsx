import React from "react";
import Button from "./Button";
import Text from "./Text";
import type { Calendar } from "./types";

interface SidebarProps {
  calendars: Calendar[];
  loading?: boolean;
  onClickRemove: (uid: string) => void;
  onClickAdd: (v: boolean) => void;
  onClickCalendar: (uid: string) => void;
  onClickImport?: (calendars: Calendar[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  calendars,
  loading = false,
  onClickRemove,
  onClickAdd,
  onClickCalendar,
  onClickImport,
}) => (
  <div className="w-[320px] h-screen bg-[#ffffff] border-r border-[#e0e0e0] flex flex-col gap-4 p-2">
    <div className="flex items-center justify-between gap-2">
      <Text
        as="h1"
        size="lg"
        weight="semibold"
        color="blue"
        className="m-0 p-0"
      >
        WebCal
      </Text>
      {loading && (
        <svg
          className="animate-spin h-5 w-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
    </div>
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => onClickAdd(true)}
        className="w-full text-lg"
        variant="primary"
      >
        <Text as="span" size="base" weight="semibold" color="white">
          Add Calendar
        </Text>
      </Button>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const dataStr =
              "data:text/json;charset=utf-8," +
              encodeURIComponent(JSON.stringify(calendars, null, 2));
            const downloadAnchorNode = document.createElement("a");
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute(
              "download",
              "caldav_calendars.json",
            );
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          }}
          className="w-full text-lg"
          variant="secondary"
        >
          <Text as="span" size="base" weight="semibold" color="blue">
            Export
          </Text>
        </Button>
        <Button
          onClick={() => {
            document.getElementById("import-calendars-input")?.click();
          }}
          className="w-full text-lg"
          variant="secondary"
        >
          <Text as="span" size="base" weight="semibold" color="blue">
            Import
          </Text>
        </Button>
      </div>
    </div>
    <input
      id="import-calendars-input"
      type="file"
      accept="application/json"
      style={{ display: "none" }}
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            if (typeof onClickImport === "function") onClickImport(parsed);
          } else {
            alert("Invalid file format: expected an array");
          }
        } catch (err) {
          alert("Failed to parse JSON: " + err);
        }
        e.target.value = "";
      }}
    />
    <div className="flex-1 overflow-y-auto pt-0">
      <ul className="flex flex-col gap-1 list-none p-0 m-0">
        {calendars.map((cal) => (
          <li
            key={cal.uid}
            className={`flex items-center group${cal.enabled === false ? " opacity-40" : ""}`}
          >
            <div
              className="flex items-center flex-1 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5"
              onClick={() => onClickCalendar(cal.uid)}
            >
              <span
                className="inline-block w-3.5 h-3.5 rounded-full mr-2.5 border border-[#bbb]"
                style={{ background: cal.color || "#1976d2" }}
              />
              <Text
                as="span"
                size="base"
                weight="medium"
                color="gray"
                className="break-all flex-1"
              >
                {cal.name}
              </Text>
            </div>
            <Button
              className="ml-2 px-2 py-0.5 text-xs"
              variant="secondary"
              onClick={() => {
                onClickRemove(cal.uid);
              }}
              title="Remove"
              type="button"
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Sidebar;
