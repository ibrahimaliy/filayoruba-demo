"use client";

import { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerAddress {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses?: CustomerAddress[];
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredSize, setPreferredSize] = useState("22.5");

  // New address state
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  // Address edit state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("Nigeria");
  const [savingAddressId, setSavingAddressId] = useState<string | null>(null);

  // Address delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/customer/profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          setProfile(data.profile);
          setFirstName(data.profile.firstName || "");
          setLastName(data.profile.lastName || "");
          setPhone(data.profile.phone || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Save profile information (Name, Phone, and optional unsubmitted new address)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload: {
        firstName: string;
        lastName: string;
        phone: string;
        newAddress?: { address: string; city: string; state: string };
      } = {
        firstName,
        lastName,
        phone,
      };

      if (showAddressForm && newAddress && newCity && newState) {
        payload.newAddress = {
          address: newAddress,
          city: newCity,
          state: newState,
        };
      }

      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Failed to update profile.");
        toast.error(data.message || "Failed to update profile.");
        setSaving(false);
        return;
      }

      setProfile(data.profile);
      setSuccessMessage("Your profile and preferences have been updated!");
      toast.success("Profile preferences saved!");
      setShowAddressForm(false);
      setNewAddress("");
      setNewCity("");
      setNewState("");
    } catch {
      setErrorMessage("Network error while updating profile.");
      toast.error("Network error while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  // Direct save for new address inside the address card section
  const handleDirectAddAddress = async () => {
    if (!newAddress.trim() || !newCity.trim() || !newState.trim()) {
      toast.error("Please fill in the street address, city, and state.");
      return;
    }

    setSavingNewAddress(true);
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: newAddress.trim(),
          city: newCity.trim(),
          state: newState.trim(),
          country: "Nigeria",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add address.");
        return;
      }

      if (data.profile) {
        setProfile(data.profile);
      } else if (data.address) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                addresses: [data.address, ...(prev.addresses || [])],
              }
            : null
        );
      }

      toast.success("Address added successfully!");
      setShowAddressForm(false);
      setNewAddress("");
      setNewCity("");
      setNewState("");
    } catch (err) {
      console.error("Error adding address:", err);
      toast.error("Network error while adding address.");
    } finally {
      setSavingNewAddress(false);
    }
  };

  // Start editing an address
  const handleStartEdit = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setEditAddress(addr.address);
    setEditCity(addr.city);
    setEditState(addr.state);
    setEditCountry(addr.country || "Nigeria");
    setConfirmDeleteId(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditAddress("");
    setEditCity("");
    setEditState("");
  };

  // Save edited address
  const handleSaveEdit = async (addrId: string) => {
    if (!editAddress.trim() || !editCity.trim() || !editState.trim()) {
      toast.error("Address, city, and state cannot be empty.");
      return;
    }

    setSavingAddressId(addrId);
    try {
      const res = await fetch(`/api/customer/addresses/${addrId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: editAddress.trim(),
          city: editCity.trim(),
          state: editState.trim(),
          country: editCountry.trim() || "Nigeria",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update address.");
        return;
      }

      if (data.profile) {
        setProfile(data.profile);
      } else {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                addresses: (prev.addresses || []).map((a) =>
                  a.id === addrId
                    ? {
                        ...a,
                        address: editAddress.trim(),
                        city: editCity.trim(),
                        state: editState.trim(),
                        country: editCountry.trim() || "Nigeria",
                      }
                    : a
                ),
              }
            : null
        );
      }

      toast.success("Address updated successfully!");
      setEditingAddressId(null);
    } catch (err) {
      console.error("Error updating address:", err);
      toast.error("Network error while updating address.");
    } finally {
      setSavingAddressId(null);
    }
  };

  // Start delete confirmation
  const handleStartDelete = (addrId: string) => {
    setConfirmDeleteId(addrId);
    if (editingAddressId === addrId) {
      setEditingAddressId(null);
    }
  };

  // Cancel delete confirmation
  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // Confirm delete address
  const handleConfirmDelete = async (addrId: string) => {
    setDeletingAddressId(addrId);
    try {
      const res = await fetch(`/api/customer/addresses/${addrId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete address.");
        return;
      }

      if (data.profile) {
        setProfile(data.profile);
      } else {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                addresses: (prev.addresses || []).filter((a) => a.id !== addrId),
              }
            : null
        );
      }

      toast.success("Address removed successfully!");
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error deleting address:", err);
      toast.error("Network error while deleting address.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#000000] mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading profile preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#000000]">Profile & Sizing Preferences</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details and custom head measurements for accurate artisan tailoring.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Personal Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#000000] border-b pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#000000]" /> Personal Information
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-[#000000] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-[#000000] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Used as your secure sign-in handle.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (WhatsApp Delivery Alerts)
              </label>
              <input
                type="tel"
                placeholder="e.g. +234 801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-[#000000] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Head Measurement & Sizing Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#000000] border-b pb-3 flex items-center justify-between">
            <span>Preferred Cap Measurement</span>
            <span className="text-xs font-semibold text-amber-500">Artisan Sizing</span>
          </h3>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard Nigerian Yoruba Fila caps fit around the forehead crown. Select your typical circumference size:
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {["21.0", "21.5", "22.0", "22.5", "23.0", "23.5", "24.0"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPreferredSize(size)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    preferredSize === size
                      ? "bg-[#000000] text-white border-[#000000] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {size}&quot;
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>How to measure:</strong> Wrap a flexible measuring tape around your head about 1 inch above your eyebrows and ears where your cap naturally rests.
              </span>
            </div>
          </div>
        </div>

        {/* Saved Addresses Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#000000]" /> Saved Delivery Addresses
            </h3>
            {!showAddressForm && (
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(true);
                  setEditingAddressId(null);
                  setConfirmDeleteId(null);
                }}
                className="text-xs font-semibold text-[#000000] hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            )}
          </div>

          {/* Add Address Subform */}
          {showAddressForm && (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#000000]" /> Add New Delivery Destination
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#000000] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#000000] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos State"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#000000] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDirectAddAddress}
                  disabled={savingNewAddress || !newAddress.trim() || !newCity.trim() || !newState.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#000000] hover:bg-[#1A1A1A] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {savingNewAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Address...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Address
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Saved Address List */}
          {profile?.addresses && profile.addresses.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {profile.addresses.map((addr) => {
                const isEditing = editingAddressId === addr.id;
                const isConfirmingDelete = confirmDeleteId === addr.id;
                const isDeleting = deletingAddressId === addr.id;
                const isSaving = savingAddressId === addr.id;

                if (isEditing) {
                  return (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border-2 border-black bg-white shadow-sm space-y-3 animate-in fade-in col-span-full sm:col-span-1"
                    >
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-[#000000]" /> Edit Delivery Address
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#000000] focus:outline-none"
                            placeholder="e.g. 15 Admiralty Way"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#000000] focus:outline-none"
                              placeholder="e.g. Lekki"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              State
                            </label>
                            <input
                              type="text"
                              value={editState}
                              onChange={(e) => setEditState(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#000000] focus:outline-none"
                              placeholder="e.g. Lagos State"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(addr.id)}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 rounded-lg bg-[#000000] hover:bg-[#1A1A1A] text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" /> Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={addr.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 block leading-snug">
                            {addr.address}
                          </span>
                          <span className="text-slate-600 block mt-0.5">
                            {addr.city}, {addr.state}
                          </span>
                          <span className="text-slate-400 block text-[11px] mt-0.5">
                            {addr.country || "Nigeria"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isConfirmingDelete ? (
                      <div className="mt-3 pt-2.5 border-t border-rose-100 bg-rose-50/80 p-2.5 rounded-lg space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Delete this address?</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(addr.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3" /> Yes, Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 justify-end">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(addr)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-black hover:bg-slate-200/70 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit this address"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartDelete(addr.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Delete this address"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No saved addresses. Your delivery addresses will be saved automatically during checkout or you can add one above.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-8 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-[#000000]/10 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
