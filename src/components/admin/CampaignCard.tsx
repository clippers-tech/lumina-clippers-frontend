"use client"

import Link from "next/link"
import { type Campaign } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link href={`/admin/campaigns/${campaign.id}`}>
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-5 transition-all hover:bg-white/[0.03] hover:border-white/[0.08] cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">{campaign.name}</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">{campaign.client_name}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span>CPM: {formatCurrency(campaign.cpm_rate)}</span>
          {campaign.budget_total > 0 && (
            <span>Budget: {formatCurrency(campaign.budget_total)}</span>
          )}
          <span className="bg-lime-400/10 text-lime-400 px-1.5 py-0.5 rounded font-mono text-[10px]">
            {campaign.slug}
          </span>
        </div>
      </div>
    </Link>
  )
}
