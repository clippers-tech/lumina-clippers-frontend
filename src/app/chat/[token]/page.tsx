"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { Send, Plus, X, ArrowLeft, MessageSquare } from "lucide-react"
import { chat, type CreatorInboxThread, type CreatorThreadDetail } from "@/lib/api"
import { platformIcon } from "@/lib/utils"
import { ClipperNav } from "@/components/clipper/ClipperNav"
import { useToast } from "@/components/ui/toast"

/* ── Thread List ──────────────────────────────────────── */
function ThreadList({
  threads,
  selectedId,
  onSelect,
  onNewThread,
}: {
  threads: CreatorInboxThread[]
  selectedId: number | null
  onSelect: (id: number) => void
  onNewThread: () => void
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-200">Messages</h2>
        <button
          onClick={onNewThread}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-lime-400/10 text-lime-400 text-[10px] font-bold uppercase tracking-wider hover:bg-lime-400/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {threads.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No messages yet</p>
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelect(thread.id)}
              className={`w-full text-left p-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors ${
                selectedId === thread.id ? "bg-white/[0.05] border-l-2 border-l-lime-400" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {thread.category}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  thread.status === "open"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-500/20 text-zinc-400"
                }`}>
                  {thread.status}
                </span>
              </div>
              <p className="text-xs text-zinc-300 truncate">
                {thread.submission.campaign_name} - {platformIcon(thread.submission.platform)} {thread.submission.platform}
              </p>
              {thread.last_message && (
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {thread.last_message.sender_type === "creator" ? "You: " : "Admin: "}
                  {thread.last_message.body}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

/* ── Conversation View ────────────────────────────────── */
function ConversationView({
  thread,
  creatorToken,
  onBack,
  onMessageSent,
}: {
  thread: CreatorThreadDetail
  creatorToken: string
  onBack: () => void
  onMessageSent: () => void
}) {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)
    try {
      await chat.creatorInboxSendMessage(creatorToken, thread.id, message.trim())
      setMessage("")
      onMessageSent()
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "error",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Thread Header */}
      <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded hover:bg-white/[0.05] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200">{thread.submission.campaign_name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{thread.category}</span>
          </div>
          <a
            href={thread.submission.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-500 hover:text-lime-400 truncate block transition-colors"
          >
            {platformIcon(thread.submission.platform)} {thread.submission.post_url}
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {thread.messages.map((msg) => {
          const isCreator = msg.sender_type === "creator"
          return (
            <div
              key={msg.id}
              className={`flex ${isCreator ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-3 py-2 ${
                  isCreator
                    ? "bg-lime-400/10 border border-lime-400/20 text-zinc-100"
                    : "bg-white/[0.05] border border-white/[0.06] text-zinc-200"
                }`}
              >
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                <p className="text-[9px] text-zinc-500 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/[0.04]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600 transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="bg-lime-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── New Thread Modal ─────────────────────────────────── */
function NewThreadModal({
  creatorToken,
  onClose,
  onCreated,
}: {
  creatorToken: string
  onClose: () => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<Array<{ id: number; post_url: string; platform: string; thumbnail_url: string; campaign_name: string; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null)
  const [category, setCategory] = useState("general")
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    chat.creatorSubmissions(creatorToken)
      .then(setSubmissions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [creatorToken])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission || !message.trim()) return
    setCreating(true)
    try {
      await chat.creatorCreateThread(creatorToken, {
        submission_id: selectedSubmission,
        category,
        message: message.trim(),
      })
      toast({ description: "Thread created!", variant: "success" })
      onCreated()
      onClose()
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Failed to create thread",
        variant: "error",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-xl border border-white/[0.04] bg-[#0a0a0a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <h3 className="text-sm font-bold text-zinc-200">New Conversation</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.05] transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-4">
          {/* Submission Picker */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
              Submission
            </label>
            {loading ? (
              <div className="text-xs text-zinc-500">Loading submissions...</div>
            ) : (
              <select
                value={selectedSubmission ?? ""}
                onChange={(e) => setSelectedSubmission(Number(e.target.value) || null)}
                className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 transition-colors"
              >
                <option value="">Select submission...</option>
                {submissions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {platformIcon(s.platform)} {s.campaign_name} - {s.post_url.slice(0, 50)}...
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 transition-colors"
            >
              <option value="general">General</option>
              <option value="payment">Payment</option>
              <option value="stats">Stats Issue</option>
              <option value="content">Content</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Describe your question or issue..."
              className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-lime-400/30 placeholder:text-zinc-600 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/[0.06] bg-transparent text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !selectedSubmission || !message.trim()}
              className="flex-1 bg-lime-400 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(163,230,53,0.4)] hover:bg-lime-300 transition-all disabled:opacity-40"
            >
              {creating ? "Creating..." : "Create Thread"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Chat Page ───────────────────────────────────── */
export default function CreatorInboxPage() {
  const params = useParams()
  const creatorToken = params.token as string
  const { toast } = useToast()

  const [threads, setThreads] = useState<CreatorInboxThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null)
  const [threadDetail, setThreadDetail] = useState<CreatorThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewThread, setShowNewThread] = useState(false)

  const loadThreads = useCallback(async () => {
    try {
      const data = await chat.creatorInbox(creatorToken)
      setThreads(data)
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Failed to load messages",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [creatorToken, toast])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  const loadThreadDetail = useCallback(async (threadId: number) => {
    try {
      const detail = await chat.creatorThreadDetail(creatorToken, threadId)
      setThreadDetail(detail)
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Failed to load thread",
        variant: "error",
      })
    }
  }, [creatorToken, toast])

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId)
    }
  }, [selectedThreadId, loadThreadDetail])

  const handleMessageSent = () => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId)
    }
    loadThreads()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-lime-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10">
        <ClipperNav />

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden h-[calc(100vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Thread List */}
              <div className={`md:border-r border-white/[0.04] ${selectedThreadId ? "hidden md:block" : ""}`}>
                <ThreadList
                  threads={threads}
                  selectedId={selectedThreadId}
                  onSelect={setSelectedThreadId}
                  onNewThread={() => setShowNewThread(true)}
                />
              </div>

              {/* Conversation */}
              <div className={`md:col-span-2 ${!selectedThreadId ? "hidden md:flex md:items-center md:justify-center" : ""}`}>
                {selectedThreadId && threadDetail ? (
                  <ConversationView
                    thread={threadDetail}
                    creatorToken={creatorToken}
                    onBack={() => {
                      setSelectedThreadId(null)
                      setThreadDetail(null)
                    }}
                    onMessageSent={handleMessageSent}
                  />
                ) : (
                  <div className="text-center py-20">
                    <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">Select a conversation to view</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <NewThreadModal
          creatorToken={creatorToken}
          onClose={() => setShowNewThread(false)}
          onCreated={loadThreads}
        />
      )}
    </div>
  )
}
