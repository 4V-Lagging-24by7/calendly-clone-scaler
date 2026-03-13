// components/dashboard/CreateEventDropdown.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Plus, ChevronUp, ArrowRight } from "lucide-react";

interface EventTypeOption {
  key: string;
  title: string;
  hostLine: string;
  description: string;
  enabled: boolean;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  {
    key: "one-on-one",
    title: "One-on-one",
    hostLine: "1 host → 1 invitee",
    description: "Good for coffee chats, 1:1 interviews, etc.",
    enabled: true,
  },
  {
    key: "group",
    title: "Group",
    hostLine: "1 host → Multiple invitees",
    description: "Webinars, online classes, etc.",
    enabled: false,
  },
  {
    key: "round-robin",
    title: "Round robin",
    hostLine: "Rotating hosts → 1 invitee",
    description: "Distribute meetings between team members",
    enabled: false,
  },
  {
    key: "collective",
    title: "Collective",
    hostLine: "Multiple hosts → 1 invitee",
    description: "Panel interviews, group sales calls, etc.",
    enabled: false,
  },
];

interface Props {
  onSelectOneOnOne: () => void;
}

export function CreateEventDropdown({ onSelectOneOnOne }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOptionClick(option: EventTypeOption) {
    if (!option.enabled) return;
    setOpen(false);
    onSelectOneOnOne();
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-[#006BFF] hover:bg-[#0056d6] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <Plus className="w-4 h-4" />
        Create
        <ChevronUp
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-0" : "rotate-180"}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Event type
            </p>
          </div>

          {/* Options */}
          <div className="px-2 pb-3">
            {EVENT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleOptionClick(option)}
                disabled={!option.enabled}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors group ${
                  option.enabled
                    ? "hover:bg-blue-50 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <p
                  className={`text-sm font-semibold mb-0.5 ${
                    option.enabled ? "text-[#006BFF]" : "text-gray-500"
                  }`}
                >
                  {option.title}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-0.5">
                  {option.hostLine.split("→").map((part, i, arr) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span>{part.trim()}</span>
                      {i < arr.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
