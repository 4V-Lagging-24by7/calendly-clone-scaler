// app/api/event-types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateEventType, deleteEventType } from "@/services/eventType.service";

// PATCH /api/event-types/:id — update an event type
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await updateEventType(params.id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update event type" }, { status: 500 });
  }
}

// DELETE /api/event-types/:id — delete an event type
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteEventType(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete event type" }, { status: 500 });
  }
}
