# Calendly Clone

A full-stack scheduling web application built with Next.js, PostgreSQL, and Prisma — closely replicating Calendly's UI and core booking experience.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18 |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Styling** | Tailwind CSS |
| **UI Components** | Radix UI primitives + custom components |
| **Icons** | lucide-react |
| **Date handling** | date-fns |
| **Deployment** | Vercel |

---

## Architecture

The project follows a clean **layered architecture** with clear separation of concerns:

```
/
├── app/                        # Next.js App Router pages
│   ├── dashboard/
│   │   ├── scheduling/         # Event type management (admin)
│   │   ├── availability/       # Weekly schedule settings (admin)
│   │   └── meetings/           # Upcoming & past meetings (admin)
│   ├── [username]/[eventSlug]/ # Public booking page
│   └── api/                    # API route handlers
│       ├── event-types/        # CRUD for event types
│       ├── availability/       # Save/load availability
│       ├── slots/              # Generate available time slots
│       ├── bookings/           # Create bookings + list
│       └── users/              # Fetch user + event types
├── components/
│   ├── dashboard/              # Dashboard layout components
│   ├── booking/                # Booking flow components
│   └── ui/                     # Reusable primitives (Button, Input, etc.)
├── services/                   # Business logic layer
│   ├── eventType.service.ts    # Event type operations
│   ├── availability.service.ts # Availability operations
│   └── booking.service.ts      # Slot generation + booking creation
├── lib/
│   ├── prisma.ts               # Prisma singleton client
│   └── utils.ts                # Shared utilities (cn, formatters)
└── prisma/
    ├── schema.prisma           # Database schema
    └── seed.ts                 # Sample data
```

**Key architectural decisions:**

- **Services layer** — All business logic lives in `/services`, never in components or API routes directly. API routes are thin: validate input → call service → return response.
- **Prisma singleton** — A single `PrismaClient` instance is cached on `globalThis` to prevent connection pool exhaustion during Next.js hot reloads.
- **Default user** — No authentication. A single default user is seeded and used for all admin operations.

---

## Database Schema

```
User
├── id          cuid (PK)
├── name        String
├── username    String  @unique   ← used in public URLs: /charvi/30-min-meeting
├── email       String  @unique
└── timezone    String

EventType
├── id          cuid (PK)
├── userId      FK → User
├── name        String
├── slug        String            ← URL slug (e.g. "30-min-meeting")
├── duration    Int               ← in minutes
├── isActive    Boolean
└── @@unique([userId, slug])      ← prevents duplicate slugs per user

Availability
├── id          cuid (PK)
├── userId      FK → User
├── dayOfWeek   Int               ← 0=Sun, 1=Mon, ..., 6=Sat
├── startTime   String            ← "09:00" (24-hour)
├── endTime     String            ← "17:00"
└── timezone    String

Booking
├── id            cuid (PK)
├── userId        FK → User
├── eventTypeId   FK → EventType
├── inviteeName   String
├── inviteeEmail  String
├── startTime     DateTime        ← UTC
├── endTime       DateTime        ← UTC (startTime + duration)
├── status        ACTIVE | CANCELLED
└── @@index([userId, startTime])  ← fast conflict detection
```

---

## Slot Generation Algorithm

Located in `services/booking.service.ts` — `getAvailableSlots()`:

1. **Find availability rule** for the selected day of week (e.g., Mon → 9am–5pm)
2. **Generate candidate slots** by stepping through the window in `duration`-minute increments
3. **Fetch existing bookings** for the user on that date (status = ACTIVE)
4. **Filter conflicts** using: `slotStart < bookingEnd && slotEnd > bookingStart`
   - This single condition catches all overlap cases (partial, full, contained)
5. **Filter past slots** — remove any slot whose start time is in the past
6. Return clean list of available `{ start, end }` pairs

**Double-booking prevention:** Before inserting a new booking, `createBooking()` re-queries the database for conflicts using the same overlap condition. If a conflict exists, it throws `SLOT_CONFLICT` which the API returns as a `409 Conflict`.

---

## Pages

| Route | Description |
|---|---|
| `/` | Redirects to `/dashboard/scheduling` |
| `/dashboard/scheduling` | Admin: list, create, edit, delete event types |
| `/dashboard/availability` | Admin: set weekly working hours |
| `/dashboard/meetings` | Admin: view upcoming/past meetings, cancel |
| `/[username]/[eventSlug]` | Public: book a meeting (calendar → slots → form → confirm) |

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted e.g. Supabase, Neon, Railway)

### 1. Clone and install

```bash
git clone <repo-url>
cd calendly-clone
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable: `DATABASE_URL` (use a hosted PostgreSQL like [Neon](https://neon.tech) or [Supabase](https://supabase.com))
4. Deploy

After deploy, run the seed remotely or via Prisma Studio.

---

## Seed Data

The seed creates:
- **1 user**: Charvi Singh (`@charvi`)
- **2 event types**: 30 Minute Meeting, 60 Minute Meeting
- **Availability**: Monday–Friday, 9:00 AM – 5:00 PM
- **3 bookings**: 2 upcoming, 1 past

---

## Sample URLs

After seeding, visit:
- Admin dashboard: [http://localhost:3000/dashboard/scheduling](http://localhost:3000/dashboard/scheduling)
- Public booking: [http://localhost:3000/charvi/30-min-meeting](http://localhost:3000/charvi/30-min-meeting)
