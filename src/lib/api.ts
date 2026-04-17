const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type FetchOptions = RequestInit & { token?: string }

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = opts
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { headers, ...rest })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `API error ${res.status}`)
  }
  if (res.status === 204) return {} as T
  return res.json()
}

// ── Paginated response shape ─────────────────────────
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// ── Auth ──────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) =>
    apiFetch<{ id: number; name: string; email: string; role: string; is_active: boolean; campaign_ids: string }>("/api/auth/me", { token }),
  sendCode: (email: string) =>
    apiFetch<{ detail: string }>("/api/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyCode: (email: string, code: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/api/auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
}

// ── Campaigns ─────────────────────────────────────────
export type Campaign = {
  id: number; slug: string; name: string; client_name: string; client_email: string
  brief_url: string; thumbnail_url: string; cpm_rate: number; client_cpm_rate: number; max_payout: number
  budget_total: number; budget_used: number; status: string; accepted_platforms: string
  us_viewers_pct: number; include_uk_views: boolean; uk_viewers_pct: number | null; target_views: number | null; requirements_url: string
  description: string; min_publish_date: string | null; min_views_payout: number | null
  viewer_token: string; created_at: string; updated_at: string
}

export type CampaignStats = {
  total_submissions: number; submissions_with_stats: number; total_views: number
  total_interactions: number; est_revenue: number; budget_used: number; budget_total: number
}

