"use client"

export function AtmosphericBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden text-zinc-100 selection:bg-lime-500/30">
      {/* Layer 1: Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -top-40 right-[-20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-[-10%] w-[800px] h-[400px] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Layer 2: Technical mesh grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Layer 3: Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
