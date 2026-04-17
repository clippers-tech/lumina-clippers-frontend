"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"

const allTabs = [
  { label: "Dashboard", href: "/0x8f3a9b2c/dashboard", adminOnly: false },
  { label: "Campaigns", href: "/0x8f3a9b2c/campaigns", adminOnly: true },
  { label: "Chat", href: "/0x8f3a9b2c/chat", adminOnly: true },
  { label: "Creators", href: "/0x8f3a9b2c/creators", adminOnly: true },
  { label: "Users", href: "/0x8f3a9b2c/users", adminOnly: true },
  { label: "Payment Logs", href: "/0x8f3a9b2c/payments", adminOnly: true },
  { label: "Settings", href: "/0x8f3a9b2c/settings", adminOnly: true },
]

export function AdminTabs() {
  const pathname = usePathname()
  const { isViewer } = useUser()

  const tabs = isViewer ? allTabs.filter((t) => !t.adminOnly) : allTabs

  return (
    <div className="flex gap-1 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/0x8f3a9b2c/dashboard"
            ? pathname === "/0x8f3a9b2c/dashboard"
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
