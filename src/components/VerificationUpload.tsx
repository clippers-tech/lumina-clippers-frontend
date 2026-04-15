"use client"

import { useState, useRef, useCallback } from "react"
import { verification, type VerificationStatus } from "@/lib/api"
import { VerificationBadge } from "@/components/admin/VerificationBadge"
import { Upload, CheckCircle, X, FileVideo } from "lucide-react"

const MAX_SIZE = 100 * 1024 * 1024 // 100MB
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"]
const ACCEPTED_EXTENSIONS = ".mp4,.mov,.webm"

interface VerificationUploadProps {
  submissionId: number
  token: string
  initialStatus?: VerificationStatus | null
}

export function VerificationUpload({ submissionId, token, initialStatus }: VerificationUploadProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(initialStatus ?? null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [uploadComplete, setUploadComplete] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showUploadZone, setShowUploadZone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const verificationStatus = status?.status || initialStatus?.status || "pending"
  const canUpload = verificationStatus === "pending" || verificationStatus === "uploaded" || verificationStatus === "rejected"
  const showDropZone = (verificationStatus === "pending" || showUploadZone) && !file && !uploading && !uploadComplete

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp4|mov|webm)$/i)) {
      return "Invalid file type. Please upload .mp4, .mov, or .webm"
    }
    if (f.size > MAX_SIZE) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum is 100MB.`
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    const err = validateFile(f)
    if (err) {
      setError(err)
      return
    }
    setError("")
    setFile(f)
    setUploadComplete(false)
  }, [validateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError("")
    try {
      await verification.upload(token, submissionId, file, setProgress)
      setUploadComplete(true)
      setFile(null)
      setShowUploadZone(false)
      setStatus({ status: "uploaded", note: null, has_video: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileVideo className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Upload Proof Video</h3>
        </div>
        <VerificationBadge status={verificationStatus} />
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Upload a screen recording showing your platform analytics (geo breakdown of views) for this submission.
      </p>

      {/* Hidden file input shared by all triggers */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFileSelect(f)
          e.target.value = ""
        }}
        className="hidden"
      />

      {/* Upload complete message */}
      {uploadComplete && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 mb-4">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-400">Verification video uploaded — pending review</p>
        </div>
      )}

      {/* Already has video indicator (not pending) */}
      {!uploadComplete && verificationStatus !== "pending" && (
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 mb-4">
          <div className="flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-300">Video uploaded</span>
          </div>
          {canUpload && (
            <button
              onClick={() => setShowUploadZone(true)}
              className="text-[10px] text-green-400 hover:text-green-300 font-bold uppercase tracking-wider transition-colors"
            >
              Re-upload
            </button>
          )}
        </div>
      )}

      {/* Rejection note */}
      {verificationStatus === "rejected" && status?.note && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 mb-4">
          <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-400">Rejected</p>
            <p className="text-xs text-red-400/80 mt-0.5">{status.note}</p>
          </div>
        </div>
      )}

      {/* Drag & drop zone */}
      {showDropZone && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-8 text-center ${
            dragOver
              ? "border-green-400/40 bg-green-400/5"
              : "border-white/[0.08] hover:border-green-400/40 hover:bg-white/[0.02]"
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? "text-green-400" : "text-zinc-600"}`} />
          <p className="text-sm text-zinc-300 mb-1">
            Drag & drop your video here, or <span className="text-green-400 font-semibold">click to browse</span>
          </p>
          <p className="text-[10px] text-zinc-600">.mp4, .mov, .webm — max 100MB</p>
        </div>
      )}

      {/* File selected — ready to upload */}
      {file && !uploading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileVideo className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-xs text-zinc-200 truncate">{file.name}</span>
              <span className="text-[10px] text-zinc-500 shrink-0">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
            </div>
            <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            className="w-full h-10 bg-green-400 text-black font-extrabold text-xs px-6 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
          >
            Upload Video
          </button>
        </div>
      )}

      {/* Uploading progress */}
      {uploading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Uploading...</span>
            <span className="font-mono text-green-400">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 mt-3">
          {error}
        </div>
      )}
    </div>
  )
}
