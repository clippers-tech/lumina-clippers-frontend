"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { getToken } from "@/lib/auth"
import {
  chat as chatApi,
  type ChatThread,
  type ChatThreadDetail,
  type ChatMessage,
} from "@/lib/api"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { LoadingState } from "@/components/admin/LoadingState"
import {
  Search,
  Send,
  MessageSquare,
  Plus,
  X,
  CheckCircle,
  Clock,
  Archive,
  ExternalLink,
  User,
} from "lucide-react"

// ── New Thread Modal ──────────────────────────────────────

function NewThreadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (thread: ChatThread) => void
}) {
  const [search, setSearch] = useState("")
  const [submissions, setSubmissions] = useState<
    Array<{
      id: number
      post_url: string
      platform: string
      thumbnail_url: string
      clipper_email: string
      clipper_name: string
      campaign_name: string
      status: string
    }>
  >([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null)
  const [category, setCategory] = useState("general")
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setSearchLoading(true)
    const timer = setTimeout(() => {
      chatApi
        .searchSubmissions(token, search || undefined)
        .then(setSubmissions)
        .catch(console.error)
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = useCallback(async () => {
    if (!selectedSubmission || !message.trim()) return
    const token = getToken()
    if (!token) return
    setCreating(true)
    try {
      const thread = await chatApi.createThread(token, {
        submission_id: selectedSubmission,
        category,
        message: message.trim(),
      })
      onCreated(thread)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }, [selectedSubmission, category, message, onCreated])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a]/95 border border-white/[0.06] backdrop-blur-md rounded-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-100">New Thread</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submission search */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
            Submission
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL, email, or campaign..."
              className="w-full pl-9 bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
            />
          </div>
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.02]">
            {searchLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-zinc-500 p-3">No submissions found</p>
            ) : (
              submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-white/[0.04] last:border-b-0 transition-colors ${
                    selectedSubmission === sub.id
                      ? "bg-green-400/5"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <p className="text-sm text-zinc-100 truncate">{sub.post_url}</p>
                  <p className="text-[10px] text-zinc-500">
                    {sub.clipper_email} &middot; {sub.campaign_name} &middot;{" "}
                    <span className="bg-green-400/10 text-green-400 px-1 rounded">
                      {sub.platform}
                    </span>
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors appearance-none"
          >
            <option value="general" className="bg-[#0a0a0a]">
              General
            </option>
            <option value="payment" className="bg-[#0a0a0a]">
              Payment
            </option>
            <option value="issue" className="bg-[#0a0a0a]">
              Issue
            </option>
            <option value="revision" className="bg-[#0a0a0a]">
              Revision
            </option>
          </select>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !selectedSubmission || !message.trim()}
            className="bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Thread"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Status helpers ────────────────────────────────────────

function statusIcon(status: string) {
  switch (status) {
    case "open":
      return <Clock className="w-3.5 h-3.5 text-yellow-400" />
    case "resolved":
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
    case "archived":
      return <Archive className="w-3.5 h-3.5 text-zinc-500" />
    default:
      return <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
  }
}

function categoryBadge(category: string) {
  const styles: Record<string, string> = {
    general: "bg-blue-400/10 text-blue-400",
    payment: "bg-green-400/10 text-green-400",
    issue: "bg-red-400/10 text-red-400",
    revision: "bg-orange-400/10 text-orange-400",
  }
  return styles[category] || "bg-zinc-400/10 text-zinc-400"
}

// ── Chat Content (inner component used with Suspense) ────

function ChatContent() {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [selectedThread, setSelectedThread] = useState<ChatThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch threads
  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    chatApi
      .threads(token, filterStatus || undefined, debouncedSearch || undefined)
      .then(setThreads)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filterStatus, debouncedSearch])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedThread?.messages])

  const handleSelectThread = useCallback(async (threadId: number) => {
    const token = getToken()
    if (!token) return
    setThreadLoading(true)
    try {
      const detail = await chatApi.thread(token, threadId)
      setSelectedThread(detail)
    } catch (err) {
      console.error(err)
    } finally {
      setThreadLoading(false)
    }
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!selectedThread || !newMessage.trim()) return
    const token = getToken()
    if (!token) return
    setSending(true)
    try {
      const msg = await chatApi.sendMessage(
        token,
        selectedThread.id,
        newMessage.trim()
      )
      setSelectedThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev
      )
      setNewMessage("")
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }, [selectedThread, newMessage])

  const handleUpdateStatus = useCallback(
    async (status: string) => {
      if (!selectedThread) return
      const token = getToken()
      if (!token) return
      try {
        await chatApi.updateThread(token, selectedThread.id, status)
        setSelectedThread((prev) => (prev ? { ...prev, status } : prev))
        setThreads((prev) =>
          prev.map((t) =>
            t.id === selectedThread.id ? { ...t, status } : t
          )
        )
      } catch (err) {
        console.error(err)
      }
    },
    [selectedThread]
  )

  const handleThreadCreated = useCallback(
    (thread: ChatThread) => {
      setThreads((prev) => [thread, ...prev])
      setShowNewThread(false)
      handleSelectThread(thread.id)
    },
    [handleSelectThread]
  )

  const timeAgo = (dateStr: string) => {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = now - then
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "now"
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
          Admin Panel
        </p>
        <h1 className="text-2xl font-bold text-zinc-100">Chat</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Communicate with creators about their submissions
        </p>
      </div>
      <div className="mt-6 mb-6">
        <AdminTabs />
      </div>

      {/* 3-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ height: "calc(100vh - 300px)" }}>
        {/* Panel 1: Thread list */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] flex flex-col overflow-hidden">
          {/* Thread controls */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full pl-8 bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-green-400/30 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowNewThread(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-400 text-black hover:bg-green-300 transition-all flex-shrink-0"
                title="New thread"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1">
              {["", "open", "resolved", "archived"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                    filterStatus === s
                      ? "bg-green-400/10 text-green-400"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingState />
            ) : threads.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No threads found</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`w-full text-left px-3 py-3 border-b border-white/[0.04] transition-colors ${
                    selectedThread?.id === thread.id
                      ? "bg-green-400/5"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {statusIcon(thread.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-medium text-zinc-100 truncate">
                          {thread.submission.clipper_name ||
                            thread.submission.clipper_email}
                        </p>
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">
                          {timeAgo(thread.updated_at)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {thread.submission.campaign_name}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${categoryBadge(
                            thread.category
                          )}`}
                        >
                          {thread.category}
                        </span>
                      </div>
                      {thread.last_message && (
                        <p className="text-[11px] text-zinc-500 truncate mt-1">
                          {thread.last_message.sender_type === "admin" && (
                            <span className="text-green-400/60">You: </span>
                          )}
                          {thread.last_message.body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel 2: Conversation */}
        <div className="lg:col-span-6 rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] flex flex-col overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">
                  Select a thread to view the conversation
                </p>
              </div>
            </div>
          ) : threadLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-zinc-100 truncate">
                      {selectedThread.submission.clipper_name ||
                        selectedThread.submission.clipper_email}
                    </p>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${categoryBadge(
                        selectedThread.category
                      )}`}
                    >
                      {selectedThread.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {selectedThread.submission.campaign_name} &middot;{" "}
                    {selectedThread.submission.platform}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedThread.submission.post_url && (
                    <a
                      href={selectedThread.submission.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-all"
                      title="Open post"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <select
                    value={selectedThread.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400/30 transition-colors appearance-none"
                  >
                    <option value="open" className="bg-[#0a0a0a]">Open</option>
                    <option value="resolved" className="bg-[#0a0a0a]">Resolved</option>
                    <option value="archived" className="bg-[#0a0a0a]">Archived</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedThread.messages.map((msg: ChatMessage) => {
                  const isAdmin = msg.sender_type === "admin"
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${
                          isAdmin
                            ? "bg-green-400/10 border border-green-400/10"
                            : "bg-white/[0.04] border border-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isAdmin ? "text-green-400/70" : "text-zinc-500"
                            }`}
                          >
                            {isAdmin ? "Admin" : msg.sender_email}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {timeAgo(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-white/[0.06]">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-400 text-black hover:bg-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Panel 3: Creator sidebar */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] flex flex-col overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">
                  Select a thread to view creator info
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Creator info */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Creator
                </h3>
                <p className="text-sm font-medium text-zinc-100">
                  {selectedThread.submission.clipper_name || "Unknown"}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {selectedThread.submission.clipper_email}
                </p>
              </div>

              {/* Submission info */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Submission
                </h3>
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-400/10 text-green-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {selectedThread.submission.platform}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        selectedThread.submission.status === "paid"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : selectedThread.submission.status === "rejected"
                          ? "bg-red-400/10 text-red-400"
                          : "bg-yellow-400/10 text-yellow-400"
                      }`}
                    >
                      {selectedThread.submission.status}
                    </span>
                  </div>
                  {selectedThread.submission.post_url && (
                    <a
                      href={selectedThread.submission.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-green-400 hover:underline truncate block"
                    >
                      {selectedThread.submission.post_url}
                    </a>
                  )}
                  <p className="text-[11px] text-zinc-500">
                    Campaign: {selectedThread.submission.campaign_name}
                  </p>
                </div>
              </div>

              {/* Creator stats */}
              {selectedThread.creator_stats && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    Creator Stats
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">Submissions</span>
                      <span className="text-sm font-mono text-zinc-100">
                        {selectedThread.creator_stats.total_submissions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">Verified</span>
                      <span className="text-sm font-mono text-zinc-100">
                        {selectedThread.creator_stats.verified_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">Total Views</span>
                      <span className="text-sm font-mono text-zinc-100">
                        {selectedThread.creator_stats.total_views?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">Total Paid</span>
                      <span className="text-sm font-mono text-green-400">
                        ${selectedThread.creator_stats.total_paid?.toFixed(2)}
                      </span>
                    </div>
                    {selectedThread.creator_stats.first_submission_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">First Submission</span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {new Date(
                            selectedThread.creator_stats.first_submission_at
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {selectedThread.creator_stats.last_submission_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">Last Submission</span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {new Date(
                            selectedThread.creator_stats.last_submission_at
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thread info */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  Thread
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Status</span>
                    <div className="flex items-center gap-1">
                      {statusIcon(selectedThread.status)}
                      <span className="text-[11px] text-zinc-300 capitalize">
                        {selectedThread.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Category</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${categoryBadge(
                        selectedThread.category
                      )}`}
                    >
                      {selectedThread.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Messages</span>
                    <span className="text-sm font-mono text-zinc-100">
                      {selectedThread.messages.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Created</span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {new Date(selectedThread.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <NewThreadModal
          onClose={() => setShowNewThread(false)}
          onCreated={handleThreadCreated}
        />
      )}
    </div>
  )
}

// ── Main Page Export ──────────────────────────────────────

export default function ChatPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<LoadingState />}>
        <ChatContent />
      </Suspense>
    </AdminGuard>
  )
}
