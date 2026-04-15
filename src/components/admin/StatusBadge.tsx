"use client"

import { statusColor } from "@/lib/utils"

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(status)}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}
