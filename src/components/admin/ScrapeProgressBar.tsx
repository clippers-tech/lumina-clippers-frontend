"use client"

import { useScrapeProgress } from "@/lib/scrape-context"
import { Loader2, CheckCircle, XCircle, X, AlertTriangle } from "lucide-react"

export function ScrapeProgressBar() {
  const { progress, campaignName, dismiss } = useScrapeProgress()

  if (!progress) return null

  const { total, completed, failed, skipped, status, current_platform, errors } = progress
  const processed = completed + failed + skipped
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  const isPending = status === "pending"
  const isRunning = status === "running" || isPending
  const isComplete = status === "complete"
  const isFailed = status === "failed"

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl border border-white/[0.08] bg-[#0d2e1c]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2.5">
            {isRunning && (
              <Loader2 className="w-4 h-4 text-green-400 animate-spin shrink-0" />
            )}
            {isComplete && (
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            )}
            {isFailed && (
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <div>
              <p className="text-[13px] font-semibold text-zinc-100">
                {isPending ? "Queued" : isRunning ? "Updating Stats" : isComplete ? "Stats Updated" : "Update Failed"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{campaignName}</p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={dismiss}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isFailed ? "bg-red-400" : "bg-green-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-zinc-400">
              {processed}/{total} clips
            </span>
            {completed > 0 && (
              <span className="text-green-400">{completed} updated</span>
            )}
            {failed > 0 && (
              <span className="text-red-400">{failed} failed</span>
            )}
            {skipped > 0 && (
              <span className="text-zinc-500">{skipped} skipped</span>
            )}
          </div>
          {isRunning && current_platform && (
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {current_platform}
            </span>
          )}
        </div>

        {/* Errors (collapsed, show first 2) */}
        {errors.length > 0 && !isRunning && (
          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
                {errors.length} error{errors.length > 1 ? "s" : ""}
              </span>
            </div>
            {errors.slice(0, 2).map((err, i) => (
              <p key={i} className="text-[10px] text-zinc-500 truncate">{err}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
