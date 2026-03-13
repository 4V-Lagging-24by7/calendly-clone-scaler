// app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAvailabilityByUser, saveAvailability } from "@/services/availability.service";
import { prisma } from "@/lib/prisma";

// GET /api/availability
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const availability = await getAvailabilityByUser(user.id);
    return NextResponse.json(availability);
  } catch {
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

// POST /api/availability — replace all availability slots
export async function POST(req: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 400 });
    }

    await saveAvailability(user.id, slots);
    const updated = await getAvailabilityByUser(user.id);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
  }
}
