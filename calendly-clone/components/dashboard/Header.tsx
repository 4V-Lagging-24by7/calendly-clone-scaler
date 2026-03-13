// components/dashboard/Header.tsx
"use client";
import { UserPlus } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-end px-6 gap-3 sticky top-0 z-10">
      <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
        <UserPlus className="w-5 h-5" />
      </button>
      <div className="w-8 h-8 rounded-full bg-[#006BFF] flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
        C
      </div>
    </header>
  );
}
