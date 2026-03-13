// app/[username]/[eventSlug]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Globe, ChevronLeft, CheckCircle2, Video } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventType {
  id: string;
  name: string;
  slug: string;
  duration: number;
}
interface User {
  id: string;
  name: string;
  username: string;
  timezone: string;
  eventTypes: EventType[];
}
interface Slot {
  start: string;
  end: string;
}

type Step = "calendar" | "form" | "confirmed";

export default function BookingPage() {
  const { username, eventSlug } = useParams<{ username: string; eventSlug: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [step, setStep] = useState<Step>("calendar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  // Load user + event type
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) { setNotFound(true); return; }
      const data: User = await res.json();
      setUser(data);
      const et = data.eventTypes.find((e) => e.slug === eventSlug);
      if (!et) { setNotFound(true); return; }
      setEventType(et);
    }
    load();
  }, [username, eventSlug]);

  // Load available days from availability schedule
  useEffect(() => {
    async function loadAvailability() {
      const res = await fetch("/api/availability");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableDays(data.map((a: any) => a.dayOfWeek));
      }
    }
    loadAvailability();
  }, []);

  // Load slots when a date is selected
  useEffect(() => {
    if (!selectedDate || !eventType || !user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setSlotsLoading(true);
    setSelectedSlot(null);
    fetch(`/api/slots?username=${username}&eventTypeId=${eventType.id}&date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => { setSlots(data); setSlotsLoading(false); });
  }, [selectedDate, eventType, user, username]);

  async function handleBook() {
    setFormError("");
    if (!name.trim() || !email.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          eventTypeId: eventType!.id,
          inviteeName: name.trim(),
          inviteeEmail: email.trim(),
          startTime: selectedSlot!.start,
          endTime: selectedSlot!.end,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Booking failed. Please try again.");
        return;
      }
      setStep("confirmed");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">Page not found</p>
          <p className="text-gray-500">This booking link doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (!user || !eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#006BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── CONFIRMED screen ───
  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-md p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmed!</h1>
          <p className="text-gray-500 mb-6">
            Your meeting with <span className="font-medium text-gray-800">{user.name}</span> has been scheduled.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <p className="text-sm font-semibold text-gray-800">{eventType.name}</p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {eventType.duration} minutes
            </p>
            {selectedSlot && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {format(parseISO(selectedSlot.start), "EEEE, MMMM d, yyyy")} at{" "}
                {format(parseISO(selectedSlot.start), "h:mm a")}
              </p>
            )}
            <p className="text-sm text-gray-600">Name: {name}</p>
            <p className="text-sm text-gray-600">Email: {email}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[#006BFF] hover:underline"
          >
            Schedule another meeting
          </button>
        </div>
      </div>
    );
  }

  // ─── BOOKING FORM screen ───
  if (step === "form" && selectedSlot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left panel */}
            <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#006BFF] flex items-center justify-center text-white text-sm font-semibold">
                  {user.name[0]}
                </div>
                <span className="text-sm text-gray-500">{user.name}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{eventType.name}</h2>
              <div className="space-y-2.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {eventType.duration} min
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  Google Meet
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {user.timezone}
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Your selected time</p>
                <p className="text-sm font-semibold text-gray-800">
                  {format(parseISO(selectedSlot.start), "h:mm a")} –{" "}
                  {format(parseISO(selectedSlot.end), "h:mm a")}
                </p>
                <p className="text-sm text-gray-600">
                  {format(parseISO(selectedSlot.start), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 p-6">
              <button
                onClick={() => { setStep("calendar"); setSelectedSlot(null); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h3 className="text-lg font-semibold text-gray-900 mb-5">Enter your details</h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="b-name">Name *</Label>
                  <Input
                    id="b-name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-email">Email *</Label>
                  <Input
                    id="b-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    {formError}
                  </p>
                )}

                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? "Scheduling…" : "Schedule Event"}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  By scheduling, you agree to share your name and email with the host.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CALENDAR + TIME SLOTS screen ───
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-3xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left info panel */}
          <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#006BFF] flex items-center justify-center text-white text-sm font-semibold">
                {user.name[0]}
              </div>
              <span className="text-sm text-gray-500">{user.name}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{eventType.name}</h2>
            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {eventType.duration} min
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Google Meet
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {user.timezone}
              </div>
            </div>
          </div>

          {/* Calendar panel */}
          <div className={`flex-1 p-6 ${selectedDate ? "md:border-r border-gray-200" : ""}`}>
            <p className="text-sm font-semibold text-gray-700 mb-4">Select a date &amp; time</p>
            <BookingCalendar
              availableDays={availableDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Timezone indicator */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
              <Globe className="w-3.5 h-3.5" />
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>

          {/* Time slots panel */}
          {selectedDate && (
            <div className="md:w-52 border-t md:border-t-0 p-6">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {format(selectedDate, "EEE, MMM d")}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                {slots.length} time{slots.length !== 1 ? "s" : ""} available
              </p>

              <TimeSlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={(slot) => {
                  setSelectedSlot(slot);
                  setStep("form");
                }}
                loading={slotsLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
