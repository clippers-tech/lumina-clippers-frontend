"use client"

import { useUser } from "@/lib/user-context"

export function DashboardHeader() {
  const { user } = useUser()

  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
        Operations Terminal
      </p>
      <h1 className="text-2xl font-bold text-zinc-100">
        Welcome back{user ? `, ${user.name}` : ""}
      </h1>
      <p className="text-sm text-zinc-400 mt-1">
        Monitor campaigns, track submissions, and manage your clippers network.
      </p>
    </div>
  )
}
