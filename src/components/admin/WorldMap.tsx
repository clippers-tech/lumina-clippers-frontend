"use client"

import { COUNTRY_PATHS as countryPaths } from "./countryPaths"
import type { GeoStat } from "@/lib/utils"

interface WorldMapProps {
  geoStats: GeoStat[]
}

export function WorldMap({ geoStats }: WorldMapProps) {
  const highlightCodes = new Set(geoStats.map((g) => g.code))

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
        Viewer Distribution
      </p>
      <svg viewBox="0 0 2000 1001" className="w-full h-auto">
        {Object.entries(countryPaths).map(([code, d]) => (
          <path
            key={code}
            d={d}
            fill={highlightCodes.has(code) ? "#A3E635" : "#27272a"}
            fillOpacity={highlightCodes.has(code) ? 0.6 : 0.3}
            stroke="#3f3f46"
            strokeWidth={0.5}
          />
        ))}
      </svg>
      <div className="mt-3 space-y-1.5">
        {geoStats.slice(0, 5).map((g) => (
          <div key={g.code} className="flex items-center justify-between text-xs">
            <span className="text-zinc-300">{g.flag} {g.name}</span>
            <span className="text-zinc-400 font-mono">{g.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
