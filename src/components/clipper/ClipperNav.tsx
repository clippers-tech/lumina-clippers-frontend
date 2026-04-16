"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Settings, LogOut, MessageSquare } from "lucide-react"
import { LuminaLogo } from "@/components/LuminaLogo"
import { clearClipperToken } from "@/lib/clipper-auth"

export function ClipperNav({ chatToken }: { chatToken?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const isSettings = pathname === "/clipper/settings"

  return (
    <nav className="border-b border-white/[0.06] bg-[#0b2518]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/clipper/dashboard" className="flex items-center gap-2">
            <LuminaLogo size={24} />
            <span className="font-bold text-sm uppercase tracking-wider text-zinc-100 hidden sm:inline">Lumina Clippers</span>
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-100 sm:hidden">Clippers</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {chatToken && (
              <Link
                href={`/chat/${chatToken}`}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Messages</span>
              </Link>
            )}
            <Link
              href="/clipper/settings"
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                isSettings
                  ? "bg-green-400/10 text-green-400"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              onClick={() => { clearClipperToken(); router.push("/viral") }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors p-1.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
