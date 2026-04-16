"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
import { LuminaLogo } from "@/components/LuminaLogo"

export function ClipperNav() {
  const pathname = usePathname()
  const isSettings = pathname === "/clipper/settings"

  return (
    <nav className="border-b border-white/[0.06] bg-[#0b2518]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/clipper/dashboard" className="flex items-center gap-2">
          <LuminaLogo size={24} />
          <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Lumina Clippers</span>
        </Link>

        <Link
          href="/clipper/settings"
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            isSettings
              ? "bg-green-400/10 text-green-400"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </Link>
      </div>
    </nav>
  )
}
