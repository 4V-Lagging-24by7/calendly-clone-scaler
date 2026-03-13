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

  // Helper: find the next weekday from a given date (skips Sat/Sun)
  function nextWeekday(date: Date, daysAhead: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + daysAhead);
    // Advance past Saturday (6) or Sunday (0)
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  // Create 3 sample bookings
  const now = new Date();

  // Future booking 1: next weekday, 10:00am server-local time
  const upcoming1 = nextWeekday(now, 1);
  upcoming1.setHours(10, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: thirtyMin.id,
      inviteeName: "Alex Johnson",
      inviteeEmail: "alex@example.com",
      startTime: upcoming1,
      endTime: new Date(upcoming1.getTime() + 30 * 60 * 1000),
      status: BookingStatus.ACTIVE,
    },
  });

  // Future booking 2: weekday after that, 2:00pm
  const upcoming2 = nextWeekday(now, 3);
  upcoming2.setHours(14, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: sixtyMin.id,
      inviteeName: "Priya Patel",
      inviteeEmail: "priya@example.com",
      startTime: upcoming2,
      endTime: new Date(upcoming2.getTime() + 60 * 60 * 1000),
      status: BookingStatus.ACTIVE,
    },
  });

  // Past booking: 3 days ago at 11:00am
  const past1 = new Date(now);
  past1.setDate(past1.getDate() - 3);
  past1.setHours(11, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: thirtyMin.id,
      inviteeName: "Sam Rivera",
      inviteeEmail: "sam@example.com",
      startTime: past1,
      endTime: new Date(past1.getTime() + 30 * 60 * 1000),
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
