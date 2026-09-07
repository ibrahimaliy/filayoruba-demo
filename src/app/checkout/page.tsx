"use client";

import { useEffect } from "react";
import { useIsMounted } from "@/hooks/use-is-mounted";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { shippingZones, getZoneForState } from "@/data/shipping";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import CustomerInfoStep from "@/components/checkout/CustomerInfoStep";
import ShippingStep from "@/components/checkout/ShippingStep";
import ReviewStep from "@/components/checkout/ReviewStep";
import PaymentStep from "@/components/checkout/PaymentStep";
import OrderSummary from "@/components/checkout/OrderSummary";
import { buttonVariants } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const mounted = useIsMounted();
  const items = useCartStore((state) => state.items);
  const selectAll = useCartStore((state) => state.selectAll);
  const selectedItems = items.filter((item) => item.selected !== false);
  const currentStep = useCheckoutStore((state) => state.currentStep);
  const setStep = useCheckoutStore((state) => state.setStep);
  const setCustomerInfo = useCheckoutStore((state) => state.setCustomerInfo);
  const setShippingAddress = useCheckoutStore((state) => state.setShippingAddress);
  const setShippingZone = useCheckoutStore((state) => state.setShippingZone);
  const customerInfo = useCheckoutStore((state) => state.customerInfo);
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);

  // Initialize checkout: Securely fast-track verified returning patrons with saved addresses to Review (Step 3)
  useEffect(() => {
    let isMounted = true;

    async function initializePatronCheckout() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) throw new Error("Session check failed");
        const sessionData = await sessionRes.json();

        if (!isMounted) return;

        if (sessionData?.authenticated && sessionData?.customer) {
          const customer = sessionData.customer;
          setCustomerInfo({
            firstName: customer.firstName || "",
            lastName: customer.lastName || "",
            email: customer.email || "",
            phone: customer.phone || "",
          });

          // Fetch verified saved addresses
          const addrRes = await fetch("/api/customer/addresses");
          if (!isMounted) return;

          let addresses: any[] = [];
          if (addrRes.ok) {
            const addrData = await addrRes.json();
            if (Array.isArray(addrData.addresses)) {
              addresses = addrData.addresses;
            }
          }

          if (addresses.length > 0) {
            const defaultAddr = addresses[0];
            setShippingAddress({
              address: defaultAddr.address || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "",
            });

            const zoneId = getZoneForState(defaultAddr.state) || "lagos";
            const zone = shippingZones.find((z) => z.id === zoneId);
            if (zone) {
              setShippingZone(zone.id, zone.price);
            }

            // Secure fast-track: All prerequisites verified -> land on Step 3 (Review)
            setStep(3);
            return;
          }
        }
      } catch {
        // Fallback for guest or offline
      }

      if (isMounted) {
        setStep(1);
      }
    }

    initializePatronCheckout();

    return () => {
      isMounted = false;
    };
  }, [setCustomerInfo, setShippingAddress, setShippingZone, setStep]);

  // Security guard: Ensure customer cannot land on Step 3 or 4 without valid contact and shipping info
  useEffect(() => {
    if (currentStep >= 3) {
      const hasContact = Boolean(
        customerInfo.firstName?.trim() &&
        customerInfo.lastName?.trim() &&
        customerInfo.email?.trim()
      );
      const hasAddress = Boolean(
        shippingAddress.address?.trim() &&
        shippingAddress.city?.trim() &&
        shippingAddress.state?.trim()
      );

      if (!hasContact) {
        setStep(1);
      } else if (!hasAddress) {
        setStep(2);
      }
    }
  }, [currentStep, customerInfo, shippingAddress, setStep]);

  if (!mounted) {
    return (
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto animate-pulse space-y-8">
          <div className="h-10 w-48 bg-slate-200 rounded-xl" />
          <div className="grid lg:grid-cols-[1fr_400px] gap-12">
            <div className="h-96 bg-slate-200 rounded-3xl" />
            <div className="h-96 bg-slate-200 rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-md mx-auto rounded-3xl border bg-white p-10 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-6 text-[#000000]">
            <ShoppingBag className="h-8 w-8 text-[#FED501]" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000]">Your Cart is Empty</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please add your favorite handcrafted Yoruba Fila cap to your cart before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 w-full bg-[#000000] hover:bg-[#1A1A1A] text-white"
            )}
          >
            Explore Cap Collections
          </Link>
        </div>
      </main>
    );
  }

  if (!selectedItems.length) {
    return (
      <main className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-md mx-auto rounded-3xl border bg-white p-8 sm:p-10 shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-2 text-[#000000]">
            <ShoppingBag className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#000000]">No Items Selected for Checkout</h1>
          <p className="text-sm text-muted-foreground">
            You have {items.length} {items.length === 1 ? "piece" : "pieces"} in your shopping bag, but none are currently selected for this checkout.
          </p>
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => selectAll(true)}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full bg-[#000000] hover:bg-[#1A1A1A] text-white cursor-pointer"
              )}
            >
              Select All Bag Items ({items.length})
            </button>
            <Link
              href="/cart"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full text-slate-700"
              )}
            >
              Return to Shopping Bag
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16 max-w-6xl w-full overflow-x-clip">
      <CheckoutSteps currentStep={currentStep} />

      <div className="grid md:grid-cols-[1.2fr_1fr] lg:grid-cols-[1fr_400px] gap-6 md:gap-8 lg:gap-12 items-start">
        <div>
          {currentStep === 1 && <CustomerInfoStep />}
          {currentStep === 2 && <ShippingStep />}
          {currentStep === 3 && <ReviewStep />}
          {currentStep === 4 && <PaymentStep />}
        </div>

        <aside className="w-full">
          <OrderSummary />
        </aside>
      </div>
    </main>
  );
}
