// services/booking.service.ts
import { prisma } from "@/lib/prisma";

// Use string literals matching the Prisma schema enum values.
// Avoids a compile-time dependency on the generated @prisma/client types.
const STATUS_ACTIVE = "ACTIVE" as const;
const STATUS_CANCELLED = "CANCELLED" as const;

// ─────────────────────────────────────────────
// SLOT GENERATION ALGORITHM
// ─────────────────────────────────────────────
// 1. Find availability rule for the selected day-of-week
// 2. Step through the window in `duration` increments to build candidate slots
// 3. Fetch existing ACTIVE bookings for that date
// 4. Filter out any slot that overlaps: slotStart < bookingEnd && slotEnd > bookingStart
// 5. Filter out past slots, return remainder
// ─────────────────────────────────────────────

export async function getAvailableSlots(
  userId: string,
  eventTypeId: string,
  dateStr: string
): Promise<{ start: string; end: string }[]> {
  const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType) return [];

  const [year, month, day] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  const availability = await prisma.availability.findFirst({ where: { userId, dayOfWeek } });
  if (!availability) return [];

  const [startHour, startMin] = availability.startTime.split(":").map(Number);
  const [endHour, endMin] = availability.endTime.split(":").map(Number);

  const windowStart = new Date(year, month - 1, day, startHour, startMin, 0);
  const windowEnd   = new Date(year, month - 1, day, endHour,   endMin,   0);
  const durationMs  = eventType.duration * 60 * 1000;

  const candidateSlots: { start: Date; end: Date }[] = [];
  let cursor = new Date(windowStart);
  while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
    candidateSlots.push({ start: new Date(cursor), end: new Date(cursor.getTime() + durationMs) });
    cursor = new Date(cursor.getTime() + durationMs);
  }

  const existingBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: STATUS_ACTIVE,
      startTime: { gte: new Date(year, month - 1, day, 0, 0, 0), lte: new Date(year, month - 1, day, 23, 59, 59) },
    },
  });

  const now = new Date();
  const freeSlots = candidateSlots.filter((slot) =>
    slot.start > now &&
    !existingBookings.some(
      (b: { startTime: Date; endTime: Date }) => slot.start < b.endTime && slot.end > b.startTime
    )
  );

  return freeSlots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() }));
}

// ─────────────────────────────────────────────
// CREATE BOOKING — with double-booking prevention
// Re-checks for conflicts right before INSERT to handle race conditions.
// ─────────────────────────────────────────────

export async function createBooking(data: {
  userId: string;
  eventTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  startTime: string;
  endTime: string;
}) {
  const start = new Date(data.startTime);
  const end   = new Date(data.endTime);

  const conflict = await prisma.booking.findFirst({
    where: {
      userId: data.userId,
      status: STATUS_ACTIVE,
      AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
    },
  });

  if (conflict) throw new Error("SLOT_CONFLICT: This time slot is no longer available.");

  return prisma.booking.create({
    data: {
      userId: data.userId,
      eventTypeId: data.eventTypeId,
      inviteeName: data.inviteeName,
      inviteeEmail: data.inviteeEmail,
      startTime: start,
      endTime: end,
      status: STATUS_ACTIVE,
    },
    include: { eventType: true, user: true },
  });
}

export async function getUpcomingBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId, status: STATUS_ACTIVE, startTime: { gte: new Date() } },
    include: { eventType: true },
    orderBy: { startTime: "asc" },
  });
}

export async function getPastBookings(userId: string) {
  return prisma.booking.findMany({
    where: {
      userId,
      OR: [
        { startTime: { lt: new Date() } },
        { status: STATUS_CANCELLED },
      ],
    },
    include: { eventType: true },
    orderBy: { startTime: "desc" },
  });
}

export async function cancelBooking(bookingId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: STATUS_CANCELLED },
  });
}
