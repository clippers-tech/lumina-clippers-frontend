"use client"

import { Inbox } from "lucide-react"

export function EmptyState({ message = "No data found" }: { message?: string }) {
  return (
    <div className="text-center py-16">
      <Inbox className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
      <p className="text-zinc-400">{message}</p>
    </div>
  )
}
