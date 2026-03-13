"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  MoreVertical,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  Copy
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventTypeModal } from "@/components/dashboard/EventTypeModal";
import { CreateEventDropdown } from "@/components/dashboard/CreateEventDropdown";
import Link from "next/link";

interface EventType {
  id: string;
  name: string;
  slug: string;
  duration: number;
  isActive: boolean;
}

export default function SchedulingPage() {

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {

    setLoading(true);

    const res = await fetch("/api/event-types");
    const data = await res.json();

    setEventTypes(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {

    const handler = (e: MouseEvent) => {

      const target = e.target as HTMLElement;

      if (!target.closest(".menu-container")) {
        setMenuOpen(null);
      }

    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);

  }, []);

  function copyLink(slug: string, id: string) {

    const url = `${window.location.origin}/charvi/${slug}`;

    navigator.clipboard.writeText(url);

    setCopiedId(id);

    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(id: string) {

    await fetch(`/api/event-types/${id}`, {
      method: "DELETE"
    });

    setDeleteConfirm(null);
    setMenuOpen(null);

    load();
  }

  async function handleToggleActive(et: EventType) {

    await fetch(`/api/event-types/${et.id}`, {

      method: "PATCH",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        isActive: !et.isActive
      })

    });

    load();
  }

  const filtered = eventTypes.filter((et) =>
    et.name.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="max-w-4xl h-[calc(100vh-80px)] overflow-y-auto pr-2">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Scheduling
          <span
            className="text-gray-400 text-base font-normal cursor-help"
            title="Manage your event types"
          >
            ⓘ
          </span>
        </h1>

        <CreateEventDropdown
          onSelectOneOnOne={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />

      </div>

      {/* Tabs */}

      <div className="flex gap-6 border-b border-gray-200 mb-6">

        <button className="pb-3 text-sm font-semibold text-[#006BFF] border-b-2 border-[#006BFF] -mb-px">
          Event types
        </button>

        <button className="pb-3 text-sm text-gray-500 hover:text-gray-700">
          Single-use links
        </button>

        <button className="pb-3 text-sm text-gray-500 hover:text-gray-700">
          Meeting polls
        </button>

      </div>

      {/* Search */}

      <div className="relative mb-5">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        <input
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          placeholder="Search event types"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* User header */}

      <div className="flex items-center justify-between py-3 px-1 mb-2">

        <div className="flex items-center gap-2">

          <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
            C
          </div>

          <span className="text-sm font-semibold text-gray-800">
            Charvi Singh
          </span>

        </div>

        <Link
          href={`/charvi`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-[#006BFF] hover:underline font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View landing page
        </Link>

      </div>

      {/* Event cards */}

      {loading ? (

        <div className="space-y-3">

          {[1, 2].map((i) => (

            <div
              key={i}
              className="h-20 bg-white rounded-lg border border-gray-200 animate-pulse"
            />

          ))}

        </div>

      ) : (

        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">

          {filtered.map((et) => (

            <div
              key={et.id}
              className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors group relative"
            >

              <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#6366f1] rounded-r-full" />

              <div className="flex-1 min-w-0 pl-3">

                <div className="flex items-center gap-2 mb-0.5">

                  <h3 className="font-semibold text-gray-900 text-sm">
                    {et.name}
                  </h3>

                  {!et.isActive && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Off
                    </span>
                  )}

                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">

                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {et.duration} min
                  </span>

                  <span>•</span>
                  <span>Google Meet</span>
                  <span>•</span>
                  <span>One-on-One</span>

                </div>

              </div>

              {/* Actions */}

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                <button
                  onClick={() => copyLink(et.slug, et.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === et.id ? "Copied!" : "Copy Link"}
                </button>

                <div className="relative menu-container">

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === et.id ? null : et.id);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen === et.id && (

                    <div
                      className="absolute right-0 top-9 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                      onClick={(e) => e.stopPropagation()}
                    >

                      <button
                        onClick={() => window.open(`/charvi/${et.slug}`, "_blank")}
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View booking page
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => {
                          setEditing(et);
                          setModalOpen(true);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleActive(et)}
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        {et.isActive ? "Turn off" : "Turn on"}
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => {
                          setDeleteConfirm(et.id);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>

                    </div>

                  )}

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* Delete Modal */}

      {deleteConfirm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete event type?
            </h3>

            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete this event type and all associated bookings.
              This cannot be undone.
            </p>

            <div className="flex justify-end gap-3">

              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </Button>

            </div>

          </div>

        </div>

      )}

      <EventTypeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={load}
        editing={editing}
      />

    </div>

  );
}