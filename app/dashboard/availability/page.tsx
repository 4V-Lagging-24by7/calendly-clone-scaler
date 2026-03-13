// app/dashboard/availability/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Plus, X, Copy } from "lucide-react";
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


const TIMEZONES = [
  { label: "IST (India Standard Time)", value: "Asia/Kolkata" },
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
  { label: "GMT (Greenwich Mean Time)", value: "Europe/London" },
  { label: "EST (Eastern Standard Time)", value: "America/New_York" },
  { label: "CST (Central Standard Time)", value: "America/Chicago" },
  { label: "MST (Mountain Standard Time)", value: "America/Denver" },
  { label: "PST (Pacific Standard Time)", value: "America/Los_Angeles" },
  { label: "CET (Central European Time)", value: "Europe/Paris" },
  { label: "AEST (Australian Eastern Time)", value: "Australia/Sydney" },
];

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

  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/availability");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const built: Schedule = { ...DEFAULT_SCHEDULE };

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

        setSchedule(built);

        if (data[0]?.timezone) {
          setTimezone(data[0].timezone);
        }
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
          next[d] = {
            ...next[d],
            startTime: src.startTime,
            endTime: src.endTime,
          };
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
      headers: {
        "Content-Type": "application/json",
      },
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
        {/* Weekly hours */}
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Weekly hours
          </p>

          <p className="text-xs text-gray-500 mb-4">
            Set when you are typically available for meetings
          </p>

          <div className="space-y-2">
            {DAYS.map(({ label, short, value }) => {
              const slot = schedule[value];

              return (
                <div key={value} className="flex items-center gap-3 min-h-[44px]">
                  <button
                    onClick={() => toggle(value)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
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
                      <select
                        className="h-9 px-2 border border-gray-300 rounded-md text-sm"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTime(value, "startTime", e.target.value)
                        }
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime12(t)}
                          </option>
                        ))}
                      </select>

                      <span className="text-gray-400">–</span>

                      <select
                        className="h-9 px-2 border border-gray-300 rounded-md text-sm"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTime(value, "endTime", e.target.value)
                        }
                      >
                        {TIME_OPTIONS.filter((t) => t > slot.startTime).map(
                          (t) => (
                            <option key={t} value={t}>
                              {formatTime12(t)}
                            </option>
                          )
                        )}
                      </select>

                      <button onClick={() => toggle(value)}>
                        <X className="w-4 h-4 text-gray-400" />
                      </button>

                      <button onClick={() => copyToAll(value)}>
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timezone footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
          <span className="text-xs text-gray-500">Timezone:</span>

          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {TIMEZONES.map((tz) => (
  <option key={tz.value} value={tz.value}>
    {tz.label}
  </option>
))}
          </select>
        </div>
      </div>
    </div>
  );
}