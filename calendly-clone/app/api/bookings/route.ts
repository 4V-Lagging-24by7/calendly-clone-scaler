// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createBooking, getUpcomingBookings, getPastBookings } from "@/services/booking.service";
import { prisma } from "@/lib/prisma";

// GET /api/bookings?type=upcoming|past
export async function GET(req: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const type = new URL(req.url).searchParams.get("type");
    const bookings =
      type === "past"
        ? await getPastBookings(user.id)
        : await getUpcomingBookings(user.id);

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST /api/bookings — create a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, eventTypeId, inviteeName, inviteeEmail, startTime, endTime } = body;

    if (!username || !eventTypeId || !inviteeName || !inviteeEmail || !startTime || !endTime) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const booking = await createBooking({
      userId: user.id,
      eventTypeId,
      inviteeName,
      inviteeEmail,
      startTime,
      endTime,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    if (error?.message?.startsWith("SLOT_CONFLICT")) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
