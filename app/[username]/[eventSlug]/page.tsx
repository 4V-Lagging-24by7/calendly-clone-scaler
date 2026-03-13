"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Clock, Globe, CheckCircle2, Video, ArrowLeft } from "lucide-react";
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

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const username = params.username as string;
  const eventSlug = params.eventSlug as string;

  const isQuickMeeting = searchParams.get("quick") === "true";

  const [user, setUser] = useState<User | null>(null);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [slotsLoading, setSlotsLoading] = useState(false);

  const [step, setStep] = useState<Step>("calendar");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const displayTitle =
    isQuickMeeting ? "New Meeting" : eventType?.name || "";

  useEffect(() => {
    async function load() {

      const res = await fetch(`/api/users/${username}`);

      if (!res.ok) {
        setNotFound(true);
        return;
      }

      const data: User = await res.json();

      setUser(data);

      const et = data.eventTypes.find((e) => e.slug === eventSlug);

      if (!et) {
        setNotFound(true);
        return;
      }

      setEventType(et);
    }

    load();
  }, [username, eventSlug]);

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

  useEffect(() => {

    if (!selectedDate || !eventType || !user) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    setSlotsLoading(true);
    setSelectedSlot(null);

    fetch(`/api/slots?username=${username}&eventTypeId=${eventType.id}&date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data);
        setSlotsLoading(false);
      });

  }, [selectedDate, eventType, user, username]);

  async function handleBook() {

    if (!selectedSlot) return;

    setFormError("");

    if (!name.trim() || !email.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email.");
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
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),

      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Booking failed.");
        return;
      }

      setStep("confirmed");

    } catch {

      setFormError("Network error.");

    } finally {

      setSubmitting(false);

    }
  }

  function handleBackClick() {

    if (step === "form") {
      setStep("calendar");
      setSelectedSlot(null);
      return;
    }

    setShowLeaveConfirm(true);

  }

  function discardBooking() {
    router.push("/dashboard/scheduling");
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Page not found
      </div>
    );
  }

  if (!user || !eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (step === "confirmed") {

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      {/* Back button */}

      <button
        onClick={() => router.push("/dashboard/scheduling")}
        className="self-start mb-4 flex items-center gap-2 text-gray-600 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <CheckCircle2 className="w-14 h-14 text-green-500 mb-4" />

      <h1 className="text-2xl font-bold mb-2">
        You're scheduled!
      </h1>

      <p className="text-gray-500 mb-6">
        A calendar invitation has been sent.
      </p>

      <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">

        <p className="font-semibold">{displayTitle}</p>

        <p className="flex gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {eventType.duration} minutes
        </p>

        {selectedSlot && (
          <p className="text-sm text-gray-600">
            {format(parseISO(selectedSlot.start), "EEEE, MMM d")} at{" "}
            {format(parseISO(selectedSlot.start), "h:mm a")}
          </p>
        )}

        <p className="text-sm text-gray-600">
          Invitee: {name}
        </p>

      </div>

      <button
        onClick={() => router.push("/dashboard/scheduling")}
        className="text-green-600 font-medium"
      >
        Book another meeting
      </button>

    </div>

  );
}

  if (step === "form" && selectedSlot) {

    return (

      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

        <button
          onClick={() => setStep("calendar")}
          className="self-start mb-4 flex items-center gap-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-2xl flex overflow-hidden">

          <div className="w-64 border-r border-gray-200 p-6">

            <h2 className="text-xl font-bold mb-4">
              {displayTitle}
            </h2>

            <div className="space-y-3 text-sm text-gray-600">

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {eventType.duration} min
              </div>

              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Google Meet
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                IST
              </div>

            </div>

          </div>

          <div className="flex-1 p-6">

            <h3 className="text-lg font-semibold mb-4">
              Invitee's details
            </h3>

            <div className="space-y-4">

              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {formError && (
                <p className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleBook}
                disabled={submitting}
              >
                {submitting ? "Scheduling..." : "Schedule Event"}
              </Button>

            </div>

          </div>

        </div>

      </div>

    );
  }

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      <button
        onClick={handleBackClick}
        className="self-start mb-4 flex items-center gap-2 text-gray-600 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-4xl overflow-hidden">

        <div className="flex">

          <div className="w-72 border-r border-gray-200 p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-10 h-10 rounded-full bg-[#006BFF] flex items-center justify-center text-white font-semibold">
                {user.name[0]}
              </div>

              <div>
                <p className="text-sm text-gray-500">{user.name}</p>
                <p className="text-lg font-semibold">{displayTitle}</p>
              </div>

            </div>

            <div className="space-y-3 text-sm text-gray-600">

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {eventType.duration} min
              </div>

              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Google Meet
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                IST
              </div>

            </div>

          </div>

          <div className="flex-1 p-6">

            <p className="text-sm font-semibold mb-4">
              Select a date & time
            </p>

            <BookingCalendar
              availableDays={availableDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

          </div>

          {selectedDate && (

            <div className="w-56 p-6 border-l">

              <p className="text-sm font-semibold mb-1">
                {format(selectedDate, "EEE, MMM d")}
              </p>

              <p className="text-xs text-gray-400 mb-4">
                {slots.length} available times
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