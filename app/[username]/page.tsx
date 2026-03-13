"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";

interface EventType {
  id: string;
  name: string;
  slug: string;
  duration: number;
}

export default function UserLandingPage() {

  const { username } = useParams<{ username: string }>();

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function load() {

      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();

      setEventTypes(data.eventTypes || []);
      setLoading(false);

    }

    load();

  }, [username]);

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      {/* Logo */}

      <div className="flex items-center gap-2 mb-8">

        <div className="w-8 h-8 rounded-full bg-[#006BFF] flex items-center justify-center text-white font-bold">
          C
        </div>

        <span className="text-[#006BFF] font-bold text-xl">
          Calendly
        </span>

      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-md p-6">

        <h1 className="text-xl font-bold text-gray-900 mb-6 capitalize">
          {username}'s meetings
        </h1>

        {loading ? (

          <p className="text-gray-500">Loading...</p>

        ) : (

          <div className="space-y-3">

            {/* NEW MEETING */}

            {eventTypes.length > 0 && (
  <Link
  href={`/${username}/${eventTypes[0]?.slug}?quick=true`}
  className="block border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:border-[#006BFF] hover:bg-blue-50 transition"
>
  <div className="font-semibold text-gray-900">
    New Meeting
  </div>

  <div className="text-sm text-gray-500 mt-1">
    Quickly schedule a new meeting
  </div>
</Link>
)}

            {/* EVENT TYPES */}

            {eventTypes.map((et) => (

              <Link
                key={et.id}
                href={`/${username}/${et.slug}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#006BFF] hover:bg-blue-50 transition"
              >

                <div className="font-semibold text-gray-900">
                  {et.name}
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">

                  <Clock className="w-3 h-3" />

                  {et.duration} minutes

                </div>

              </Link>

            ))}

          </div>

        )}

      </div>

    </div>

  );
}