// app/api/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/services/booking.service";

// PATCH /api/bookings/:id/cancel
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await cancelBooking(params.id);
    return NextResponse.json(booking);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
