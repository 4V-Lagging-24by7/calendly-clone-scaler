// services/eventType.service.ts
import { prisma } from "@/lib/prisma";

export async function getEventTypesByUser(userId: string) {
  return prisma.eventType.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getEventTypeBySlug(username: string, slug: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;

  return prisma.eventType.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
    include: { user: true },
  });
}

export async function createEventType(
  userId: string,
  data: { name: string; slug: string; duration: number }
) {
  // Ensure slug is URL-safe
  const slug = data.slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return prisma.eventType.create({
    data: { userId, name: data.name, slug, duration: data.duration },
  });
}

export async function updateEventType(
  id: string,
  data: { name?: string; slug?: string; duration?: number; isActive?: boolean }
) {
  if (data.slug) {
    data.slug = data.slug
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  return prisma.eventType.update({ where: { id }, data });
}

export async function deleteEventType(id: string) {
  return prisma.eventType.delete({ where: { id } });
}
