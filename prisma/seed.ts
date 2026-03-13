// prisma/seed.ts
import { PrismaClient, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.user.deleteMany();

  // Create default user
  const user = await prisma.user.create({
    data: {
      name: "Charvi Singh",
      username: "charvi",
      email: "charvi@example.com",
      timezone: "America/New_York",
    },
  });
  console.log(`✅ Created user: ${user.name} (@${user.username})`);

  // Create event types
  const thirtyMin = await prisma.eventType.create({
    data: {
      userId: user.id,
      name: "30 Minute Meeting",
      slug: "30-min-meeting",
      duration: 30,
      isActive: true,
    },
  });

  const sixtyMin = await prisma.eventType.create({
    data: {
      userId: user.id,
      name: "60 Minute Meeting",
      slug: "60-min-meeting",
      duration: 60,
      isActive: true,
    },
  });
  console.log(`✅ Created event types: ${thirtyMin.name}, ${sixtyMin.name}`);

  // Create availability: Monday–Friday, 9am–5pm
  const weekdays = [1, 2, 3, 4, 5]; // Mon=1 ... Fri=5
  for (const day of weekdays) {
    await prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/New_York",
      },
    });
  }
  console.log("✅ Created availability: Monday–Friday 9am–5pm");

  // Create 3 sample bookings
  const now = new Date();

  // Future booking 1: Tomorrow 10:00am
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 10am ET = 14:00 UTC (approx)

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: thirtyMin.id,
      inviteeName: "Alex Johnson",
      inviteeEmail: "alex@example.com",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
      status: BookingStatus.ACTIVE,
    },
  });

  // Future booking 2: Day after tomorrow 2:00pm
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(18, 0, 0, 0); // 2pm ET = 18:00 UTC (approx)

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: sixtyMin.id,
      inviteeName: "Priya Patel",
      inviteeEmail: "priya@example.com",
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 60 * 60 * 1000),
      status: BookingStatus.ACTIVE,
    },
  });

  // Past booking: 3 days ago
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(15, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: thirtyMin.id,
      inviteeName: "Sam Rivera",
      inviteeEmail: "sam@example.com",
      startTime: threeDaysAgo,
      endTime: new Date(threeDaysAgo.getTime() + 30 * 60 * 1000),
      status: BookingStatus.ACTIVE,
    },
  });

  console.log("✅ Created 3 sample bookings (2 upcoming, 1 past)");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
