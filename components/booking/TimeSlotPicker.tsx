// components/booking/TimeSlotPicker.tsx
"use client";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Slot {
  start: string;
  end: string;
}

interface Props {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  loading: boolean;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No available times on this date.
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
        return (
          <button
            key={slot.start}
            onClick={() => onSelect(slot)}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
              isSelected
                ? "bg-[#006BFF] text-white border-[#006BFF]"
                : "border-[#006BFF] text-[#006BFF] hover:bg-blue-50 bg-white"
            )}
          >
            {format(parseISO(slot.start), "h:mm a")}
          </button>
        );
      })}
    </div>
  );
}