export const campaigns = {
  list: (token: string, status?: string) =>
    apiFetch<Campaign[]>(`/api/campaigns${status ? `?status=${status}` : ""}`, { token }),
  get: (token: string, id: number) =>
    apiFetch<Campaign>(`/api/campaigns/${id}`, { token }),
  stats: (token: string, id: number) =>
    apiFetch<CampaignStats>(`/api/campaigns/${id}/stats`, { token }),
  create: (token: string, data: Partial<Campaign>) =>
    apiFetch<Campaign>("/api/campaigns", { token, method: "POST", body: JSON.stringify(data) }),
  update: (token: string, id: number, data: Partial<Campaign>) =>
    apiFetch<Campaign>(`/api/campaigns/${id}`, { token, method: "PUT", body: JSON.stringify(data) }),
  delete: (token: string, id: number) =>
    apiFetch<{ detail: string }>(`/api/campaigns/${id}`, { token, method: "DELETE" }),
  duplicate: (token: string, campaignId: number) =>
    apiFetch<Campaign>(`/api/campaigns/${campaignId}/duplicate`, { token, method: "POST" }),
  exportUrl: (id: number) => `${API_URL}/api/campaigns/${id}/export`,
  importCsv: async (token: string, campaignId: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/import-csv`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Import failed")
    return res.json() as Promise<{ imported: number; skipped: number; errors: Array<{ row: number; reason: string }> }>
  },
}

// ── Submissions ───────────────────────────────────────
export type Submission = {
  id: number; campaign_id: number; clipper_email: string; clipper_name: string
  post_url: string; platform: string; thumbnail_url: string; views: number
  likes: number; comments: number; interactions: number; est_earnings: number
  status: string; scrape_status: string; scrape_error: string; scrape_last_run: string | null
  us_viewers_pct: number | null; uk_viewers_pct: number | null; notes: string; submission_token: string; created_at: string; updated_at: string
  verification_status: string | null; verification_note: string | null
}

export const submissions = {
  list: (token: string, campaignId: number, params?: { status?: string; platform?: string; page?: number; per_page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set("status", params.status)
    if (params?.platform) qs.set("platform", params.platform)
    if (params?.page) qs.set("page", String(params.page))
    if (params?.per_page) qs.set("per_page", String(params.per_page))
    const q = qs.toString()
    return apiFetch<PaginatedResponse<Submission>>(`/api/campaigns/${campaignId}/submissions${q ? `?${q}` : ""}`, { token })
  },
  get: (token: string, id: number) =>
    apiFetch<Submission>(`/api/submissions/${id}`, { token }),
  update: (token: string, id: number, data: Record<string, unknown>) =>
    apiFetch<Submission>(`/api/submissions/${id}`, { token, method: "PUT", body: JSON.stringify(data) }),
  delete: (token: string, id: number) =>
    apiFetch<{ detail: string }>(`/api/submissions/${id}`, { token, method: "DELETE" }),
  scrape: (token: string, id: number) =>
    apiFetch<{ detail: string; scrape_job_id?: number; status?: string; error_message?: string; views?: number; likes?: number; comments?: number; interactions?: number }>(`/api/submissions/${id}/scrape`, { token, method: "POST" }),
  payout: (token: string, id: number, data: { amount: number; method?: string; reference?: string }) =>
    apiFetch<{ id: number }>(`/api/submissions/${id}/payout`, { token, method: "POST", body: JSON.stringify(data) }),
  bulkStatus: (token: string, ids: number[], status: string, notes: string) =>
    apiFetch<{ detail: string }>("/api/submissions/bulk-status", {
      token, method: "POST", body: JSON.stringify({ ids, status, notes }),
    }),
  sendUploadLinks: (token: string, submissionIds: number[]) =>
    apiFetch<{ detail: string; sent: number; total: number }>("/api/submissions/send-upload-links", {
      token, method: "POST", body: JSON.stringify({ submission_ids: submissionIds }),
    }),
  bulkAdd: (token: string, campaignId: number, items: { post_url: string; clipper_email?: string }[]) =>
    apiFetch<{ detail: string; added: number; skipped: number; results: { post_url: string; status: string; reason: string }[] }>("/api/submissions/bulk-add", {
      token, method: "POST", body: JSON.stringify({ campaign_id: campaignId, submissions: items }),
    }),
}

// ── Public ────────────────────────────────────────────
export type PublicCampaign = {
  id: number; slug: string; name: string; client_name: string; thumbnail_url: string
  brief_url: string; cpm_rate: number; max_payout: number; budget_total: number
  budget_used: number; status: string; accepted_platforms: string; total_submissions: number
  description?: string
  requirements_url?: string
}

export type PublicSubmission = {
  id: number; post_url: string; platform: string; views: number; interactions: number
  est_earnings: number; status: string; created_at: string
}

export const publicApi = {
  campaigns: () =>
    apiFetch<PublicCampaign[]>(`/api/public/campaigns`),
  campaign: (slug: string) =>
    apiFetch<PublicCampaign>(`/api/public/campaign/${slug}`),
  submit: (slug: string, data: { clipper_email: string; clipper_name?: string; post_url: string }) =>
    apiFetch<{ detail: string; submission_token: string }>(`/api/public/campaign/${slug}/submit`, {
      method: "POST", body: JSON.stringify(data),
    }),
  clipperSubmissions: (token: string) =>
    apiFetch<PublicSubmission[]>(`/api/public/submission/${token}`),
}

// ── Users ────────────────────────────────────────────
export type UserDetail = {
  id: number; name: string; email: string; role: string; is_active: boolean
  campaign_ids: string; created_at: string; campaigns: string[]
}

export const users = {
  list: (token: string) =>
    apiFetch<UserDetail[]>("/api/users", { token }),
  create: (token: string, data: { name: string; email: string; password: string; role?: string; campaign_ids?: string }) =>
    apiFetch<UserDetail>("/api/users", { token, method: "POST", body: JSON.stringify(data) }),
  update: (token: string, id: number, data: Record<string, unknown>) =>
    apiFetch<UserDetail>(`/api/users/${id}`, { token, method: "PUT", body: JSON.stringify(data) }),
  delete: (token: string, id: number) =>
    apiFetch<{ detail: string }>(`/api/users/${id}`, { token, method: "DELETE" }),
}

// ── Payments ─────────────────────────────────────────
export type PaymentLog = {
  id: number; submission_id: number; amount: number; method: string; reference: string
  paid_at: string; logged_by: number | null; notes: string; submission_title: string
  creator_email: string; campaign_name: string; paid_by_email: string; paid_views: number
}

export const payments = {
  list: (token: string, filter?: string, creatorEmail?: string, page?: number, perPage?: number, campaignId?: number) => {
    const params = new URLSearchParams()
    if (filter) params.set("filter", filter)
    if (creatorEmail) params.set("creator_email", creatorEmail)
    if (campaignId) params.set("campaign_id", String(campaignId))
    if (page) params.set("page", String(page))
    if (perPage) params.set("per_page", String(perPage))
    const qs = params.toString()
    return apiFetch<PaginatedResponse<PaymentLog>>(`/api/payments${qs ? `?${qs}` : ""}`, { token })
  },
  create: (token: string, data: { submission_id: number; amount: number; method?: string; reference?: string; notes?: string }) =>
    apiFetch<PaymentLog>("/api/payments", { token, method: "POST", body: JSON.stringify(data) }),
  delete: (token: string, id: number) =>
    apiFetch<{ detail: string }>(`/api/payments/${id}`, { token, method: "DELETE" }),
}

// ── Creators ────────────────────────────────────────
export type Creator = {
  email: string; name: string; total_submissions: number; total_views: number
  total_comments: number; total_paid: number; platforms: string[]
  campaigns: string[]; last_submission_at: string
}

export type CreatorDetail = Creator & {
  submissions: CreatorSubmission[]
  payment_history: CreatorPayment[]
}

export type CreatorSubmission = {
  id: number; post_url: string; platform: string; views: number; likes: number
  comments: number; est_earnings: number; status: string; thumbnail_url: string
  campaign_name: string; campaign_id: number; created_at: string
}

export type CreatorPayment = {
  date: string; amount: number; views_paid: number; paid_by: string; reference: string
}

export const creators = {
  list: (token: string, search?: string, page?: number, perPage?: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (page) params.set("page", String(page))
    if (perPage) params.set("per_page", String(perPage))
    const qs = params.toString()
    return apiFetch<PaginatedResponse<Creator>>(`/api/creators${qs ? `?${qs}` : ""}`, { token })
  },
  get: (token: string, email: string) =>
    apiFetch<CreatorDetail>(`/api/creators/${encodeURIComponent(email)}`, { token }),
}

// ── Viewer ────────────────────────────────────────────
export type ViewerData = {
  campaign: {
    id: number; name: string; client_name: string; status: string; thumbnail_url: string
    accepted_platforms: string; total_submissions: number; total_views: number
    total_interactions: number; est_revenue: number
  }
  submissions: PublicSubmission[]
}

export const viewer = {
  get: (viewerToken: string) =>
    apiFetch<ViewerData>(`/api/viewer/${viewerToken}`),
}

// ── Chat ─────────────────────────────────────────────
export type ChatThread = {
  id: number; thread_token: string; category: string; status: string
  created_at: string; updated_at: string
  last_message?: { body: string; created_at: string; sender_type: string }
  submission: {
    id: number; post_url: string; platform: string; thumbnail_url: string
    clipper_email: string; clipper_name: string; campaign_name: string
    status: string
  }
}

export type ChatMessage = {
  id: number; thread_id: number; sender_type: string
  sender_email: string; body: string; created_at: string
}

export type ChatThreadDetail = ChatThread & {
  messages: ChatMessage[]
  creator_stats: {
    total_submissions: number; verified_count: number; total_views: number
    total_paid: number; first_submission_at: string; last_submission_at: string
  }
}

export type CreatorChatView = {
  thread_token: string; category: string; status: string
  submission: { post_url: string; platform: string; campaign_name: string }
  messages: ChatMessage[]
}

export type CreatorInboxThread = {
  id: number; thread_token: string; category: string; status: string
  created_at: string; updated_at: string
  last_message?: { body: string; created_at: string; sender_type: string }
  submission: {
    id: number; post_url: string; platform: string; thumbnail_url: string
    clipper_email: string; clipper_name: string; campaign_name: string; status: string
  }
}

export type CreatorThreadDetail = {
  id: number; thread_token: string; category: string; status: string
  created_at: string; updated_at: string
  submission: { id: number; post_url: string; platform: string; campaign_name: string }
  messages: ChatMessage[]
}

export const chat = {
  threads: (token: string, status?: string, search?: string) => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (search) params.set("search", search)
    const qs = params.toString()
    return apiFetch<ChatThread[]>(`/api/chat/threads${qs ? `?${qs}` : ""}`, { token })
  },
  thread: (token: string, threadId: number) =>
    apiFetch<ChatThreadDetail>(`/api/chat/threads/${threadId}`, { token }),
  createThread: (token: string, data: { submission_id: number; category: string; message: string }) =>
    apiFetch<ChatThread>("/api/chat/threads", { token, method: "POST", body: JSON.stringify(data) }),
  sendMessage: (token: string, threadId: number, body: string) =>
    apiFetch<ChatMessage>(`/api/chat/threads/${threadId}/messages`, { token, method: "POST", body: JSON.stringify({ body }) }),
  updateThread: (token: string, threadId: number, status: string) =>
    apiFetch<ChatThread>(`/api/chat/threads/${threadId}`, { token, method: "PATCH", body: JSON.stringify({ status }) }),
  searchSubmissions: (token: string, search?: string) =>
    apiFetch<Array<{ id: number; post_url: string; platform: string; thumbnail_url: string; clipper_email: string; clipper_name: string; campaign_name: string; status: string }>>(
      `/api/chat/submissions-search${search ? `?search=${encodeURIComponent(search)}` : ""}`, { token }
    ),
  creatorThread: (threadToken: string) =>
    apiFetch<CreatorChatView>(`/api/chat/c/${threadToken}`),
  creatorSendMessage: (threadToken: string, body: string) =>
    apiFetch<ChatMessage>(`/api/chat/c/${threadToken}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
  creatorInbox: (creatorToken: string) =>
    apiFetch<CreatorInboxThread[]>(`/api/chat/c/${creatorToken}`),
  creatorThreadDetail: (creatorToken: string, threadId: number) =>
    apiFetch<CreatorThreadDetail>(`/api/chat/c/${creatorToken}/thread/${threadId}`),
  creatorInboxSendMessage: (creatorToken: string, threadId: number, body: string) =>
    apiFetch<ChatMessage>(`/api/chat/c/${creatorToken}/thread/${threadId}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
  creatorCreateThread: (creatorToken: string, data: { submission_id: number; category: string; message: string }) =>
    apiFetch<CreatorInboxThread>(`/api/chat/c/${creatorToken}/threads`, { method: "POST", body: JSON.stringify(data) }),
  creatorSubmissions: (creatorToken: string) =>
    apiFetch<Array<{ id: number; post_url: string; platform: string; thumbnail_url: string; campaign_name: string; status: string }>>(`/api/chat/c/${creatorToken}/submissions`),
  creatorLink: (token: string, email: string) =>
    apiFetch<{ token: string; url: string }>(`/api/chat/creator-link/${encodeURIComponent(email)}`, { token }),
}

// ── Clipper Dashboard ────────────────────────────────────
export type ClipperStats = {
  total_submissions: number; total_views: number; total_est_earnings: number
  total_paid: number; pending_earnings: number
}

export type ClipperCampaign = {
  id: number; name: string; slug: string; status: string
  submission_count: number; views: number; earnings: number
  requirements_url: string
}

export type ClipperSubmission = {
  id: number; post_url: string; platform: string; views: number; likes: number
  comments: number; est_earnings: number; status: string; campaign_name: string
  campaign_slug: string; thumbnail_url: string; created_at: string
  verification_status: string; verification_note: string; submission_token: string
  verification_video_url: string; scrape_status: string
}

export type ClipperDashboard = {
  email: string; name: string; has_payment_method: boolean; stats: ClipperStats
  campaigns: ClipperCampaign[]; submissions: ClipperSubmission[]
}

export type PaymentSettings = {
  payment_method: string; whop_username: string
  paypal_email: string; solana_address: string
}

export type ClipperCampaignOption = {
  id: number; name: string; slug: string; accepted_platforms: string
  requirements_url: string; cpm_rate: number
}

export type ClipperBulkSubmitResult = {
  detail: string; added: number; skipped: number
  results: { post_url: string; status: string; reason: string }[]
}

export const clipperApi = {
  dashboard: (token: string) =>
    apiFetch<ClipperDashboard>(`/api/clipper/${token}/dashboard`),
  dashboardAuth: (jwtToken: string) =>
    apiFetch<ClipperDashboard>(`/api/clipper/dashboard`, { token: jwtToken }),
  resolve: (submissionToken: string) =>
    apiFetch<{ creator_token: string }>(`/api/clipper/resolve/${submissionToken}`),
  campaigns: (jwtToken: string) =>
    apiFetch<ClipperCampaignOption[]>(`/api/clipper/campaigns`, { token: jwtToken }),
  bulkSubmit: (jwtToken: string, campaignId: number, urls: string[]) =>
    apiFetch<ClipperBulkSubmitResult>(`/api/clipper/bulk-submit`, {
      token: jwtToken,
      method: "POST",
      body: JSON.stringify({ campaign_id: campaignId, urls }),
    }),
  claimPayment: (jwtToken: string, submissionId: number) =>
    apiFetch<{ detail: string; submission_id: number }>(`/api/clipper/claim-payment`, {
      token: jwtToken,
      method: "POST",
      body: JSON.stringify({ submission_id: submissionId }),
    }),
  submissionStatus: (jwtToken: string, submissionId: number) =>
    apiFetch<{ id: number; scrape_status: string; views: number; est_earnings: number; status: string }>(`/api/clipper/submission-status/${submissionId}`, { token: jwtToken }),
  getPaymentSettings: (jwtToken: string) =>
    apiFetch<PaymentSettings>(`/api/clipper/settings/payment`, { token: jwtToken }),
  updatePaymentSettings: (jwtToken: string, data: {
    payment_method: string; whop_username?: string
    paypal_email?: string; solana_address?: string
  }) =>
    apiFetch<PaymentSettings & { detail: string }>(`/api/clipper/settings/payment`, {
      token: jwtToken,
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// ── Clipper Auth ─────────────────────────────────────
export const clipperAuth = {
  login: (email: string, password: string) =>
    apiFetch<{ status: string; email?: string; access_token?: string; token_type?: string }>("/api/clipper/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  setPassword: (email: string, password: string) =>
    apiFetch<{ status: string; access_token: string; token_type: string }>("/api/clipper/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  sendCode: (email: string) =>
    apiFetch<{ detail: string }>("/api/clipper/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyCode: (email: string, code: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/api/clipper/auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  me: (token: string) =>
    apiFetch<{ id: number; email: string; name: string; is_active: boolean; created_at: string }>("/api/clipper/auth/me", { token }),
  chatToken: (token: string) =>
    apiFetch<{ chat_token: string }>("/api/clipper/auth/chat-token", { token }),
}

// ── Settings ──────────────────────────────────────────────
export type Setting = { key: string; value: string }

export type ApifyUsageLog = {
  id: number; platform: string; url_count: number; est_cost: number
  run_id: string; run_type: string; created_at: string
}

export type ApifyUsageResponse = {
  items: ApifyUsageLog[]
  total: number; page: number; per_page: number; pages: number
  summary: { total_urls: number; total_cost: number; total_runs: number }
}

// ── Verification ─────────────────────────────────────────
export type VerificationStatus = {
  status: string | null
  note: string | null
  has_video: boolean
}

export const verification = {
  upload: async (token: string, submissionId: number, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    form.append("video", file)
    return new Promise<{ status: string; message: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `${API_URL}/api/submissions/${submissionId}/upload-verification?token=${encodeURIComponent(token)}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).detail || `Upload failed (${xhr.status})`)) }
          catch { reject(new Error(`Upload failed (${xhr.status})`)) }
        }
      }
      xhr.onerror = () => reject(new Error("Network error during upload"))
      xhr.send(form)
    })
  },
  status: (submissionToken: string, submissionId: number) =>
    apiFetch<VerificationStatus>(`/api/submissions/${submissionId}/verification-status?token=${encodeURIComponent(submissionToken)}`, {}),
  video: (token: string, submissionId: number) =>
    apiFetch<{ url: string; status: string }>(`/api/submissions/${submissionId}/verification-video`, { token }),
  verify: (token: string, submissionId: number, data: { status: "verified" | "rejected"; note?: string }) =>
    apiFetch<Submission>(`/api/submissions/${submissionId}/verify`, { token, method: "POST", body: JSON.stringify(data) }),
}

export const settingsApi = {
  list: (token: string) =>
    apiFetch<Setting[]>("/api/settings", { token }),
  update: (token: string, data: Record<string, string>) =>
    apiFetch<{ detail: string }>("/api/settings", { token, method: "PUT", body: JSON.stringify({ settings: data }) }),
  apifyUsage: (token: string, page = 1, perPage = 20) =>
    apiFetch<ApifyUsageResponse>(`/api/settings/apify-usage?page=${page}&per_page=${perPage}`, { token }),
}
