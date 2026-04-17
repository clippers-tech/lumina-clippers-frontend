"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClientDashboardRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/cx0-auth-8f3a/dashboard") }, [router])
  return (
    <div className="min-h-screen bg-[#0b2518] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
