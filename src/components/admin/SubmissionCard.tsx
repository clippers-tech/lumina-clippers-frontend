"use client"

import Link from "next/link"
import { type Submission } from "@/lib/api"
import { formatNumber, formatCurrency, platformIcon } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"
import { VerificationBadge } from "./VerificationBadge"

interface SubmissionCardProps {
  submission: Submission
  campaignId: number
}

export function SubmissionCard({ submission: sub, campaignId }: SubmissionCardProps) {
  return (
    <Link href={`/admin/campaigns/${campaignId}/submissions/${sub.id}`}>
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-4 transition-all hover:bg-white/[0.03] hover:border-white/[0.08] cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-zinc-100">{sub.clipper_name || sub.clipper_email}</p>
            <p className="text-[11px] text-zinc-500 font-mono">{platformIcon(sub.platform)} {sub.platform}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <VerificationBadge status={sub.verification_status} />
            <StatusBadge status={sub.status} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Views</p>
            <p className="text-sm font-mono text-zinc-100">{formatNumber(sub.views)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Likes</p>
            <p className="text-sm font-mono text-zinc-100">{formatNumber(sub.likes)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Earnings</p>
            <p className="text-sm font-mono text-lime-400">{formatCurrency(sub.est_earnings)}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
