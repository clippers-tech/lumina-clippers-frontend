"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/0x8f3a9b2c")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
