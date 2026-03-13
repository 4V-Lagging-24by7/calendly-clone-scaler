"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Mail,
  XCircle,
  ChevronDown
} from "lucide-react";

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

/* ---------------- Booking Card ---------------- */

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
        cancelled
          ? "border-gray-200 opacity-60"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">
            {booking.eventType.name}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatMeetingDate(booking.startTime)}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatMeetingTime(booking.startTime, booking.endTime)}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {booking.inviteeName}
            </span>

            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              {booking.inviteeEmail}
            </span>
          </div>
        </div>

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
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:underline"
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

/* ---------------- Main Page ---------------- */

export default function MeetingsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  /* Date Filter */

  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  async function loadBookings() {
    setLoading(true);

    const res = await fetch("/api/bookings");
    const bookings = await res.json();

    const now = new Date();

    const upcomingBookings = bookings.filter(
      (b: Booking) =>
        new Date(b.startTime) >= now && b.status === "ACTIVE"
    );

    const pastBookings = bookings.filter(
      (b: Booking) =>
        new Date(b.startTime) < now || b.status === "CANCELLED"
    );

    setUpcoming(upcomingBookings);
    setPast(pastBookings);

    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(id: string) {
    await fetch(`/api/bookings/${id}/cancel`, { method: "PATCH" });
    setCancelConfirm(null);
    loadBookings();
  }

  const currentList = tab === "upcoming" ? upcoming : past;

  return (
    <div className="max-w-3xl">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Meetings
        </h1>

        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50">
          My Calendly
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

      </div>

      {/* Stats */}

      <div className="flex gap-4 mb-6">

        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[#006BFF]" />
          <div>
            <p className="text-xs text-gray-500">Upcoming</p>
            <p className="text-lg font-bold text-gray-900">{upcoming.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Past</p>
            <p className="text-lg font-bold text-gray-900">{past.length}</p>
          </div>
        </div>

      </div>

      {/* Tabs */}

      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">

        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize ${
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

        

      </div>

      {/* Content */}

      {loading ? (

        <div className="space-y-3">

          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-lg border border-gray-200 animate-pulse"
            />
          ))}

        </div>

      ) : currentList.length === 0 ? (

        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">

          <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />

          <p className="text-gray-800 font-semibold mb-1">
            No Events Yet
          </p>

          <p className="text-gray-500 text-sm mb-4">
            Share Event Type links to schedule events.
          </p>

          <Button
            onClick={() => (window.location.href = "/dashboard/scheduling")}
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

      {/* Cancel Confirmation */}

      {cancelConfirm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cancel this meeting?
            </h3>

            <p className="text-sm text-gray-500 mb-5">
              This will mark the meeting as cancelled.
            </p>

            <div className="flex justify-end gap-3">

              <Button
                variant="outline"
                onClick={() => setCancelConfirm(null)}
              >
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