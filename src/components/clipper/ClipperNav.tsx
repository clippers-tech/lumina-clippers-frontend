"use client"

import Link from "next/link"
import { Zap } from "lucide-react"

export function ClipperNav() {
  return (
    <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-lime-400" />
          <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Lumina Clippers</span>
        </Link>
      </div>
    </nav>
  )
}
