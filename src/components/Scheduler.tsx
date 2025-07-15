import { format, parseISO } from "date-fns";
import React from "react";
import { RRule, Frequency, Weekday } from "rrule";
import { tv } from "tailwind-variants";
import Checkbox from "./Checkbox";

const castArray = <T,>(value: T | T[]): T[] => {
  return Array.isArray(value) ? value : [value];
};

interface SchedulerProps {
  rrule?: string;
  startDate?: string;
  onRruleChange: (rrule?: string) => void;
  className?: string;
}

const scheduler = tv({
  base: "bg-white dark:bg-gray-800 rounded-lg",
});

const input = tv({
  base: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
});

const select = tv({
  base: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
});

const label = tv({
  base: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
});

const Scheduler: React.FC<SchedulerProps> = ({
  rrule,
  startDate,
  onRruleChange,
  className = "",
}) => {
  const options = RRule.fromString(rrule || "").options;

  const handleChange = (partial: Partial<RRule.Options>) => {
    const newOptions = { ...options, ...partial };
    newOptions.dtstart = parseISO(startDate || "");
    onRruleChange(new RRule(newOptions).toString());
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    options.freq = Number(e.target.value);
    options.byhour = [];
    options.byminute = [];
    options.bysecond = [];
    options.bysetpos = [];
    options.bymonthday = [];
    options.bymonth = [];
    options.byweekday = [];
    options.count = undefined;
    options.until = undefined;
    handleChange(options);
  };

  const handleWeekDayToggle = (weekday: number) => {
    const existing = options.byweekday as number[];
    let byweekday = [];
    if (existing) {
      byweekday = castArray(existing).includes(weekday)
        ? castArray(existing).filter((day) => day !== weekday)
        : [...castArray(existing), weekday];
    } else {
      byweekday = [weekday];
    }
    handleChange({ byweekday });
  };

  const handleMonthDayToggle = (day: number) => {
    const existing = options.bymonthday;
    let bymonthday: number[] = [];
    if (existing) {
      bymonthday = castArray(existing).includes(day)
        ? castArray(existing).filter((d) => d !== day)
        : [...castArray(existing), day];
    } else {
      bymonthday = [day];
    }
    if (
      bymonthday.length === 0 &&
      castArray(options.byweekday || [])?.length === 0
    ) {
      bymonthday = [1];
    }
    handleChange({ bymonthday });
  };

  const handleMonthToggle = (month: number) => {
    const existing = options.bymonth;
    let bymonth = [];
    if (existing) {
      bymonth = castArray(existing).includes(month)
        ? castArray(existing).filter((m) => m !== month)
        : [...castArray(existing), month];
    } else {
      bymonth = [month];
    }
    handleChange({ bymonth });
  };

  const handleSetPosToggle = (pos: number) => {
    const existing = options.bysetpos;
    let bysetpos = [];
    if (existing) {
      bysetpos = castArray(existing).includes(pos)
        ? castArray(existing).filter((p) => p !== pos)
        : [...castArray(existing), pos];
    } else {
      bysetpos = [pos];
    }
    handleChange({ bysetpos });
  };

  const handleUntilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const until = new Date(e.target.value);
    handleChange({ until });
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Number(e.target.value);
    handleChange({ count });
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = Number(e.target.value);
    handleChange({ interval });
  };

  const weekDays = [
    { value: Weekday.fromStr("MO").weekday, label: "Monday" },
    { value: Weekday.fromStr("TU").weekday, label: "Tuesday" },
    { value: Weekday.fromStr("WE").weekday, label: "Wednesday" },
    { value: Weekday.fromStr("TH").weekday, label: "Thursday" },
    { value: Weekday.fromStr("FR").weekday, label: "Friday" },
    { value: Weekday.fromStr("SA").weekday, label: "Saturday" },
    { value: Weekday.fromStr("SU").weekday, label: "Sunday" },
  ];

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const setPositions = [
    { value: 1, label: "First" },
    { value: 2, label: "Second" },
    { value: 3, label: "Third" },
    { value: 4, label: "Fourth" },
    { value: -1, label: "Last" },
  ];

  console.log("options", options);

  return (
    <div className={scheduler({ className })}>
      <div className="space-y-6">
        {/* Frequency */}
        <div>
          <label className={label()}>Frequency</label>
          <select
            className={select()}
            value={options.freq}
            onChange={handleFrequencyChange}
          >
            <option value={Frequency.YEARLY}>Yearly</option>
            <option value={Frequency.MONTHLY}>Monthly</option>
            <option value={Frequency.WEEKLY}>Weekly</option>
            <option value={Frequency.DAILY}>Daily</option>
            <option value={Frequency.HOURLY}>Hourly</option>
            <option value={Frequency.MINUTELY}>Minutely</option>
          </select>
        </div>

        {/* Interval */}
        <div>
          <label className={label()}>Interval</label>
          <input
            type="number"
            min="1"
            className={input()}
            value={options.interval}
            onChange={handleIntervalChange}
          />
        </div>

        {/* Until */}
        <div>
          <label className={label()}>Until (Optional)</label>
          <input
            type="date"
            className={input()}
            value={options.until?.toISOString().split("T")[0]}
            onChange={handleUntilChange}
          />
        </div>

        {/* Count */}
        <div>
          <label className={label()}>Count (Optional)</label>
          <input
            type="number"
            min="0"
            className={input()}
            value={options.count}
            onChange={handleCountChange}
            placeholder="Leave empty for no limit"
          />
        </div>

        {/* By Week Day */}
        {(options.freq === Frequency.WEEKLY ||
          options.freq === Frequency.MONTHLY) && (
          <div>
            <label className={label()}>By Week Day</label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    type="checkbox"
                    checked={castArray(options.byweekday).includes(day.value)}
                    onChange={() => handleWeekDayToggle(day.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    label={day.label}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* By Month Day */}
        {options.freq === Frequency.MONTHLY && (
          <div>
            <label className={label()}>By Month Day</label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  onClick={() => handleMonthDayToggle(day)}
                  className={`p-2 text-xs rounded ${
                    castArray(options.bymonthday).includes(day)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* By Month */}
        {options.freq === Frequency.YEARLY && (
          <div>
            <label className={label()}>By Month</label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => (
                <label
                  key={month.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={castArray(options.bymonth).includes(month.value)}
                    onChange={() => handleMonthToggle(month.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {month.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* By Occurence */}
        {(options.freq === Frequency.MONTHLY ||
          options.freq === Frequency.YEARLY) && (
          <div>
            <label className={label()}>By Occurence</label>
            <div className="grid grid-cols-5 gap-2">
              {setPositions.map((pos) => (
                <label
                  key={pos.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    type="checkbox"
                    checked={castArray(options.bysetpos).includes(pos.value)}
                    onChange={() => handleSetPosToggle(pos.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    label={pos.label}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {rrule && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
              Repeat {RRule.fromString(rrule).toText()} starting from{" "}
              {format(parseISO(startDate || ""), "MMM d, yyyy")}
              <br />
              {rrule}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;
