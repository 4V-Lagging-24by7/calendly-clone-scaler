// services/booking.service.ts
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// SLOT GENERATION ALGORITHM
// ─────────────────────────────────────────────
// Given a date, an event duration, and a user's availability + existing bookings:
//
// 1. Find the availability rule for the selected day-of-week
// 2. Generate all possible slots by stepping through the window in `duration` increments
// 3. Fetch all ACTIVE bookings for that user on that date
// 4. Filter out any generated slot that overlaps with an existing booking
// 5. Return only the free slots
//
// Overlap check: slotStart < bookingEnd && slotEnd > bookingStart
// This catches all overlap cases (partial, full, contained).
// ─────────────────────────────────────────────

export async function getAvailableSlots(
  userId: string,
  eventTypeId: string,
  dateStr: string // "YYYY-MM-DD" in local date
): Promise<{ start: string; end: string }[]> {
  // 1. Load the event type (for duration)
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });
  if (!eventType) return [];

  // 2. Parse the requested date
  const [year, month, day] = dateStr.split("-").map(Number);
  const requestedDate = new Date(year, month - 1, day);
  const dayOfWeek = requestedDate.getDay(); // 0=Sun, 6=Sat

  // 3. Find availability rule for this day of week
  const availability = await prisma.availability.findFirst({
    where: { userId, dayOfWeek },
  });
  if (!availability) return []; // Not available this day

  // 4. Build slot window: parse "HH:MM" strings into Date objects on requested date
  const [startHour, startMin] = availability.startTime.split(":").map(Number);
  const [endHour, endMin] = availability.endTime.split(":").map(Number);

  const windowStart = new Date(year, month - 1, day, startHour, startMin, 0);
  const windowEnd = new Date(year, month - 1, day, endHour, endMin, 0);
  const durationMs = eventType.duration * 60 * 1000;

  // 5. Generate all candidate slots
  const candidateSlots: { start: Date; end: Date }[] = [];
  let cursor = new Date(windowStart);
  while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
    candidateSlots.push({
      start: new Date(cursor),
      end: new Date(cursor.getTime() + durationMs),
    });
    cursor = new Date(cursor.getTime() + durationMs);
  }

  // 6. Fetch existing ACTIVE bookings for this user on this date
  const dayStart = new Date(year, month - 1, day, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

  const existingBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: BookingStatus.ACTIVE,
      startTime: { gte: dayStart, lte: dayEnd },
    },
  });

  // 7. Filter out slots that overlap with any existing booking
  // Overlap condition: slotStart < bookingEnd AND slotEnd > bookingStart
  const freeSlots = candidateSlots.filter((slot) => {
    return !existingBookings.some(
      (booking: { startTime: Date; endTime: Date }) =>
        slot.start < booking.endTime && slot.end > booking.startTime
    );
  });

  // 8. Also filter out slots in the past
  const now = new Date();
  const futureSlots = freeSlots.filter((slot) => slot.start > now);

  // 9. Return as ISO strings for the API response
  return futureSlots.map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  }));
}

// ─────────────────────────────────────────────
// CREATE BOOKING (with double-booking prevention)
// ─────────────────────────────────────────────
// We re-check for conflicts right before inserting.
// This is an optimistic approach — for production, a DB transaction
// with a unique constraint on (userId, startTime) would be used.
// For this assignment, the re-check approach is clean and explainable.

export async function createBooking(data: {
  userId: string;
  eventTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
}) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  // Re-check for conflicts (prevent double booking)
  const conflict = await prisma.booking.findFirst({
    where: {
      userId: data.userId,
      status: BookingStatus.ACTIVE,
      AND: [
        { startTime: { lt: end } },
        { endTime: { gt: start } },
      ],
    },
  });

  if (conflict) {
    throw new Error("SLOT_CONFLICT: This time slot is no longer available.");
  }

  return prisma.booking.create({
    data: {
      userId: data.userId,
      eventTypeId: data.eventTypeId,
      inviteeName: data.inviteeName,
      inviteeEmail: data.inviteeEmail,
      startTime: start,
      endTime: end,
      status: BookingStatus.ACTIVE,
    },
    include: { eventType: true, user: true },
  });
}

// ─────────────────────────────────────────────
// GET BOOKINGS (for admin meetings page)
// ─────────────────────────────────────────────

export async function getUpcomingBookings(userId: string) {
  const now = new Date();

  return prisma.booking.findMany({
    where: {
      userId,
      status: BookingStatus.ACTIVE,
      startTime: {
        gte: now,
      },
    },
    include: { eventType: true },
    orderBy: { startTime: "asc" },
  });
}

export async function getPastBookings(userId: string) {
  const now = new Date();

  return prisma.booking.findMany({
    where: {
      userId,
      status: BookingStatus.ACTIVE,
      startTime: {
        lt: now,
      },
    },
    include: { eventType: true },
    orderBy: { startTime: "desc" },
  });
}


export async function cancelBooking(bookingId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });
}
