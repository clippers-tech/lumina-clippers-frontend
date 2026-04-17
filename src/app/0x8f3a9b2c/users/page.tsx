"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"
import {
  users as usersApi,
  campaigns as campaignsApi,
  type UserDetail,
  type Campaign,
} from "@/lib/api"
import { AdminTabs } from "@/components/admin/AdminTabs"
import { AdminGuard } from "@/components/admin/AdminGuard"
import { LoadingState } from "@/components/admin/LoadingState"
import { EmptyState } from "@/components/admin/EmptyState"
import { Plus, Pencil, Trash2, X, Check, Copy } from "lucide-react"

type UserForm = {
  name: string
  email: string
  password: string
  role: string
  campaign_ids: string
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  campaign_ids: "",
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState<UserDetail[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([])
  const [copiedUserId, setCopiedUserId] = useState<number | null>(null)

  const getInviteLink = (user: UserDetail) => {
    const encoded = btoa(user.email).replace(/=/g, "")
    return `https://portal.luminaclippers.com/cx0-auth-8f3a?u=${encoded}`
  }

  const handleCopyInviteLink = (user: UserDetail) => {
    navigator.clipboard.writeText(getInviteLink(user))
    setCopiedUserId(user.id)
    setTimeout(() => setCopiedUserId(null), 2000)
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    Promise.all([usersApi.list(token), campaignsApi.list(token)])
      .then(([usersData, campaignsData]) => {
        setUsersList(usersData)
        setCampaigns(campaignsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openAddModal = useCallback(() => {
    setEditingUser(null)
    setForm(emptyForm)
    setSelectedCampaignIds([])
    setFormError("")
    setShowModal(true)
  }, [])

  const openEditModal = useCallback((user: UserDetail) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      campaign_ids: user.campaign_ids || "",
    })
    const ids = user.campaign_ids
      ? user.campaign_ids
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : []
    setSelectedCampaignIds(ids)
    setFormError("")
    setShowModal(true)
  }, [])

  const toggleCampaign = useCallback((campaignId: number) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    )
  }, [])

  const handleSubmit = useCallback(async () => {
    const token = getToken()
    if (!token) return
    setFormLoading(true)
    setFormError("")

    const campaignIdsStr = selectedCampaignIds.join(",")

    try {
      if (editingUser) {
        // Update
        const updateData: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          campaign_ids: campaignIdsStr,
        }
        if (form.password) updateData.password = form.password
        const updated = await usersApi.update(token, editingUser.id, updateData)
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updated : u))
        )
      } else {
        // Create
        const newUser = await usersApi.create(token, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          campaign_ids: campaignIdsStr,
        })
        setUsersList((prev) => [...prev, newUser])
      }
      setShowModal(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save user")
    } finally {
      setFormLoading(false)
    }
  }, [editingUser, form, selectedCampaignIds])

  const handleDelete = useCallback(async (user: UserDetail) => {
    if (!confirm(`Delete user "${user.name || user.email}"? This cannot be undone.`))
      return
    const token = getToken()
    if (!token) return
    try {
      await usersApi.delete(token, user.id)
      setUsersList((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-green-400/10 text-green-400",
      viewer: "bg-blue-400/10 text-blue-400",
      manager: "bg-purple-400/10 text-purple-400",
    }
    return styles[role] || "bg-zinc-400/10 text-zinc-400"
  }

  return (
    <AdminGuard>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1">
              Admin Panel
            </p>
            <h1 className="text-2xl font-bold text-zinc-100">User Management</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manage team members and access
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        <div className="mt-6 mb-6">
          <AdminTabs />
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-[2px] overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : usersList.length === 0 ? (
            <EmptyState message="No users found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      User
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Role
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Campaigns
                    </th>
                    <th className="text-center text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Status
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Invite Link
                    </th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Created
                    </th>
                    <th className="text-right text-[10px] uppercase tracking-wider text-zinc-600 font-bold px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-zinc-100">
                          {user.name || "-"}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${roleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {user.campaigns && user.campaigns.length > 0 ? (
                            user.campaigns.map((name, i) => (
                              <span
                                key={i}
                                className="bg-white/[0.05] text-zinc-400 text-[10px] font-mono px-1.5 py-0.5 rounded"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-zinc-600">
                              {user.role === "admin" ? "All" : "None"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            user.is_active ? "bg-green-400" : "bg-zinc-600"
                          }`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[160px]">
                            {getInviteLink(user)}
                          </span>
                          <button
                            onClick={() => handleCopyInviteLink(user)}
                            className="w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:text-green-400 transition-colors shrink-0"
                            title="Copy invite link"
                          >
                            {copiedUserId === user.id ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-zinc-500">
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0d2e1c]/95 border border-white/[0.06] backdrop-blur-md rounded-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-100">
                  {editingUser ? "Edit User" : "Add User"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Password{editingUser ? " (leave blank to keep)" : ""}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors"
                    placeholder={editingUser ? "Leave blank to keep current" : "Password"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="w-full bg-white/[0.05] border border-white/[0.08] text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-400/30 transition-colors appearance-none"
                  >
                    <option value="admin" className="bg-[#0d2e1c]">
                      Admin
                    </option>
                    <option value="viewer" className="bg-[#0d2e1c]">
                      Viewer
                    </option>
                    <option value="manager" className="bg-[#0d2e1c]">
                      Manager
                    </option>
                  </select>
                </div>

                {/* Campaign multi-select */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">
                    Campaign Access
                  </label>
                  <p className="text-[11px] text-zinc-600 mb-2">
                    Select campaigns this user can access. Admins have access to all.
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.02]">
                    {campaigns.length === 0 ? (
                      <p className="text-sm text-zinc-500 p-3">No campaigns available</p>
                    ) : (
                      campaigns.map((campaign) => {
                        const isSelected = selectedCampaignIds.includes(campaign.id)
                        return (
                          <button
                            key={campaign.id}
                            type="button"
                            onClick={() => toggleCampaign(campaign.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-white/[0.04] last:border-b-0 ${
                              isSelected
                                ? "bg-green-400/5"
                                : "hover:bg-white/[0.02]"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? "bg-green-400 text-black"
                                  : "border border-white/[0.15]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm text-zinc-100 truncate">
                                {campaign.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono">
                                {campaign.slug}
                              </p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                  {selectedCampaignIds.length > 0 && (
                    <p className="text-[11px] text-green-400/60 mt-1.5">
                      {selectedCampaignIds.length} campaign
                      {selectedCampaignIds.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={formLoading || !form.name || !form.email || (!editingUser && !form.password)}
                  className="bg-green-400 text-black text-xs font-extrabold px-5 py-2.5 rounded-lg uppercase tracking-wide shadow-[0_0_25px_-5px_rgba(74,222,128,0.4)] hover:bg-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
