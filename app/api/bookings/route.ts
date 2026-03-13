import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/services/booking.service";
import { prisma } from "@/lib/prisma";

// GET /api/bookings
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        eventType: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, eventTypeId, inviteeName, inviteeEmail, startTime, endTime } = body;

    if (!username || !eventTypeId || !inviteeName || !inviteeEmail || !startTime || !endTime) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

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