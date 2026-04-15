"use client"

import { verificationStatusLabel, verificationStatusColor } from "@/lib/utils"

export function VerificationBadge({ status }: { status: string | null | undefined }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-white/[0.015] ${verificationStatusColor(status)}`}
    >
      {verificationStatusLabel(status)}
    </span>
  )
}
