"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  shippingAddressSchema,
  ShippingAddressFormValues,
} from "@/lib/validations/checkout";
import { useCheckoutStore } from "@/store/checkout-store";
import { shippingZones, getZoneForState } from "@/data/shipping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedAddress {
  id: string;
  address: string;
  city: string;
  state: string;
  country?: string;
}

export default function ShippingStep() {
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const shippingZoneId = useCheckoutStore((state) => state.shippingZoneId);
  const setShippingAddress = useCheckoutStore((state) => state.setShippingAddress);
  const setShippingZone = useCheckoutStore((state) => state.setShippingZone);
  const nextStep = useCheckoutStore((state) => state.nextStep);
  const previousStep = useCheckoutStore((state) => state.previousStep);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShippingAddressFormValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      address: shippingAddress.address || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      shippingZoneId: shippingZoneId || "",
    },
  });

  // Auto-fill from saved profile addresses if available
  useEffect(() => {
    async function loadSavedAddresses() {
      try {
        let addresses: SavedAddress[] = [];
        const res = await fetch("/api/customer/addresses");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.addresses) && data.addresses.length > 0) {
            addresses = data.addresses;
          }
        }

        // Fallback to customer profile
        if (addresses.length === 0) {
          const profileRes = await fetch("/api/customer/profile");
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (Array.isArray(profileData.profile?.addresses) && profileData.profile.addresses.length > 0) {
              addresses = profileData.profile.addresses;
            }
          }
        }

        if (addresses.length > 0) {
          setSavedAddresses(addresses);

          // If no shipping address is currently chosen in the store, prefill with primary saved address
          if (!shippingAddress.address) {
            const defaultAddr = addresses[0];
            setSelectedSavedId(defaultAddr.id);

            const detectedZoneId = getZoneForState(defaultAddr.state) || shippingZoneId || "lagos";
            const zone = shippingZones.find((z) => z.id === detectedZoneId);

            const prefilled = {
              address: defaultAddr.address || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "",
              shippingZoneId: detectedZoneId,
            };

            reset(prefilled);
            setShippingAddress({
              address: defaultAddr.address,
              city: defaultAddr.city,
              state: defaultAddr.state,
            });

            if (zone) {
              setShippingZone(zone.id, zone.price);
            }
          } else {
            // Find if existing address matches a saved one
            const matched = addresses.find(
              (a) => a.address.trim().toLowerCase() === shippingAddress.address.trim().toLowerCase()
            );
            if (matched) {
              setSelectedSavedId(matched.id);
            }
          }
        }
      } catch {
        // Guest checkout fallback
      }
    }

    loadSavedAddresses();
  }, [shippingAddress.address, shippingZoneId, reset, setShippingAddress, setShippingZone]);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedSavedId(addr.id);
    const detectedZoneId = getZoneForState(addr.state) || shippingZoneId || "lagos";
    const zone = shippingZones.find((z) => z.id === detectedZoneId);

    const updated = {
      address: addr.address,
      city: addr.city,
      state: addr.state,
      shippingZoneId: detectedZoneId,
    };

    reset(updated);
    setShippingAddress({
      address: addr.address,
      city: addr.city,
      state: addr.state,
    });

    if (zone) {
      setShippingZone(zone.id, zone.price);
    }
  };

  function onSubmit(data: ShippingAddressFormValues) {
    const selectedZone = shippingZones.find(
      (zone) => zone.id === data.shippingZoneId
    );

    setShippingAddress({
      address: data.address,
      city: data.city,
      state: data.state,
    });

    if (selectedZone) {
      setShippingZone(selectedZone.id, selectedZone.price);
    }

    nextStep();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#000000] mb-2">
          Shipping & Delivery
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Specify where your handcrafted Fila cap should be delivered.
        </p>

        {/* Saved Addresses Picker for Authenticated Customers */}
        {savedAddresses.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FED501]" />
                <span>Saved Addresses</span>
              </label>
              {selectedSavedId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSavedId(null);
                    reset({ address: "", city: "", state: "", shippingZoneId: "" });
                    setShippingAddress({ address: "", city: "", state: "" });
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                >
                  + Enter New Address
                </button>
              )}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {savedAddresses.map((addr) => {
                const isSelected = selectedSavedId === addr.id;
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 cursor-pointer shadow-2xs",
                      isSelected
                        ? "border-[#000000] bg-white ring-2 ring-[#FED501]/40"
                        : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {addr.address}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {[addr.city, addr.state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Street Address <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                City <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Lagos"
                {...register("city")}
                aria-invalid={!!errors.city}
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                State <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Lagos State"
                {...register("state")}
                aria-invalid={!!errors.state}
              />
              {errors.state && (
                <p className="text-xs text-red-500">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#000000] flex items-center justify-between">
              <span>Delivery Region / Shipping Zone <span className="text-red-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">Calculates shipping rates</span>
            </label>
            <div className="relative">
              <select
                {...register("shippingZoneId")}
                className="w-full rounded-xl border border-slate-200/90 bg-white hover:border-[#FED501]/70 px-4 py-3 text-sm font-semibold text-slate-800 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#FED501]/30 focus:border-[#FED501] cursor-pointer"
                aria-invalid={!!errors.shippingZoneId}
              >
                <option value="">Select your shipping destination</option>
                {shippingZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — ₦{zone.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            {errors.shippingZoneId && (
              <p className="text-xs text-red-500">
                {errors.shippingZoneId.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={previousStep}
            className="w-full sm:w-auto cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Information
          </Button>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto bg-[#000000] hover:bg-[#1A1A1A] px-8 cursor-pointer"
          >
            Continue to Review
          </Button>
        </div>
      </div>
    </form>
  );
}
