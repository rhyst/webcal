import { parseISO } from "date-fns";
import React, { useState, useEffect } from "react";
import { RRule, Frequency, Weekday } from "rrule";
import { tv } from "tailwind-variants";

interface SchedulerProps {
  rrule?: RRule;
  startDate?: string;
  onRruleChange: (rrule: RRule | null) => void;
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
  const [frequency, setFrequency] = useState<Frequency>(Frequency.DAILY);
  const [interval, setInterval] = useState<number>(1);
  const [endDate, setEndDate] = useState<string>("");
  const [count, setCount] = useState<number>(0);
  const [byWeekDay, setByWeekDay] = useState<Weekday[]>([]);
  const [byMonthDay, setByMonthDay] = useState<number[]>([]);
  const [byMonth, setByMonth] = useState<number[]>([]);
  const [bySetPos, setBySetPos] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse existing rrule on mount
  useEffect(() => {
    if (rrule) {
      const options = rrule.origOptions;
      setFrequency(options.freq || Frequency.DAILY);
      setInterval(options.interval || 1);
      setEndDate(
        options.until ? options.until.toISOString().split("T")[0] : "",
      );
      setCount(options.count || 0);
      setByWeekDay(
        Array.isArray(options.byweekday) &&
          options.byweekday.every((item) => item instanceof Weekday)
          ? options.byweekday
          : [],
      );
      setByMonthDay(
        Array.isArray(options.bymonthday) ? options.bymonthday : [],
      );
      setByMonth(Array.isArray(options.bymonth) ? options.bymonth : []);
      setBySetPos(Array.isArray(options.bysetpos) ? options.bysetpos : []);
    }
    setIsInitialized(true);
  }, [rrule]);

  // Generate new rrule when options change
  useEffect(() => {
    if (!isInitialized) return; // Skip during initial parse

    const options: any = {
      freq: frequency,
      interval: interval,
      dtstart: startDate ? parseISO(startDate) : new Date(),
    };

    if (endDate) {
      options.until = new Date(endDate);
    }

    if (count > 0) {
      options.count = count;
    }

    if (byWeekDay.length > 0) {
      options.byweekday = byWeekDay;
    }

    if (byMonthDay.length > 0) {
      options.bymonthday = byMonthDay;
    }

    if (byMonth.length > 0) {
      options.bymonth = byMonth;
    }

    if (bySetPos.length > 0) {
      options.bysetpos = bySetPos;
    }

    try {
      const newRrule = new RRule(options);
      onRruleChange(newRrule);
    } catch (error) {
      console.error("Invalid RRule options:", error);
      onRruleChange(null);
    }
  }, [
    isInitialized,
    startDate,
    frequency,
    interval,
    endDate,
    count,
    byWeekDay,
    byMonthDay,
    byMonth,
    bySetPos,
    onRruleChange,
  ]);

  const handleWeekDayToggle = (weekday: Weekday) => {
    setByWeekDay((prev) =>
      prev.includes(weekday)
        ? prev.filter((day) => day !== weekday)
        : [...prev, weekday],
    );
  };

  const handleMonthDayToggle = (day: number) => {
    setByMonthDay((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleMonthToggle = (month: number) => {
    setByMonth((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  const handleSetPosToggle = (pos: number) => {
    setBySetPos((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  };

  const weekDays = [
    { value: Weekday.fromStr("MO"), label: "Monday" },
    { value: Weekday.fromStr("TU"), label: "Tuesday" },
    { value: Weekday.fromStr("WE"), label: "Wednesday" },
    { value: Weekday.fromStr("TH"), label: "Thursday" },
    { value: Weekday.fromStr("FR"), label: "Friday" },
    { value: Weekday.fromStr("SA"), label: "Saturday" },
    { value: Weekday.fromStr("SU"), label: "Sunday" },
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

  return (
    <div className={scheduler({ className })}>
      <div className="space-y-6">
        {/* Frequency */}
        <div>
          <label className={label()}>Frequency</label>
          <select
            className={select()}
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
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
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
          />
        </div>

        {/* Until */}
        <div>
          <label className={label()}>Until (Optional)</label>
          <input
            type="date"
            className={input()}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Count */}
        <div>
          <label className={label()}>Count (Optional)</label>
          <input
            type="number"
            min="0"
            className={input()}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            placeholder="Leave empty for no limit"
          />
        </div>

        {/* By Week Day */}
        {(frequency === Frequency.WEEKLY ||
          frequency === Frequency.MONTHLY) && (
          <div>
            <label className={label()}>By Week Day</label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={byWeekDay.includes(day.value)}
                    onChange={() => handleWeekDayToggle(day.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {day.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* By Month Day */}
        {frequency === Frequency.MONTHLY && (
          <div>
            <label className={label()}>By Month Day</label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  onClick={() => handleMonthDayToggle(day)}
                  className={`p-2 text-xs rounded ${
                    byMonthDay.includes(day)
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
        {frequency === Frequency.YEARLY && (
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
                    checked={byMonth.includes(month.value)}
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

        {/* By Set Position */}
        {(frequency === Frequency.MONTHLY ||
          frequency === Frequency.YEARLY) && (
          <div>
            <label className={label()}>By Set Position</label>
            <div className="grid grid-cols-5 gap-2">
              {setPositions.map((pos) => (
                <label
                  key={pos.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={bySetPos.includes(pos.value)}
                    onChange={() => handleSetPosToggle(pos.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {pos.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {rrule && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <code className="text-sm text-gray-900 dark:text-gray-100 break-all">
              {rrule.toText()}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;
