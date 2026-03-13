// components/dashboard/EventTypeModal.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventType {
  id: string;
  name: string;
  slug: string;
  duration: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: EventType | null;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function EventTypeModal({ open, onClose, onSaved, editing }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState(30);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSlug(editing.slug);
      setDuration(editing.duration);
      setSlugManuallyEdited(true);
    } else {
      setName("");
      setSlug("");
      setDuration(30);
      setSlugManuallyEdited(false);
    }
    setError("");
  }, [editing, open]);

  // Auto-generate slug from name unless user has manually edited it
  function handleNameChange(val: string) {
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(
        val
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setLoading(true);
    try {
      const url = editing
        ? `/api/event-types/${editing.id}`
        : "/api/event-types";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), duration }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit event type" : "Create new event type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="et-name">Event name</Label>
            <Input
              id="et-name"
              placeholder="e.g. 30 Minute Meeting"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="et-slug">URL slug</Label>
            <div className="flex items-center rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
              <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-300 whitespace-nowrap">
                /charvi/
              </span>
              <input
                id="et-slug"
                className="flex-1 px-3 py-2 text-sm outline-none bg-white"
                placeholder="30-min-meeting"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    duration === d
                      ? "border-[#006BFF] bg-blue-50 text-[#006BFF]"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : editing ? "Save changes" : "Create event type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
