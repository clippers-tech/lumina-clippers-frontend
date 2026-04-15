"use client"

import { createContext, useContext } from "react"

export type AppUser = {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  campaign_ids: string
}

type UserContextType = {
  user: AppUser | null
  isViewer: boolean
  isAdmin: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  isViewer: false,
  isAdmin: false,
})

export function UserProvider({
  user,
  children,
}: {
  user: AppUser | null
  children: React.ReactNode
}) {
  const isViewer = user?.role === "viewer"
  const isAdmin = user?.role === "admin"
  return (
    <UserContext.Provider value={{ user, isViewer, isAdmin }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
