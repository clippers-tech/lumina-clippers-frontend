"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X } from "lucide-react"

export type ToastVariant = "default" | "success" | "error" | "warning"

type Toast = {
  id: string
  title?: string
  description: string
  variant?: ToastVariant
}

type ToastContextType = {
  toast: (opts: Omit<Toast, "id">) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-white/[0.08] bg-[#1a1a1a] text-white",
  success: "border-lime-400/20 bg-lime-400/10 text-lime-400",
  error: "border-red-500/20 bg-red-500/10 text-red-400",
  warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { ...opts, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={`toast-slide-in rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${VARIANT_STYLES[t.variant || "default"]}`}
            onOpenChange={(open) => { if (!open) removeToast(t.id) }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {t.title && (
                  <ToastPrimitive.Title className="text-sm font-semibold mb-0.5">
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                <ToastPrimitive.Description className="text-sm opacity-90">
                  {t.description}
                </ToastPrimitive.Description>
              </div>
              <ToastPrimitive.Close className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </ToastPrimitive.Close>
            </div>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[380px]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
