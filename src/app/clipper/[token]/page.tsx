"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LegacyClipperTokenRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/viral")
  }, [router])

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-zinc-500">Redirecting...</p>
      </div>
    </div>
  )
}
