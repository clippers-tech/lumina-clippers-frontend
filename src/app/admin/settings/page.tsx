"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"
import {
  settingsApi,
  type Setting,
  type ApifyUsageLog,
  type ApifyUsageResponse,
} from "@/lib/api"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { Pagination } from "@/components/admin/Pagination"
import { LoadingState } from "@/components/admin/LoadingState"
import { formatCurrency } from "@/lib/utils"
import { Save, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react"

// ── Helper Components ─────────────────────────────────────

function SecretField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-green-400/30 transition-colors font-mono"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 items-start py-4 border-b border-white/[0.04] last:border-b-0">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-zinc-600 mt-0.5">{description}</p>
        )}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

function Section({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div>
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            {title}
          </h3>
          {description && (
            <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function ApifyUsageSection() {
  const [data, setData] = useState<ApifyUsageResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    settingsApi
      .apifyUsage(token, page, 10)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <Section title="Apify Usage" description="Scraping costs and usage history">
      {loading ? (
        <LoadingState />
      ) : !data ? (
        <p className="text-sm text-zinc-500">No usage data available</p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                Total Runs
              </p>
              <p className="text-lg font-bold text-zinc-100 font-mono">
                {data.summary.total_runs.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                URLs Scraped
              </p>
              <p className="text-lg font-bold text-zinc-100 font-mono">
                {data.summary.total_urls.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                Total Cost
              </p>
              <p className="text-lg font-bold text-green-400 font-mono">
                {formatCurrency(data.summary.total_cost)}
              </p>
            </div>
          </div>

          {/* Usage table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-3 py-2">
                    Date
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-3 py-2">
                    Platform
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-3 py-2">
                    Type
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-3 py-2">
                    URLs
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-3 py-2">
                    Cost
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-3 py-2">
                    Run ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row: ApifyUsageLog) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-3 py-3 text-sm text-zinc-400">
                      {new Date(row.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <span className="bg-green-400/10 text-green-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {row.platform}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-400">{row.run_type}</td>
                    <td className="px-3 py-3 text-right text-sm font-mono text-zinc-100">
                      {row.url_count}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-mono text-green-400">
                      {formatCurrency(row.est_cost)}
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-500 font-mono truncate max-w-[120px]">
                      {row.run_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={data.page} totalPages={data.pages} onPageChange={setPage} />
        </>
      )}
    </Section>
  )
}

// ── Main Settings Page ────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")

  useEffect(() => {
    const token = getToken()
    if (!token) return
    settingsApi
      .list(token)
      .then((items: Setting[]) => {
        const map: Record<string, string> = {}
        items.forEach((s) => (map[s.key] = s.value))
        setSettings(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateField = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    const token = getToken()
    if (!token) return
    setSaving(true)
    setSaveMsg("")
    try {
      await settingsApi.update(token, settings)
      setSaveMsg("Settings saved successfully")
      setTimeout(() => setSaveMsg(""), 3000)
    } catch (err) {
      console.error(err)
      setSaveMsg("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }, [settings])

  return (
    <AdminGuard>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
              Admin Panel
            </p>
            <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
            <p className="text-sm text-zinc-500 mt-1">
              System configuration and integrations
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>

        {saveMsg && (
          <div
            className={`text-sm rounded-lg px-4 py-2 mb-4 ${
              saveMsg.includes("success")
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {saveMsg}
          </div>
        )}

        <div className="mt-6 mb-6">
          <AdminTabs />
        </div>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            {/* General Settings */}
            <Section title="General" description="Core application settings">
              <FieldRow label="App Name" description="Display name of the platform">
                <input
                  value={settings.app_name || ""}
                  onChange={(e) => updateField("app_name", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="Lumina Clippers"
                />
              </FieldRow>
              <FieldRow
                label="Base URL"
                description="Public-facing URL of the application"
              >
                <input
                  value={settings.base_url || ""}
                  onChange={(e) => updateField("base_url", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="https://app.luminaclippers.com"
                />
              </FieldRow>
              <FieldRow
                label="Default CPM Rate"
                description="Default CPM for new campaigns"
              >
                <input
                  type="number"
                  step="0.01"
                  value={settings.default_cpm_rate || ""}
                  onChange={(e) => updateField("default_cpm_rate", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="10.00"
                />
              </FieldRow>
              <FieldRow
                label="Default Max Payout"
                description="Default max payout per submission"
              >
                <input
                  type="number"
                  step="0.01"
                  value={settings.default_max_payout || ""}
                  onChange={(e) => updateField("default_max_payout", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="500.00"
                />
              </FieldRow>
            </Section>

            {/* Email Settings */}
            <Section
              title="Email"
              description="SMTP and email configuration"
              defaultOpen={false}
            >
              <FieldRow label="SMTP Host" description="Email server hostname">
                <input
                  value={settings.smtp_host || ""}
                  onChange={(e) => updateField("smtp_host", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="smtp.gmail.com"
                />
              </FieldRow>
              <FieldRow label="SMTP Port" description="Email server port">
                <input
                  type="number"
                  value={settings.smtp_port || ""}
                  onChange={(e) => updateField("smtp_port", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="587"
                />
              </FieldRow>
              <FieldRow label="SMTP Username" description="Email account username">
                <input
                  value={settings.smtp_username || ""}
                  onChange={(e) => updateField("smtp_username", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="user@gmail.com"
                />
              </FieldRow>
              <FieldRow label="SMTP Password" description="Email account password">
                <SecretField
                  value={settings.smtp_password || ""}
                  onChange={(val) => updateField("smtp_password", val)}
                  placeholder="App password"
                />
              </FieldRow>
              <FieldRow label="From Email" description="Sender email address">
                <input
                  value={settings.from_email || ""}
                  onChange={(e) => updateField("from_email", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="noreply@luminaclippers.com"
                />
              </FieldRow>
              <FieldRow label="From Name" description="Sender display name">
                <input
                  value={settings.from_name || ""}
                  onChange={(e) => updateField("from_name", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="Lumina Clippers"
                />
              </FieldRow>
            </Section>

            {/* Telegram Settings */}
            <Section
              title="Telegram"
              description="Telegram bot integration"
              defaultOpen={false}
            >
              <FieldRow label="Bot Token" description="Telegram bot API token">
                <SecretField
                  value={settings.telegram_bot_token || ""}
                  onChange={(val) => updateField("telegram_bot_token", val)}
                  placeholder="123456:ABC-DEF..."
                />
              </FieldRow>
              <FieldRow label="Chat ID" description="Default notification chat ID">
                <input
                  value={settings.telegram_chat_id || ""}
                  onChange={(e) => updateField("telegram_chat_id", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="-1001234567890"
                />
              </FieldRow>
              <FieldRow
                label="Notifications Enabled"
                description="Send Telegram notifications"
              >
                <button
                  onClick={() =>
                    updateField(
                      "telegram_enabled",
                      settings.telegram_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.telegram_enabled === "true"
                      ? "bg-green-400"
                      : "bg-white/[0.1]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      settings.telegram_enabled === "true"
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </FieldRow>
            </Section>

            {/* Scraping Settings */}
            <Section
              title="Scraping"
              description="Apify and scraping configuration"
              defaultOpen={false}
            >
              <FieldRow
                label="Apify API Token"
                description="Token for Apify scraping service"
              >
                <SecretField
                  value={settings.apify_api_token || ""}
                  onChange={(val) => updateField("apify_api_token", val)}
                  placeholder="apify_api_..."
                />
              </FieldRow>
              <FieldRow
                label="Scrape Interval (min)"
                description="Minutes between auto-scrape runs"
              >
                <input
                  type="number"
                  value={settings.scrape_interval_minutes || ""}
                  onChange={(e) =>
                    updateField("scrape_interval_minutes", e.target.value)
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  placeholder="60"
                />
              </FieldRow>
              <FieldRow
                label="Auto-Scrape Enabled"
                description="Automatically scrape submissions"
              >
                <button
                  onClick={() =>
                    updateField(
                      "auto_scrape_enabled",
                      settings.auto_scrape_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.auto_scrape_enabled === "true"
                      ? "bg-green-400"
                      : "bg-white/[0.1]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      settings.auto_scrape_enabled === "true"
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </FieldRow>
              <FieldRow
                label="TikTok Actor ID"
                description="Apify actor ID for TikTok scraping"
              >
                <input
                  value={settings.apify_tiktok_actor_id || ""}
                  onChange={(e) =>
                    updateField("apify_tiktok_actor_id", e.target.value)
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors font-mono"
                  placeholder="actor_id"
                />
              </FieldRow>
              <FieldRow
                label="Instagram Actor ID"
                description="Apify actor ID for Instagram scraping"
              >
                <input
                  value={settings.apify_instagram_actor_id || ""}
                  onChange={(e) =>
                    updateField("apify_instagram_actor_id", e.target.value)
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors font-mono"
                  placeholder="actor_id"
                />
              </FieldRow>
              <FieldRow
                label="YouTube Actor ID"
                description="Apify actor ID for YouTube scraping"
              >
                <input
                  value={settings.apify_youtube_actor_id || ""}
                  onChange={(e) =>
                    updateField("apify_youtube_actor_id", e.target.value)
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors font-mono"
                  placeholder="actor_id"
                />
              </FieldRow>
            </Section>

            {/* Apify Usage */}
            <ApifyUsageSection />
          </>
        )}
      </div>
    </AdminGuard>
  )
}
