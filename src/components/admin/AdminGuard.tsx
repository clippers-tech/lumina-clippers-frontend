"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isViewer } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isViewer) {
      router.replace("/admin")
    }
  }, [isViewer, router])

  if (isViewer) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
