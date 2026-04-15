import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export function platformIcon(platform: string): string {
  const icons: Record<string, string> = {
    tiktok: "🎵",
    instagram: "📸",
    youtube: "▶️",
    twitter: "𝕏",
  }
  return icons[platform] || "🔗"
}

// ── Geo Stats ────────────────────────────────────────

export type GeoStat = { code: string; name: string; flag: string; pct: number; views: number }

const US_EUROPE = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
]

const REST_OF_WORLD = [
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
]

function seededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateGeoStats(
  submissionId: number,
  totalViews: number,
  usViewersPct: number = 90,
  ukViewersPct: number | null = null,
): GeoStat[] {
  const rng = seededRandom(submissionId * 7919)
  const includeUk = ukViewersPct != null && ukViewersPct > 0

  const primaryTarget = includeUk ? usViewersPct + ukViewersPct : usViewersPct

  const isOutlier = rng() < 0.3
  let rawPrimaryPct: number
  if (isOutlier) {
    rawPrimaryPct = 15 + rng() * 80
  } else {
    rawPrimaryPct = primaryTarget - 20 + rng() * 40
  }
  const primaryPct = Math.max(10, Math.min(98, rawPrimaryPct))

  let usPct: number
  let ukPct: number
  if (includeUk) {
    const targetRatio = usViewersPct / primaryTarget
    const jitteredRatio = Math.max(0.15, Math.min(0.85, targetRatio - 0.15 + rng() * 0.30))
    usPct = primaryPct * jitteredRatio
    ukPct = primaryPct - usPct
  } else {
    usPct = primaryPct
    ukPct = 0
  }

  const euroPool = includeUk
    ? [...US_EUROPE.filter(c => c.code !== "US" && c.code !== "GB")]
    : [...US_EUROPE.slice(1)]
  const euroCount = 3 + Math.floor(rng() * 2)
  const euros: typeof euroPool = []
  for (let i = 0; i < euroCount && euroPool.length > 0; i++) {
    const idx = Math.floor(rng() * euroPool.length)
    euros.push(euroPool.splice(idx, 1)[0])
  }

  const remainingPct = 100 - primaryPct
  const euroPctTotal = remainingPct * 0.85
  let euroWeights = euros.map(() => rng())
  const ewSum = euroWeights.reduce((a, b) => a + b, 0)
  euroWeights = euroWeights.map((w) => (w / ewSum) * euroPctTotal)

  const rowPool = [...REST_OF_WORLD]
  const rowCount = 2 + Math.floor(rng() * 2)
  const rows: typeof rowPool = []
  for (let i = 0; i < rowCount && rowPool.length > 0; i++) {
    const idx = Math.floor(rng() * rowPool.length)
    rows.push(rowPool.splice(idx, 1)[0])
  }

  const rowPctTotal = remainingPct * 0.15
  let rowWeights = rows.map(() => rng())
  const rwSum = rowWeights.reduce((a, b) => a + b, 0)
  rowWeights = rowWeights.map((w) => (w / rwSum) * rowPctTotal)

  const result: GeoStat[] = []

  const usRound = Math.round(usPct * 10) / 10
  result.push({ ...US_EUROPE[0], pct: usRound, views: Math.round(totalViews * usRound / 100) })

  if (includeUk) {
    const ukRound = Math.round(ukPct * 10) / 10
    result.push({ code: "GB", name: "United Kingdom", flag: "🇬🇧", pct: ukRound, views: Math.round(totalViews * ukRound / 100) })
  }

  euros.forEach((c, i) => {
    const p = Math.round(euroWeights[i] * 10) / 10
    result.push({ ...c, pct: p, views: Math.round(totalViews * p / 100) })
  })

  rows.forEach((c, i) => {
    const p = Math.round(rowWeights[i] * 10) / 10
    result.push({ ...c, pct: p, views: Math.round(totalViews * p / 100) })
  })

  result.sort((a, b) => b.pct - a.pct)
  return result
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400",
    open: "bg-emerald-500/20 text-emerald-400",
    closed: "bg-red-500/20 text-red-400",
    archived: "bg-gray-600/20 text-gray-500",
    awaiting_stats: "bg-yellow-500/20 text-yellow-400",
    stats_verified: "bg-blue-500/20 text-blue-400",
    paid: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-red-500/20 text-red-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    success: "bg-emerald-500/20 text-emerald-400",
    failed: "bg-red-500/20 text-red-400",
    manual: "bg-orange-500/20 text-orange-400",
    uploaded: "bg-amber-500/20 text-amber-400",
    verified: "bg-emerald-500/20 text-emerald-400",
  }
  return colors[status] || "bg-gray-500/20 text-gray-400"
}

export function verificationStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    pending: "No Video",
    uploaded: "Pending Review",
    verified: "Verified",
    rejected: "Rejected",
  }
  return labels[status || "pending"] || "No Video"
}

export function verificationStatusColor(status: string | null | undefined): string {
  const colors: Record<string, string> = {
    pending: "border-zinc-500/30 text-zinc-500",
    uploaded: "border-amber-400/30 text-amber-400",
    verified: "border-emerald-400/30 text-emerald-400",
    rejected: "border-red-400/30 text-red-400",
  }
  return colors[status || "pending"] || "border-zinc-500/30 text-zinc-500"
}
