// components/booking/BookingCalendar.tsx
"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  availableDays: number[]; // 0=Sun..6=Sat - which days of the week have availability
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}

export function BookingCalendar({ availableDays, onSelectDate, selectedDate }: Props) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty cells to align day-of-week headers
  const leadingBlanks = Array(getDay(monthStart)).fill(null);

  function isAvailable(date: Date) {
    if (isBefore(startOfDay(date), today)) return false;
    return availableDays.includes(getDay(date));
  }

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900">
          {format(viewMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {leadingBlanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const available = isAvailable(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);

          return (
            <div key={day.toISOString()} className="flex justify-center">
              <button
                disabled={!available}
                onClick={() => available && onSelectDate(day)}
                className={cn(
                  "w-9 h-9 rounded-full text-sm font-medium transition-all",
                  selected
                    ? "bg-[#006BFF] text-white"
                    : available
                    ? "text-gray-900 hover:bg-blue-50 hover:text-[#006BFF] font-semibold"
                    : "text-gray-300 cursor-not-allowed",
                  isToday && !selected && available && "border border-[#006BFF] text-[#006BFF]"
                )}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
