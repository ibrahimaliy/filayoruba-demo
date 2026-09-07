"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  Crown,
  Shield,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Lock,
  Mail,
  User,
  Key,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import ConfirmDialog, { ConfirmDialogVariant } from "@/components/admin/ConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";
import { toast } from "sonner";

interface AdminTeamMember {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CurrentUserSession {
  id?: string;
  email?: string;
  name?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER";
}

export default function AdminTeamPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);
  const [team, setTeam] = useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedTeam = team.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN" as "SUPER_ADMIN" | "ADMIN",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetModalMember, setResetModalMember] = useState<AdminTeamMember | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: ConfirmDialogVariant;
    highlightText?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/admin/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      } else if (res.status === 403) {
        // Not a super admin
        setTeam([]);
      }
    } catch (err) {
      console.error("Failed to load admin team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchTeam();
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      setAddError("All fields are required.");
      return;
    }

    if (addForm.password.length < 8) {
      setAddError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      setAddError(null);

      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Team Member Added", {
          description: data.message || `Admin ${addForm.name} created successfully.`,
        });
        setIsAddModalOpen(false);
        setAddForm({ name: "", email: "", password: "", role: "ADMIN" });
        fetchTeam();
      } else {
        setAddError(data.message || "Failed to create team member.");
      }
    } catch {
      setAddError("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (member: AdminTeamMember) => {
    const nextStatus = !member.isActive;
    const actionText = nextStatus ? "activate" : "deactivate";

    setConfirmDialog({
      isOpen: true,
      title: `${nextStatus ? "Activate" : "Deactivate"} Administrator?`,
      description: `Are you sure you want to ${actionText} ${member.name} (${member.email})? ${
        !nextStatus ? "They will be immediately blocked from signing in." : "They will be able to access the admin portal."
      }`,
      confirmLabel: nextStatus ? "Activate Account" : "Deactivate Account",
      variant: nextStatus ? "info" : "danger",
      highlightText: member.name,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/team/${member.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: nextStatus }),
          });

          const data = await res.json();
          if (res.ok) {
            toast.success("Account Status Updated", {
              description: data.message || `Admin ${member.name} ${nextStatus ? "activated" : "deactivated"}.`,
            });
            fetchTeam();
          } else {
            toast.error("Status Update Failed", {
              description: data.message || "Failed to update account status.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleChangeRole = async (member: AdminTeamMember, newRole: "SUPER_ADMIN" | "ADMIN") => {
    if (member.role === newRole) return;

    setConfirmDialog({
      isOpen: true,
      title: `Change Role for ${member.name}?`,
      description: `Change role from ${member.role} to ${newRole}? ${
        newRole === "SUPER_ADMIN"
          ? "This will grant complete management permissions including team modifications and hard wipes."
          : "This will restrict team management and permanent wipe permissions."
      }`,
      confirmLabel: `Promote / Demote to ${newRole}`,
      variant: "info",
      highlightText: newRole,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/team/${member.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
          });

          const data = await res.json();
          if (res.ok) {
            toast.success("Role Changed", {
              description: data.message || `Role updated to ${newRole}.`,
            });
            fetchTeam();
          } else {
            toast.error("Role Update Failed", {
              description: data.message || "Failed to change role.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalMember) return;

    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      setResetError(null);

      const res = await fetch(`/api/admin/team/${resetModalMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password Reset", {
          description: `Password for ${resetModalMember.name} has been reset successfully.`,
        });
        setResetModalMember(null);
        setNewPassword("");
      } else {
        setResetError(data.message || "Failed to reset password.");
      }
    } catch {
      setResetError("Network error occurred while resetting password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = (member: AdminTeamMember) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Administrator Account?",
      description: `Are you sure you want to permanently delete ${member.name} (${member.email})? This action cannot be undone.`,
      confirmLabel: "Delete Account",
      variant: "danger",
      highlightText: member.email,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/team/${member.id}`, {
            method: "DELETE",
          });

          const data = await res.json();
          if (res.ok) {
            toast.success("Admin Removed", {
              description: `Admin account for ${member.name} was removed.`,
            });
            fetchTeam();
          } else {
            toast.error("Removal Failed", {
              description: data.message || "Failed to delete member.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        highlightText={confirmDialog.highlightText}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FED501]/10 text-[#8F7216] border border-[#FED501]/30 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-[#FED501]" /> Role-Based Access Control (RBAC)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000] mt-1">
            Admin Team & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Configure administrative permissions, assign Super Admin credentials, and manage team members.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchTeam}
            disabled={loading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setAddError(null);
                setAddForm({ name: "", email: "", password: "", role: "ADMIN" });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#000000] text-white hover:bg-[#262626] text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FED501]" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Permissions Matrix Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-[#000000] mb-3 sm:mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FED501]" /> Administrative Roles & Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
              <Crown className="w-4 h-4 text-[#FED501]" /> Super Admin Role
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              <li>Full store metrics & revenue analytics</li>
              <li>Order fulfillment pipeline & Paystack verification</li>
              <li>Product catalog, stock editing & media uploads</li>
              <li>Permanent hard-wipes & emptying trash bins</li>
              <li>Team management (Invite, promote/demote, suspend admins)</li>
            </ul>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4 text-blue-700" /> Artisan Admin Role
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              <li>Executive dashboard & store metrics</li>
              <li>Order fulfillment lifecycle (Crafting, Dispatched, Delivered)</li>
              <li>Live Paystack payment verification</li>
              <li>Product catalog & stock adjustments</li>
              <li>Soft-trash & restoration (Permanent delete restricted)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Non-Super Admin Warning */}
      {!isSuperAdmin && currentUser && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            You are logged in as an <strong>Artisan Admin</strong>. Team configuration and account modifications require <strong>Super Admin</strong> authorization.
          </span>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-300" />
            Loading administrative team...
          </div>
        ) : team.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">Team Directory</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isSuperAdmin
                ? "No team members configured yet. Click 'Add Team Member' to invite staff."
                : "Only Super Admins can view the full team directory."}
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARD LIST (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedTeam.map((member) => {
                const isMemberSuper = member.role === "SUPER_ADMIN";
                const isSelf = currentUser?.id === member.id;

                return (
                  <div key={member.id} className="p-3.5 space-y-3">
                    {/* Top Row: Avatar, Name, Email */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isMemberSuper
                              ? "bg-gradient-to-br from-[#FED501] to-[#EAB308] text-[#000000] shadow-sm"
                              : "bg-[#000000] text-white"
                          }`}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 truncate">
                            <span className="truncate">{member.name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on mobile */}
                      {isSuperAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setResetModalMember(member);
                              setNewPassword("");
                              setResetError(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors cursor-pointer"
                              title="Delete Admin User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Role & Status */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        {isSuperAdmin && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleChangeRole(member, e.target.value as "SUPER_ADMIN" | "ADMIN")
                            }
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${
                              isMemberSuper
                                ? "bg-[#FED501]/15 text-[#8F7216] border-[#FED501]/40"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            <option value="SUPER_ADMIN">👑 Super Admin</option>
                            <option value="ADMIN">🛡️ Artisan Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                              isMemberSuper
                                ? "bg-[#FED501]/15 text-[#8F7216] border-[#FED501]/40"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {isMemberSuper ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {isMemberSuper ? "Super Admin" : "Artisan Admin"}
                          </span>
                        )}
                      </div>

                      <div>
                        {isSuperAdmin && !isSelf ? (
                          <button
                            onClick={() => handleToggleActive(member)}
                            className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                          >
                            {member.isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
                              </span>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                              member.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.isActive ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {member.isActive ? "Active" : "Suspended"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP MULTI-COLUMN TABLE (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Administrator</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Member Since</th>
                    {isSuperAdmin && <th className="py-4 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTeam.map((member) => {
                    const isMemberSuper = member.role === "SUPER_ADMIN";
                    const isSelf = currentUser?.id === member.id;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Name & Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                isMemberSuper
                                  ? "bg-gradient-to-br from-[#FED501] to-[#EAB308] text-[#000000] shadow-sm"
                                  : "bg-[#000000] text-white"
                              }`}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge & Selector */}
                        <td className="py-4 px-6">
                          {isSuperAdmin && !isSelf ? (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleChangeRole(member, e.target.value as "SUPER_ADMIN" | "ADMIN")
                              }
                              className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none transition-all shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-[#FED501]/30 ${
                                isMemberSuper
                                  ? "bg-[#FED501]/15 text-[#8F7216] border-[#FED501]/40 hover:border-[#FED501]"
                                  : "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300"
                              }`}
                            >
                              <option value="SUPER_ADMIN">👑 Super Admin</option>
                              <option value="ADMIN">🛡️ Artisan Admin</option>
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                                isMemberSuper
                                  ? "bg-[#FED501]/15 text-[#8F7216] border-[#FED501]/40"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {isMemberSuper ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                              {isMemberSuper ? "Super Admin" : "Artisan Admin"}
                            </span>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="py-4 px-6">
                          {isSuperAdmin && !isSelf ? (
                            <button
                              onClick={() => handleToggleActive(member)}
                              className="flex items-center gap-1.5 focus:outline-none group cursor-pointer"
                              title={member.isActive ? "Click to deactivate" : "Click to activate"}
                            >
                              {member.isActive ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 group-hover:bg-emerald-100 transition-colors">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 group-hover:bg-rose-100 transition-colors">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Suspended
                                </span>
                              )}
                            </button>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                                member.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  member.isActive ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {member.isActive ? "Active" : "Suspended"}
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                          {new Date(member.createdAt).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        {isSuperAdmin && (
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setResetModalMember(member);
                                  setNewPassword("");
                                  setResetError(null);
                                }}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors cursor-pointer"
                                title="Reset Password"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteMember(member)}
                                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Admin User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <AdminPagination
              currentPage={currentPage}
              totalItems={team.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="members"
            />
          </>
        )}
      </div>

      {/* Add Team Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 border border-slate-200 shadow-2xl relative animate-scale-up space-y-4 sm:space-y-6">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3 sm:pb-4">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FED501]">
                Privilege Provisioning
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-1">
                Add Team Member
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provision a new administrator account with specific dashboard access permissions.
              </p>
            </div>

            {addError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oluwaseun Balogun"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FED501]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. artisan@filayoruba.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FED501]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Temporary Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters..."
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FED501]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm({ ...addForm, role: e.target.value as "SUPER_ADMIN" | "ADMIN" })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#FED501]/60 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FED501]/20 focus:border-[#FED501] transition-all cursor-pointer"
                >
                  <option value="ADMIN">🛡️ Artisan Admin (Fulfillment & Stock)</option>
                  <option value="SUPER_ADMIN">👑 Super Admin (Full Privileges)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#262626] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? "Creating Admin..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 border border-slate-200 shadow-2xl relative animate-scale-up space-y-4 sm:space-y-6">
            <button
              onClick={() => setResetModalMember(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3 sm:pb-4">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FED501]">
                Credential Reset
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-1">
                Reset Password
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Setting a new password for <strong>{resetModalMember.name}</strong> ({resetModalMember.email}).
              </p>
            </div>

            {resetError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min. 8 chars)..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FED501]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetModalMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#262626] transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
