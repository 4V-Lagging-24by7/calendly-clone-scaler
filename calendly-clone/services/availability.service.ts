// services/availability.service.ts
import { prisma } from "@/lib/prisma";

export async function getAvailabilityByUser(userId: string) {
  return prisma.availability.findMany({
    where: { userId },
    orderBy: { dayOfWeek: "asc" },
  });
}

// Replace all availability for a user (upsert pattern)
export async function saveAvailability(
  userId: string,
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  }>
) {
  // Delete existing and re-create (simple replace pattern)
  await prisma.availability.deleteMany({ where: { userId } });

  if (slots.length === 0) return [];

  return prisma.availability.createMany({
    data: slots.map((slot) => ({ ...slot, userId })),
  });
}
