"use client"

const CLIPPER_TOKEN_KEY = "clipper_token"

export function getClipperToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CLIPPER_TOKEN_KEY)
}

export function setClipperToken(token: string): void {
  localStorage.setItem(CLIPPER_TOKEN_KEY, token)
}

export function clearClipperToken(): void {
  localStorage.removeItem(CLIPPER_TOKEN_KEY)
}

export function isClipperAuthenticated(): boolean {
  return !!getClipperToken()
}
