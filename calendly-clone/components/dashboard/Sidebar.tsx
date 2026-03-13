// components/dashboard/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Link2,
  Calendar,
  Clock,
  Users,
  Workflow,
  AppWindow,
  GitBranch,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Scheduling", href: "/dashboard/scheduling", icon: Link2 },
  { label: "Meetings", href: "/dashboard/meetings", icon: Calendar },
  { label: "Availability", href: "/dashboard/availability", icon: Clock },
  { label: "Contacts", href: "#", icon: Users, disabled: true },
  { label: "Workflows", href: "#", icon: Workflow, disabled: true },
  { label: "Integrations & apps", href: "#", icon: AppWindow, disabled: true },
  { label: "Routing", href: "#", icon: GitBranch, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-[#006BFF] flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <span className="text-[#006BFF] font-bold text-xl tracking-tight">Calendly</span>
      </div>

      {/* Create button */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/dashboard/scheduling"
          className="flex items-center justify-center gap-2 w-full border-2 border-gray-300 rounded-full py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>Create</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 pt-2">
        {navItems.map(({ label, href, icon: Icon, disabled }) => {
          const isActive = !disabled && pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors",
                isActive
                  ? "bg-blue-50 text-[#006BFF]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                disabled && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade plan */}
      <div className="px-2 pb-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
          <CircleDollarSign className="w-4 h-4 flex-shrink-0" />
          <span>Upgrade plan</span>
        </div>
      </div>
    </aside>
  );
}
