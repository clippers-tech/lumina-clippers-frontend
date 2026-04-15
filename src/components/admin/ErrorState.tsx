"use client"

import { AlertTriangle } from "lucide-react"

export function ErrorState({ message = "Something went wrong" }: { message?: string }) {
  return (
    <div className="text-center py-16">
      <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-400">{message}</p>
    </div>
  )
}
