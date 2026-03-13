"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  slot: { start: string; end: string };
  username: string;
  eventTypeId: string;
  onBooked: () => void;
}

export function BookingForm({ slot, username, eventTypeId, onBooked }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          eventTypeId,
          inviteeName: name,
          inviteeEmail: email,
          startTime: slot.start,
          endTime: slot.end,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      onBooked();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div>
        <label className="text-sm font-medium text-gray-700">Your name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Email address</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mt-1"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Scheduling..." : "Schedule Event"}
      </Button>
    </form>
  );
}