// app/api/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/services/booking.service";
import { prisma } from "@/lib/prisma";

// GET /api/slots?username=charvi&eventTypeId=xxx&date=2024-01-15
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const eventTypeId = searchParams.get("eventTypeId");
    const date = searchParams.get("date");

    if (!username || !eventTypeId || !date) {
      return NextResponse.json(
        { error: "username, eventTypeId, and date are required" },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const slots = await getAvailableSlots(user.id, eventTypeId, date);
    return NextResponse.json(slots);
  } catch {
    return NextResponse.json({ error: "Failed to generate slots" }, { status: 500 });
  }
}
