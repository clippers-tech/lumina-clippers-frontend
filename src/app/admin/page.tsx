"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/api"
import { setToken } from "@/lib/auth"
import { LuminaLogo } from "@/components/LuminaLogo"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await auth.login(email, password)
      setToken(res.access_token)
      router.push("/admin/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mx-auto mb-4">
            <LuminaLogo size={48} />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Lumina Clippers</h1>
          <p className="text-sm text-zinc-500 mt-1">Campaign Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lumina.io"
              required
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-lime-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
