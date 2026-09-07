"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookmarkCheck,
  Building2,
  Phone,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Order } from "@/types/order";

export interface CustomerSavedAddress {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface ChangeAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  customerEmail?: string;
  onSuccess: (updatedOrder: Order) => void;
}

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Oyo",
  "Ogun",
  "Osun",
  "Ondo",
  "Ekiti",
  "Rivers",
  "Delta",
  "Edo",
  "Kwara",
  "Kaduna",
  "Kano",
  "Enugu",
  "Anambra",
  "Akwa Ibom",
  "Cross River",
  "Imo",
  "Abia",
  "Plateau",
  "Benue",
  "Kogi",
  "Niger",
  "Nasarawa",
  "Bauchi",
  "Gombe",
  "Adamawa",
  "Sokoto",
  "Katsina",
  "Kebbi",
  "Zamfara",
  "Jigawa",
  "Borno",
  "Yobe",
  "Taraba",
  "Ebonyi",
  "Bayelsa",
];

export default function ChangeAddressModal({
  isOpen,
  onClose,
  order,
  customerEmail,
  onSuccess,
}: ChangeAddressModalProps) {
  const [mode, setMode] = useState<"saved" | "manual">("manual");
  const [savedAddresses, setSavedAddresses] = useState<CustomerSavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Form State
  const [streetAddress, setStreetAddress] = useState(order.address?.address || "");
  const [city, setCity] = useState(order.address?.city || "");
  const [state, setState] = useState(order.address?.state || "");
  const [country, setCountry] = useState(order.address?.country || "Nigeria");
  const [phone, setPhone] = useState(order.customer?.phone || "");
  const [saveToBook, setSaveToBook] = useState(false);

  // Email verification input for guests
  const [emailInput, setEmailInput] = useState(customerEmail || order.customer?.email || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch saved customer addresses if available
  useEffect(() => {
    let isMounted = true;

    async function loadSavedAddresses() {
      try {
        const res = await fetch("/api/customer/addresses");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.addresses) && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            setMode("saved");
            setSelectedSavedId(data.addresses[0]?.id || null);
          }
        }
      } catch {
        // Silently fallback to manual entry
      }
    }

    loadSavedAddresses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Keyboard Escape listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase();

  const handleSelectSaved = (addr: CustomerSavedAddress) => {
    setSelectedSavedId(addr.id);
    setStreetAddress(addr.address);
    setCity(addr.city);
    setState(addr.state);
    setCountry(addr.country || "Nigeria");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let finalAddress = streetAddress.trim();
    let finalCity = city.trim();
    let finalState = state.trim();
    let finalCountry = country.trim() || "Nigeria";

    if (mode === "saved" && selectedSavedId) {
      const selected = savedAddresses.find((a) => a.id === selectedSavedId);
      if (selected) {
        finalAddress = selected.address.trim();
        finalCity = selected.city.trim();
        finalState = selected.state.trim();
        finalCountry = selected.country || "Nigeria";
      }
    }

    if (!finalAddress || finalAddress.length < 3) {
      setErrorMessage("Please enter a valid street delivery address.");
      return;
    }
    if (!finalCity || finalCity.length < 2) {
      setErrorMessage("Please enter a valid city or town.");
      return;
    }
    if (!finalState || finalState.length < 2) {
      setErrorMessage("Please enter or select a state.");
      return;
    }

    const effectiveEmail = emailInput.trim() || customerEmail || order.customer?.email;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/customer/orders/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          email: effectiveEmail,
          address: finalAddress,
          city: finalCity,
          state: finalState,
          country: finalCountry,
          customerPhone: phone.trim() || undefined,
          saveToAddressBook: mode === "manual" ? saveToBook : false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update delivery address.");
      }

      toast.success("Delivery Address Updated", {
        description: `Order #${orderNum} destination has been updated to ${finalCity}, ${finalState}.`,
      });

      if (data.order) {
        onSuccess(data.order);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      toast.error("Address Update Failed", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 border border-slate-200 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <MapPin className="w-4 h-4 text-[#000000]" />
            </span>
            <span className="font-mono text-xs font-bold text-slate-500">
              #{orderNum}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {order.status === "crafting" ? "Handcrafting" : order.status}
            </span>
          </div>

          <h3 id="address-modal-title" className="text-lg font-bold text-[#000000] font-serif">
            Change Delivery Address
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Update where your bespoke Yoruba cap will be shipped before it is dispatched to the courier.
          </p>
        </div>

        {/* Informational Dispatch Policy Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Courier Dispatch Policy: </span>
            <span>
              Address updates are allowed while your cap is in crafting or awaiting courier hand-off. Once marked as <strong>Dispatched</strong>, courier shipping manifests are sealed.
            </span>
          </div>
        </div>

        {/* Mode Switcher: Saved vs Manual (if saved addresses exist) */}
        {savedAddresses.length > 0 && (
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("saved")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "saved"
                  ? "bg-white text-black shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Saved Addresses ({savedAddresses.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "manual"
                  ? "bg-white text-black shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Destination</span>
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "saved" && savedAddresses.length > 0 ? (
            /* Saved Address Cards */
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedAddresses.map((addr) => {
                const isSelected = selectedSavedId === addr.id;
                return (
                  <label
                    key={addr.id}
                    onClick={() => handleSelectSaved(addr)}
                    className={`p-3 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "border-[#000000] bg-slate-50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="space-y-0.5 text-xs min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{addr.address}</span>
                      </div>
                      <p className="text-slate-500 pl-5">
                        {addr.city}, {addr.state} &bull; {addr.country || "Nigeria"}
                      </p>
                    </div>

                    <input
                      type="radio"
                      name="savedAddress"
                      checked={isSelected}
                      onChange={() => handleSelectSaved(addr)}
                      className="w-4 h-4 accent-[#000000] mt-0.5 cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          ) : (
            /* Manual Address Form Inputs */
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Street Delivery Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Flat 4B, 15 Admiralty Way, Lekki Phase 1"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City / Town <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lekki / Ikeja"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="nigerian-states-list"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Lagos"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                  />
                  <datalist id="nigerian-states-list">
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 focus:outline-none cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Courier Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="080 1234 5678"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Guest Email Verification if needed */}
              {!customerEmail && !order.customer?.email && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Order Checkout Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com used during checkout"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                  />
                </div>
              )}

              {/* Save to address book checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={saveToBook}
                  onChange={(e) => setSaveToBook(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#000000] cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Save this address to my profile address book for future orders
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                  <span>Updating Address...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FED501]" />
                  <span>Save Delivery Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
