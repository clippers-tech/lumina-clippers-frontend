"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { label: "Dashboard", href: "/cx0-auth-8f3a/dashboard" },
  { label: "Campaigns", href: "/cx0-auth-8f3a/campaigns" },
]

export function ClientTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/cx0-auth-8f3a/dashboard"
            ? pathname === "/cx0-auth-8f3a/dashboard"
            : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
              isActive
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400 rounded-t-full" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
