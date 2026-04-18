"use client"

import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react"
import { getToken } from "@/lib/auth"
import { scrapeApi, type ScrapeProgress } from "@/lib/api"

type ScrapeContextValue = {
  /** Start a campaign scrape — returns false if one is already running */
  startScrape: (campaignId: number, campaignName: string) => Promise<boolean>
  /** Current progress (null when idle) */
  progress: ScrapeProgress | null
  /** Campaign name being scraped */
  campaignName: string
  /** Dismiss the completed/failed notification */
  dismiss: () => void
  /** Whether a scrape is actively running */
  isRunning: boolean
}

const ScrapeContext = createContext<ScrapeContextValue | null>(null)

export function useScrapeProgress() {
  const ctx = useContext(ScrapeContext)
  if (!ctx) throw new Error("useScrapeProgress must be used inside ScrapeProgressProvider")
  return ctx
}

export function ScrapeProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ScrapeProgress | null>(null)
  const [campaignName, setCampaignName] = useState("")
  const [dismissed, setDismissed] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobIdRef = useRef<string | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  const startScrape = useCallback(async (campaignId: number, name: string): Promise<boolean> => {
    // Don't start if already running
    if (jobIdRef.current && progress?.status === "running") return false

    const token = getToken()
    if (!token) return false

    setDismissed(false)
    setCampaignName(name)

    try {
      const res = await scrapeApi.startCampaign(token, campaignId)
      if (!res.job_id) {
        setProgress(null)
        return false
      }

      jobIdRef.current = res.job_id
      setProgress({
        campaign_id: campaignId,
        total: res.total,
        completed: 0,
        failed: 0,
        skipped: 0,
        status: "running",
        current_platform: "",
        started_at: new Date().toISOString(),
        errors: [],
      })

      // Start polling every 3s
      stopPolling()
      pollRef.current = setInterval(async () => {
        const t = getToken()
        if (!t || !jobIdRef.current) return
        try {
          const p = await scrapeApi.progress(t, jobIdRef.current)
          setProgress(p)
          if (p.status !== "running" && p.status !== "pending") {
            stopPolling()
            jobIdRef.current = null
          }
        } catch {
          // Silently continue polling
        }
      }, 3000)

      return true
    } catch {
      setProgress(null)
      return false
    }
  }, [progress, stopPolling])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setProgress(null)
    jobIdRef.current = null
    stopPolling()
  }, [stopPolling])

  const isRunning = progress?.status === "running" || progress?.status === "pending"

  return (
    <ScrapeContext.Provider
      value={{
        startScrape,
        progress: dismissed ? null : progress,
        campaignName,
        dismiss,
        isRunning,
      }}
    >
      {children}
    </ScrapeContext.Provider>
  )
}
