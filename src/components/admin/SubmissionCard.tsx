"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { formatNumber, generateGeoStats } from "@/lib/utils"
import type { Submission } from "@/lib/api"
import { Eye, Heart, MessageCircle, Play, X, ExternalLink, BarChart3, Globe, Pencil, Check } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { VerificationBadge } from "./VerificationBadge"
import { WorldMap } from "./WorldMap"

interface SubmissionCardProps {
  submission: Submission
  isSelected: boolean
  onToggleSelect: (id: number) => void
  hideCheckbox?: boolean
  usViewersPct?: number
  ukViewersPct?: number | null
  includeUkViews?: boolean
  onUpdateUsViewersPct?: (id: number, pct: number) => void
  onUpdateUkViewersPct?: (id: number, pct: number) => void
  isAdmin?: boolean
}

const MIN_VIEWS_FOR_GEO = 50

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  youtube: "bg-red-600",
  tiktok: "bg-black border border-white/10",
  twitter: "bg-blue-500",
}

const platformIcons: Record<string, string> = {
  instagram: "📸",
  youtube: "▶️",
  tiktok: "🎵",
  twitter: "𝕏",
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function getTikTokId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/)
  return m ? m[1] : null
}

function getInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

function getTwitterStatusId(url: string): string | null {
  const m = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/)
  return m ? m[1] : null
}

function getThumbnail(sub: Submission): string | null {
  if (sub.thumbnail_url && sub.platform !== "instagram") return sub.thumbnail_url
  if (sub.platform === "youtube") {
    const id = getYouTubeId(sub.post_url)
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }
  return null
}

function getEmbedUrl(sub: Submission): string | null {
  if (sub.platform === "youtube") {
    const id = getYouTubeId(sub.post_url)
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
  }
  if (sub.platform === "tiktok") {
    const id = getTikTokId(sub.post_url)
    if (id) return `https://www.tiktok.com/embed/v2/${id}`
  }
  if (sub.platform === "instagram") {
    const code = getInstagramShortcode(sub.post_url)
    if (code) return `https://www.instagram.com/reel/${code}/embed/`
  }
  if (sub.platform === "twitter") {
    const id = getTwitterStatusId(sub.post_url)
    if (id) return `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark`
  }
  return null
}

