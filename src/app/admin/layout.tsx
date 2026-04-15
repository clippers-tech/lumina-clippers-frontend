"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { getToken, clearToken } from "@/lib/auth"
import { auth } from "@/lib/api"
import { LayoutDashboard, LogOut } from "lucide-react"
import { UserProvider, type AppUser } from "@/lib/user-context"
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground"
import { LuminaLogo } from "@/components/LuminaLogo"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isLoginPage = pathname === "/admin" || pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    const token = getToken()
    if (!token) {
      router.push("/admin")
      return
    }

    auth.me(token)
      .then(setUser)
      .catch(() => {
        clearToken()
        router.push("/admin")
      })
      .finally(() => setLoading(false))
  }, [isLoginPage, router])

  if (isLoginPage) return <AtmosphericBackground>{children}</AtmosphericBackground>

  if (loading) {
    return (
      <AtmosphericBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AtmosphericBackground>
    )
  }

  return (
    <UserProvider user={user}>
      <AtmosphericBackground>
        <div className="min-h-screen">
          {/* Top navbar */}
          <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center gap-6">
                  <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <LuminaLogo size={28} />
                    <span className="font-bold text-sm uppercase tracking-wider text-zinc-100">Lumina Clippers</span>
                  </Link>
                  <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  {user && (
                    <span className="text-sm text-zinc-500">
                      {user.name}
                      {user.role === "viewer" && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-lime-400/60 bg-lime-400/10 px-1.5 py-0.5 rounded">
                          Viewer
                        </span>
                      )}
                    </span>
                  )}
                  <button
                    onClick={() => { clearToken(); router.push("/admin") }}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </AtmosphericBackground>
    </UserProvider>
  )
}
