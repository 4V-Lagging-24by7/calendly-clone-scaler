// app/api/event-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getEventTypesByUser,
  createEventType,
} from "@/services/eventType.service";
import { prisma } from "@/lib/prisma";

// GET /api/event-types — list all event types for the default user
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const eventTypes = await getEventTypesByUser(user.id);
    return NextResponse.json(eventTypes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 });
  }
}

// POST /api/event-types — create a new event type
export async function POST(req: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, slug, duration } = body;

    if (!name || !slug || !duration) {
      return NextResponse.json({ error: "name, slug, and duration are required" }, { status: 400 });
    }

    const eventType = await createEventType(user.id, { name, slug, duration: Number(duration) });
    return NextResponse.json(eventType, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A slug with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create event type" }, { status: 500 });
  }
}
