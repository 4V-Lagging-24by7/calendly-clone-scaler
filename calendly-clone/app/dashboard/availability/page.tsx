// app/dashboard/availability/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Plus, X, Copy, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = [
  { label: "Sunday", short: "S", value: 0 },
  { label: "Monday", short: "M", value: 1 },
  { label: "Tuesday", short: "T", value: 2 },
  { label: "Wednesday", short: "W", value: 3 },
  { label: "Thursday", short: "T", value: 4 },
  { label: "Friday", short: "F", value: 5 },
  { label: "Saturday", short: "S", value: 6 },
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

function formatTime12(t: string) {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr);
  const m = mStr;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}${suffix}`;
}

interface DaySlot {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type Schedule = Record<number, DaySlot>;

const DEFAULT_SCHEDULE: Schedule = {
  0: { enabled: false, startTime: "09:00", endTime: "17:00" },
  1: { enabled: true, startTime: "09:00", endTime: "17:00" },
  2: { enabled: true, startTime: "09:00", endTime: "17:00" },
  3: { enabled: true, startTime: "09:00", endTime: "17:00" },
  4: { enabled: true, startTime: "09:00", endTime: "17:00" },
  5: { enabled: true, startTime: "09:00", endTime: "17:00" },
  6: { enabled: false, startTime: "09:00", endTime: "17:00" },
};

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [timezone, setTimezone] = useState("America/New_York");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/availability");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const built: Schedule = { ...DEFAULT_SCHEDULE };
        // Mark all disabled first
        Object.keys(built).forEach((k) => {
          built[Number(k)].enabled = false;
        });
        data.forEach((slot: any) => {
          built[slot.dayOfWeek] = {
            enabled: true,
            startTime: slot.startTime,
            endTime: slot.endTime,
          };
        });
        // Restore saved timezone from the first availability row
        if (data[0]?.timezone) setTimezone(data[0].timezone);
        setSchedule(built);
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggle(day: number) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function updateTime(day: number, field: "startTime" | "endTime", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function copyToAll(day: number) {
    const src = schedule[day];
    setSchedule((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const d = Number(k);
        if (next[d].enabled) {
          next[d] = { ...next[d], startTime: src.startTime, endTime: src.endTime };
        }
      });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const slots = Object.entries(schedule)
      .filter(([, s]) => s.enabled)
      .map(([day, s]) => ({
        dayOfWeek: Number(day),
        startTime: s.startTime,
        endTime: s.endTime,
        timezone,
      }));

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button className="pb-3 text-sm font-semibold text-[#006BFF] border-b-2 border-[#006BFF] -mb-px">
          Schedules
        </button>
        <button className="pb-3 text-sm text-gray-500 hover:text-gray-700">
          Calendar settings
        </button>
        <button className="pb-3 text-sm text-gray-500 hover:text-gray-700">
          Advanced settings
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Schedule header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <button className="text-[#006BFF] font-semibold text-sm flex items-center gap-1 hover:underline">
              Working hours (default)
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <p className="text-xs text-gray-500 mt-0.5">
              Active on:{" "}
              <span className="text-[#006BFF] cursor-pointer hover:underline">
                {Object.values(schedule).filter((s) => s.enabled).length > 0
                  ? `${Object.values(schedule).filter((s) => s.enabled).length} event types`
                  : "No event types"}
              </span>
            </p>
          </div>
          <div className="flex gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
            <button className="px-3 py-1.5 bg-white font-medium text-gray-800">List</button>
            <button className="px-3 py-1.5 hover:bg-gray-50">Calendar</button>
          </div>
        </div>

        {/* Weekly hours section */}
        <div className="px-6 py-5">
          <div className="flex items-start gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-800">Weekly hours</p>
              <p className="text-xs text-gray-500">Set when you are typically available for meetings</p>
            </div>
          </div>

          <div className="space-y-2">
            {DAYS.map(({ label, short, value }) => {
              const slot = schedule[value];
              return (
                <div key={value} className="flex items-center gap-3 min-h-[44px]">
                  {/* Day toggle circle */}
                  <button
                    onClick={() => toggle(value)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                      slot.enabled
                        ? "bg-[#1a1a2e] text-white"
                        : "bg-transparent text-gray-400 border border-gray-300"
                    }`}
                    title={label}
                  >
                    {short}
                  </button>

                  {slot.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      {/* Start time */}
                      <select
                        className="h-9 px-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                        value={slot.startTime}
                        onChange={(e) => updateTime(value, "startTime", e.target.value)}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12(t)}</option>
                        ))}
                      </select>

                      <span className="text-gray-400 text-sm">–</span>

                      {/* End time */}
                      <select
                        className="h-9 px-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                        value={slot.endTime}
                        onChange={(e) => updateTime(value, "endTime", e.target.value)}
                      >
                        {TIME_OPTIONS.filter((t) => t > slot.startTime).map((t) => (
                          <option key={t} value={t}>{formatTime12(t)}</option>
                        ))}
                      </select>

                      {/* Utility buttons */}
                      <div className="flex gap-1 ml-1">
                        <button
                          onClick={() => toggle(value)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyToAll(value)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Copy to all active days"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-400">Unavailable</span>
                      <button
                        onClick={() => toggle(value)}
                        className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Add hours"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timezone selector */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor="tz-select" className="text-xs text-gray-500 whitespace-nowrap">
              Timezone:
            </label>
            <select
              id="tz-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex-1 max-w-xs h-8 px-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
              <option value="UTC">UTC (Universal Time)</option>
              <option value="America/New_York">America/New_York (EST, UTC-5)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-8)</option>
              <option value="America/Chicago">America/Chicago (CST, UTC-6)</option>
              <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
              <option value="Europe/Paris">Europe/Paris (CET, UTC+1)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT, UTC+11)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
