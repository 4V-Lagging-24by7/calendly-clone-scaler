# Calendly Clone

This project is a clone of Calendly built as part of the SDE assignment for Scaler.

All the functionalities mentioned in the assignment requirements are fully implemented and working.

Since this is a UI clone of Calendly, some extra buttons and UI elements are also replicated to match the original interface. However, a few of those buttons do not have functionality because they were not part of the required features.



## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| Icons | lucide-react |
| Date Handling | date-fns |
| Deployment | Vercel |



## Project Structure

```
/
├── app/
│   ├── dashboard/
│   │   ├── scheduling/
│   │   ├── availability/
│   │   └── meetings/
│   ├── [username]/[eventSlug]/
│   └── api/
├── components/
│   ├── dashboard/
│   ├── booking/
│   └── ui/
├── services/
├── lib/
└── prisma/
```

Main folders:

- **app/** – Pages and routes
- **components/** – Reusable UI components
- **services/** – Business logic
- **lib/** – Utilities and helpers
- **prisma/** – Database schema and seed data



## Main Features

### Event Type Management

- Create event types with name, duration, and slug
- Edit event types
- Delete event types
- View all event types on the dashboard



### Availability Settings

- Set weekly working hours
- Availability stored per day of the week
- Used to generate available booking slots



### Booking Flow

Public booking page:

1. User opens booking link
2. Selects a date from the calendar
3. Chooses an available time slot
4. Enters name and email
5. Booking is confirmed

The system prevents double bookings by checking time conflicts before creating a booking.



## Pages

| Route | Description |
|---|---|
| `/` | Redirects to dashboard |
| `/dashboard/scheduling` | Manage event types |
| `/dashboard/availability` | Set weekly availability |
| `/dashboard/meetings` | View upcoming and past meetings |
| `/[username]/[eventSlug]` | Public booking page |

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd calendly-clone
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env.local` file:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```



### 4. Set up the database

Generate Prisma client:

```bash
npm run db:generate
```

Push schema:

```bash
npm run db:push
```

Seed sample data:

```bash
npm run db:seed
```



### 5. Run the project

```bash
npm run dev
```

Open:

```
http://localhost:3000
```



## Deployment

The project is deployed using Vercel.<br>
Check it out: https://calendly-clone-scaler-7j51.vercel.app/

Steps:

1. Push the repository to GitHub
2. Import the project in Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy



## Seed Data

The seed creates:

- 1 user (Charvi)
- 2 event types (30 min and 60 min meetings)
- Monday–Friday availability
- Sample bookings

