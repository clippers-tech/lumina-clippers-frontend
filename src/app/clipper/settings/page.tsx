"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, Wallet, CreditCard, Coins } from "lucide-react"
import { clipperApi, type PaymentSettings } from "@/lib/api"
import { getClipperToken } from "@/lib/clipper-auth"
import { ClipperNav } from "@/components/clipper/ClipperNav"
import { useToast } from "@/components/ui/toast"

type Method = "whop" | "paypal" | "solana"

const METHODS: { key: Method; label: string; icon: React.ReactNode; description: string; fieldLabel: string; placeholder: string; fieldKey: keyof PaymentSettings }[] = [
  {
    key: "whop",
    label: "Whop",
    icon: <Wallet className="w-5 h-5" />,
    description: "Receive payments to your Whop account",
    fieldLabel: "Whop Username",
    placeholder: "e.g. johndoe",
    fieldKey: "whop_username",
  },
  {
    key: "paypal",
    label: "PayPal",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Receive payments to your PayPal email",
    fieldLabel: "PayPal Email",
    placeholder: "e.g. john@example.com",
    fieldKey: "paypal_email",
  },
  {
    key: "solana",
    label: "Solana",
    icon: <Coins className="w-5 h-5" />,
    description: "Receive payments to your Solana wallet",
    fieldLabel: "Wallet Address",
    placeholder: "e.g. 7xKXt...",
    fieldKey: "solana_address",
  },
]

export default function ClipperSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<Method | "">("")
  const [whopUsername, setWhopUsername] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [solanaAddress, setSolanaAddress] = useState("")

  useEffect(() => {
    const token = getClipperToken()
    if (!token) { router.push("/clipper/login"); return }

    clipperApi.getPaymentSettings(token).then((settings) => {
      setSelectedMethod((settings.payment_method as Method) || "")
      setWhopUsername(settings.whop_username || "")
      setPaypalEmail(settings.paypal_email || "")
      setSolanaAddress(settings.solana_address || "")
    }).catch(() => {
      toast({ description: "Failed to load payment settings", variant: "error" })
    }).finally(() => setLoading(false))
  }, [router, toast])

  const handleSave = async () => {
    if (!selectedMethod) {
      toast({ description: "Please select a payment method", variant: "error" })
      return
    }
    const token = getClipperToken()
    if (!token) return

    setSaving(true)
    try {
      await clipperApi.updatePaymentSettings(token, {
        payment_method: selectedMethod,
        whop_username: whopUsername,
        paypal_email: paypalEmail,
        solana_address: solanaAddress,
      })
      toast({ description: "Payment settings saved", variant: "success" })
    } catch (err) {
      toast({ description: err instanceof Error ? err.message : "Failed to save settings", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  const getFieldValue = (method: Method) => {
    switch (method) {
      case "whop": return whopUsername
      case "paypal": return paypalEmail
      case "solana": return solanaAddress
    }
  }

  const setFieldValue = (method: Method, value: string) => {
    switch (method) {
      case "whop": setWhopUsername(value); break
      case "paypal": setPaypalEmail(value); break
      case "solana": setSolanaAddress(value); break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b2518]">
        <ClipperNav />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b2518]">
      <ClipperNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/clipper/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Payment Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Set up how you want to receive your earnings
          </p>
        </div>

        {/* Method Selection */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Payment Method
          </p>
          <div className="grid gap-3">
            {METHODS.map((m) => {
              const isSelected = selectedMethod === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMethod(m.key)}
                  className={`relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-green-400/30 bg-green-400/[0.06]"
                      : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Radio indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? "border-green-400 bg-green-400"
                      : "border-zinc-600"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-black" />}
                  </div>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-green-400/10 text-green-400" : "bg-white/[0.05] text-zinc-400"
                  }`}>
                    {m.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isSelected ? "text-green-400" : "text-zinc-200"}`}>
                      {m.label}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail Fields */}
        {selectedMethod && (
          <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
            {METHODS.filter((m) => m.key === selectedMethod).map((m) => (
              <div key={m.key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                  {m.fieldLabel}
                </label>
                <input
                  type="text"
                  value={getFieldValue(m.key)}
                  onChange={(e) => setFieldValue(m.key, e.target.value)}
                  placeholder={m.placeholder}
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-green-400/30 transition-colors placeholder:text-zinc-600"
                />

                {/* Show saved values for other methods if they exist */}
                {METHODS.filter((other) => other.key !== m.key && getFieldValue(other.key)).map((other) => (
                  <div key={other.key} className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium">{other.label}:</span>
                    <span className="text-zinc-400 font-mono">{getFieldValue(other.key)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !selectedMethod}
          className="w-full bg-green-400 text-black text-sm font-extrabold py-3 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Payment Settings"}
        </button>
      </div>
    </div>
  )
}
