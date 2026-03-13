// app/dashboard/meetings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Calendar, Clock, User, Mail, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

interface Booking {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "CANCELLED";
  eventType: {
    name: string;
    duration: number;
  };
}

function formatMeetingDate(iso: string) {
  return format(parseISO(iso), "EEE, MMM d, yyyy");
}
function formatMeetingTime(start: string, end: string) {
  return `${format(parseISO(start), "h:mm a")} – ${format(parseISO(end), "h:mm a")}`;
}

function BookingCard({
  booking,
  onCancel,
  isPast,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  isPast: boolean;
}) {
  const cancelled = booking.status === "CANCELLED";
  return (
    <div
      className={`bg-white rounded-lg border p-5 transition-colors ${
        cancelled ? "border-gray-200 opacity-60" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Event type name */}
          <h3 className="font-semibold text-gray-900 mb-1">{booking.eventType.name}</h3>

          {/* Date & time */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {formatMeetingDate(booking.startTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {formatMeetingTime(booking.startTime, booking.endTime)}
            </span>
          </div>

          {/* Invitee details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              {booking.inviteeName}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              {booking.inviteeEmail}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {cancelled ? (
            <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
              Cancelled
            </span>
          ) : (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              Confirmed
            </span>
          )}
          {!isPast && !cancelled && (
            <button
              onClick={() => onCancel(booking.id)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    const [upRes, pastRes] = await Promise.all([
      fetch("/api/bookings?type=upcoming"),
      fetch("/api/bookings?type=past"),
    ]);
    setUpcoming(await upRes.json());
    setPast(await pastRes.json());
    setLoading(false);
  }

  useEffect(() => { loadBookings(); }, []);

  async function handleCancel(id: string) {
    await fetch(`/api/bookings/${id}/cancel`, { method: "PATCH" });
    setCancelConfirm(null);
    loadBookings();
  }

  const currentList = tab === "upcoming" ? upcoming : past;

  return (
    <div className="max-w-3xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Meetings
          <span className="text-gray-400 text-base font-normal cursor-help" title="View your scheduled meetings">⓪</span>
        </h1>

        {/* Filter dropdown placeholder */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            My Calendly
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#006BFF]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Upcoming</p>
            <p className="text-lg font-bold text-gray-900">{upcoming.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Past</p>
            <p className="text-lg font-bold text-gray-900">{past.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "text-[#006BFF] border-b-2 border-[#006BFF] -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {t === "upcoming" ? upcoming.length : past.length}
            </span>
          </button>
        ))}
        <button className="pb-3 text-sm text-gray-500 hover:text-gray-700 ml-2">
          Date Range ▾
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-lg border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <Calendar className="w-16 h-16 text-gray-200" />
            <span className="absolute top-1 right-1 text-xs font-bold text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">0</span>
          </div>
          <p className="text-gray-800 font-semibold mb-1">No Events Yet</p>
          <p className="text-gray-500 text-sm mb-4">Share Event Type links to schedule events.</p>
          <Button
            variant="default"
            onClick={() => window.location.href = "/dashboard/scheduling"}
          >
            View Event Types
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={(id) => setCancelConfirm(id)}
              isPast={tab === "past"}
            />
          ))}
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel this meeting?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will mark the meeting as cancelled. The invitee will not be notified automatically.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelConfirm(null)}>
                Keep it
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={() => handleCancel(cancelConfirm)}
              >
                Yes, cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