export function SubmissionCard({
  submission,
  isSelected,
  onToggleSelect,
  hideCheckbox = false,
  usViewersPct,
  ukViewersPct,
  includeUkViews = false,
  onUpdateUsViewersPct,
  onUpdateUkViewersPct,
  isAdmin = false,
}: SubmissionCardProps) {
  const [showEmbed, setShowEmbed] = useState(false)
  const [showGeo, setShowGeo] = useState(false)
  const [geoView, setGeoView] = useState<"list" | "map">("list")
  const [editingPct, setEditingPct] = useState<"us" | "uk" | null>(null)
  const [pctValue, setPctValue] = useState("")
  const platformColor = platformColors[submission.platform] || "bg-zinc-600"
  const platformIcon = platformIcons[submission.platform] || "🔗"
  const thumbnail = getThumbnail(submission)
  const embedUrl = getEmbedUrl(submission)
  const hasStats = submission.views > 0 || submission.likes > 0 || submission.comments > 0
  const hasEnoughViewsForGeo = submission.views >= MIN_VIEWS_FOR_GEO

  const effectiveUsPct = submission.us_viewers_pct ?? usViewersPct ?? 90
  const effectiveUkPct = includeUkViews ? (submission.uk_viewers_pct ?? ukViewersPct ?? null) : null
  const hasUsOverride = submission.us_viewers_pct != null
  const hasUkOverride = submission.uk_viewers_pct != null

  const geoStats = useMemo(
    () => (hasEnoughViewsForGeo ? generateGeoStats(submission.id, submission.views, effectiveUsPct, effectiveUkPct) : []),
    [submission.id, submission.views, hasEnoughViewsForGeo, effectiveUsPct, effectiveUkPct]
  )

  const handleStartEdit = useCallback((which: "us" | "uk") => {
    setPctValue(which === "us" ? effectiveUsPct.toString() : (effectiveUkPct ?? 0).toString())
    setEditingPct(which)
  }, [effectiveUsPct, effectiveUkPct])

  const handleSavePct = useCallback(() => {
    const val = parseFloat(pctValue)
    if (!isNaN(val) && val >= 0 && val <= 100) {
      if (editingPct === "us" && onUpdateUsViewersPct) onUpdateUsViewersPct(submission.id, val)
      else if (editingPct === "uk" && onUpdateUkViewersPct) onUpdateUkViewersPct(submission.id, val)
    }
    setEditingPct(null)
  }, [pctValue, editingPct, submission.id, onUpdateUsViewersPct, onUpdateUkViewersPct])

  return (
    <>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-[2px] overflow-hidden group hover:border-white/[0.1] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-3 pb-0">
          <div className={`w-8 h-8 rounded-full ${platformColor} flex items-center justify-center text-sm`}>
            {platformIcon}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <StatusBadge status={submission.status} />}
            {isAdmin && <VerificationBadge status={submission.verification_status} />}
            {!hideCheckbox && (
              <button
                onClick={() => onToggleSelect(submission.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  isSelected ? "bg-green-400 border-green-400" : "border-white/[0.15] hover:border-white/[0.3]"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </button>
            )}
          </div>
        </div>

        {/* Creator info — hidden for client viewers */}
        {isAdmin && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs text-zinc-400 truncate">{submission.clipper_email}</p>
          </div>
        )}

        {/* Thumbnail / Preview */}
        <div className="px-3 py-2">
          {embedUrl ? (
            <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{
              height: submission.platform === "twitter" ? "280px"
                : submission.platform === "tiktok" ? "400px"
                : submission.platform === "youtube" ? "220px"
                : "320px"
            }}>
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${submission.platform} embed`}
                loading="lazy"
              />
            </div>
          ) : thumbnail ? (
            <button
              onClick={() => window.open(submission.post_url, "_blank")}
              className="relative w-full h-40 rounded-lg bg-white/[0.03] overflow-hidden cursor-pointer group/thumb"
            >
              <img
                src={thumbnail}
                alt="Submission thumbnail"
                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => window.open(submission.post_url, "_blank")}
              className="w-full h-40 rounded-lg bg-white/[0.03] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.05] transition-colors group/thumb"
            >
              <span className="text-3xl opacity-30">{platformIcon}</span>
              <span className="text-[10px] text-white/20 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Open post
              </span>
            </button>
          )}
        </div>

        {/* Stats row */}
        {hasStats && (
          <div className="flex items-center gap-4 px-3 pb-2">
            {submission.views > 0 && (
              <div className="flex items-center gap-1 text-zinc-500">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatNumber(submission.views)}</span>
              </div>
            )}
            {submission.likes > 0 && (
              <div className="flex items-center gap-1 text-zinc-500">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatNumber(submission.likes)}</span>
              </div>
            )}
            {submission.comments > 0 && (
              <div className="flex items-center gap-1 text-zinc-500">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatNumber(submission.comments)}</span>
              </div>
            )}
            {submission.est_earnings > 0 && (
              <div className="flex items-center gap-1 text-green-400 ml-auto">
                <span className="text-xs font-bold font-mono">${submission.est_earnings.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Geo stats toggle */}
        {hasStats && !hasEnoughViewsForGeo && (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-zinc-600 italic">Not enough views for geo breakdown (min {MIN_VIEWS_FOR_GEO})</p>
          </div>
        )}
        {hasStats && hasEnoughViewsForGeo && geoStats.length > 0 && (
          <>
            <div className="px-3 pb-1">
              <button
                onClick={() => setShowGeo(!showGeo)}
                className="text-[11px] font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                <span
                  className="inline-block transition-transform duration-200"
                  style={{ transform: showGeo ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  ▼
                </span>{" "}
                View stats
              </button>
            </div>

            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: showGeo ? "400px" : "0px", opacity: showGeo ? 1 : 0 }}
            >
              <div className="px-3 pb-3 pt-1">
                {/* US% edit (admin only) */}
                {isAdmin && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.04]">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">US Viewers %</div>
                    {editingPct === "us" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="0" max="100" step="1" value={pctValue}
                          onChange={(e) => setPctValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSavePct(); if (e.key === "Escape") setEditingPct(null) }}
                          autoFocus
                          className="w-14 bg-zinc-900 border border-green-400/30 rounded px-1.5 py-0.5 text-[11px] text-white text-right font-mono focus:outline-none"
                        />
                        <button onClick={handleSavePct} className="p-0.5 text-green-400"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingPct(null)} className="p-0.5 text-zinc-600"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleStartEdit("us")} className="flex items-center gap-1 text-[11px] tabular-nums text-zinc-500 hover:text-white transition-colors">
                        {effectiveUsPct.toFixed(0)}%
                        {hasUsOverride && <span className="text-[8px] text-green-400/50 ml-0.5">custom</span>}
                        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                )}

                {/* UK% edit */}
                {isAdmin && includeUkViews && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.04]">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">UK Viewers %</div>
                    {editingPct === "uk" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="0" max="100" step="1" value={pctValue}
                          onChange={(e) => setPctValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSavePct(); if (e.key === "Escape") setEditingPct(null) }}
                          autoFocus
                          className="w-14 bg-zinc-900 border border-green-400/30 rounded px-1.5 py-0.5 text-[11px] text-white text-right font-mono focus:outline-none"
                        />
                        <button onClick={handleSavePct} className="p-0.5 text-green-400"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingPct(null)} className="p-0.5 text-zinc-600"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleStartEdit("uk")} className="flex items-center gap-1 text-[11px] tabular-nums text-zinc-500 hover:text-white transition-colors">
                        {(effectiveUkPct ?? 0).toFixed(0)}%
                        {hasUkOverride && <span className="text-[8px] text-green-400/50 ml-0.5">custom</span>}
                        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                )}

                {/* List vs map toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Country</div>
                  <div className="flex items-center gap-0.5 bg-white/[0.06] rounded p-0.5">
                    <button onClick={() => setGeoView("list")} className={`p-1 rounded transition-colors ${geoView === "list" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
                      <BarChart3 className="w-3 h-3" />
                    </button>
                    <button onClick={() => setGeoView("map")} className={`p-1 rounded transition-colors ${geoView === "map" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"}`}>
                      <Globe className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {geoView === "list" ? (
                  <div className="space-y-1.5">
                    {geoStats.map((s) => (
                      <div key={s.code} className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500 w-5 shrink-0">{s.code}</span>
                        <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(s.pct / geoStats[0].pct) * 100}%`,
                              background: s.pct > 20 ? "#4ADE80" : s.pct > 10 ? "#22C55E" : "#166534",
                            }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-zinc-600 w-8 text-right shrink-0">{s.pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="rounded-md overflow-hidden bg-white/[0.03] mb-2">
                      <WorldMap geoStats={geoStats} />
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                      {geoStats.map((s) => (
                        <span key={s.code} className="text-[10px] text-zinc-600">
                          <span className="text-zinc-400">{s.code}</span> <span className="tabular-nums">{Math.round(s.pct)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end px-3 pb-3">
          <Link
            href={`/0x8f3a9b2c/campaigns/${submission.campaign_id}/submissions/${submission.id}`}
            className="text-[11px] font-medium text-green-400 hover:text-green-300 transition-colors"
          >
            View details
          </Link>
        </div>
      </div>

      {/* Embed modal */}
      {showEmbed && embedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowEmbed(false)}>
          <div className="relative w-full max-w-3xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowEmbed(false)} className="absolute -top-10 right-0 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
              Close <X className="w-4 h-4" />
            </button>
            <div className={`rounded-lg overflow-hidden bg-black ${(submission.platform === "tiktok" || submission.platform === "instagram") ? "max-w-sm mx-auto aspect-[9/16]" : "aspect-video"}`}>
              <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={`${submission.platform} video`} />
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-4 text-zinc-500 text-sm">
                {submission.views > 0 && <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {formatNumber(submission.views)}</span>}
                {submission.likes > 0 && <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {formatNumber(submission.likes)}</span>}
                {submission.comments > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {formatNumber(submission.comments)}</span>}
              </div>
              <a href={submission.post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                Open on {submission.platform} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
