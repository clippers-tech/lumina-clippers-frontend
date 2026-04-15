"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"

const allTabs = [
  { label: "Dashboard", href: "/admin/dashboard", adminOnly: false },
  { label: "Campaigns", href: "/admin/campaigns", adminOnly: true },
  { label: "Chat", href: "/admin/chat", adminOnly: true },
  { label: "Creators", href: "/admin/creators", adminOnly: true },
  { label: "Users", href: "/admin/users", adminOnly: true },
  { label: "Payment Logs", href: "/admin/payments", adminOnly: true },
  { label: "Settings", href: "/admin/settings", adminOnly: true },
]

export function AdminTabs() {
  const pathname = usePathname()
  const { isViewer } = useUser()

  const tabs = isViewer ? allTabs.filter((t) => !t.adminOnly) : allTabs

  return (
    <div className="flex gap-1 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/admin/dashboard"
            ? pathname === "/admin/dashboard"
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
