"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  ShieldCheck,
  Printer,
  HelpCircle,
  Loader2,
  AlertCircle,
  Star,
  XCircle,
  Ban,
  CreditCard,
  Mail,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Order, OrderStatus } from "@/types/order";
import { formatSizeLabel } from "@/lib/sizing";
import OrderReceiptPrint from "@/components/receipt/OrderReceiptPrint";
import ReviewModal, { ReviewModalProduct } from "@/components/reviews/ReviewModal";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import ChangeAddressModal from "@/components/orders/ChangeAddressModal";
import { usePageRestore } from "@/hooks/use-page-restore";

const TIMELINE_STEPS: {
  key: OrderStatus | "crafting" | "shipped" | "delivered";
  label: string;
  description: string;
  icon: typeof Package;
}[] = [
  {
    key: "paid",
    label: "Payment Confirmed",
    description: "Payment verified via Paystack. Order sent to workshop.",
    icon: CheckCircle2,
  },
  {
    key: "crafting",
    label: "Artisan Handcrafting",
    description: "Yoruba master weavers shaping fabric, embroidery & structural folds.",
    icon: Sparkles,
  },
  {
    key: "shipped",
    label: "Quality Check & Dispatched",
    description: "Form inspected, packaged in ceremonial box, and with courier.",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Package received safely by customer.",
    icon: ShieldCheck,
  },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case "pending":
      return 0;
    case "paid":
      return 1;
    case "crafting":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return 1;
  }
}

/**
 * Plays a pleasant royal chime upon real-time order status advancement
 */
function playStatusChime(status: string) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const isPaid = status === "paid" || status === "confirmed";
    const notes = isPaid ? [523.25, 659.25, 783.99] : [587.33, 739.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.42);
    });
  } catch {}
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || searchParams.get("orderId") || searchParams.get("order") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialAction = searchParams.get("action") || "";

  const [query, setQuery] = useState(initialRef);
  const [email, setEmail] = useState(initialEmail);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeReviewItem, setActiveReviewItem] = useState<{
    product: ReviewModalProduct;
    orderNumber: string;
  } | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, number>>({});
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null);

  const orderRef = useRef<Order | null>(null);
  orderRef.current = order;

  const queryRef = useRef(query);
  queryRef.current = query;

  const emailRef = useRef(email);
  emailRef.current = email;

  const handleAddressUpdateSuccess = (updatedOrder: Order) => {
    if (updatedOrder) {
      setOrder(updatedOrder);
      setCustomerOrders((prev) =>
        prev.map((co) => (co.id === updatedOrder.id ? { ...co, ...updatedOrder } : co))
      );
    }
  };

  // Reset loading status and dismiss persistent redirect toast when returning via Back/bfcache
  usePageRestore(() => setResumingOrderId(null));

  const [pendingCheckout, setPendingCheckout] = useState<{
    orderNumber: string;
    orderId: string;
    reference: string;
    amount: number;
    email: string;
    authorizationUrl: string;
    createdAt: number;
  } | null>(null);

  const pendingCheckoutRef = useRef(pendingCheckout);
  pendingCheckoutRef.current = pendingCheckout;

  // Check for cached pending checkout in localStorage (for guest recovery)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("filayoruba_pending_checkout") || localStorage.getItem("tradedge_pending_checkout");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Date.now() - parsed.createdAt < 24 * 60 * 60 * 1000) {
            const checkQuery = parsed.orderNumber || parsed.orderId;
            const checkEmail = parsed.email || "";

            // Authoritatively verify if order was already confirmed/paid
            if (checkQuery && checkEmail) {
              fetch(`/api/orders/track?query=${encodeURIComponent(checkQuery)}&email=${encodeURIComponent(checkEmail)}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data?.success && data?.order) {
                    const ord = data.order;
                    const isPaid =
                      ord.paymentStatus === "paid" ||
                      ["paid", "confirmed", "crafting", "shipped", "delivered"].includes(ord.status);

                    if (isPaid) {
                      localStorage.removeItem("filayoruba_pending_checkout");
                      localStorage.removeItem("tradedge_pending_checkout");
                      setPendingCheckout(null);
                      setOrder(ord);
                      setQuery(ord.orderNumber);
                      setEmail(checkEmail);
                      setSearched(true);
                      toast.success(`Payment verified! Order #${ord.orderNumber} is confirmed.`);
                      return;
                    }
                  }
                  // Genuinely pending order
                  setPendingCheckout(parsed);
                  if (!initialRef) {
                    setQuery((prev) => prev || parsed.orderNumber);
                    if (parsed.email) setEmail((prev) => prev || parsed.email);
                  }
                })
                .catch(() => {
                  setPendingCheckout(parsed);
                  if (!initialRef) {
                    setQuery((prev) => prev || parsed.orderNumber);
                    if (parsed.email) setEmail((prev) => prev || parsed.email);
                  }
                });
            } else {
              setPendingCheckout(parsed);
              if (!initialRef) {
                setQuery((prev) => prev || parsed.orderNumber);
                if (parsed.email) setEmail((prev) => prev || parsed.email);
              }
            }
          }
        }
      } catch {}
    }
  }, [initialRef]);

  const handleResumePayment = async (targetOrder?: { id?: string; orderNumber?: string; email?: string }) => {
    const ordId = targetOrder?.id || order?.id || pendingCheckout?.orderId;
    const ordNum = targetOrder?.orderNumber || order?.orderNumber || pendingCheckout?.orderNumber;
    const ordEmail = targetOrder?.email || email || order?.customer?.email || pendingCheckout?.email;

    try {
      setResumingOrderId(ordId || ordNum || "active");
      const res = await fetch("/api/paystack/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: ordId,
          orderNumber: ordNum,
          email: ordEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.status === "ALREADY_PAID") {
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("filayoruba_pending_checkout");
              localStorage.removeItem("tradedge_pending_checkout");
            } catch {}
          }
          setPendingCheckout(null);
          toast.success("This order has already been verified and paid!");
          handleSearch(ordNum || ordId, ordEmail);
          setResumingOrderId(null);
          return;
        }
        throw new Error(data.message || "Failed to resume payment session.");
      }
      if (!data.authorizationUrl) {
        throw new Error(data.message || "Failed to resume payment session.");
      }
      const toastId = toast.loading("Connecting to Paystack secure checkout...");

      // Automatically dismiss the redirect toast and reset resumingOrderId if user navigates back
      setTimeout(() => {
        setResumingOrderId(null);
        toast.dismiss(toastId);
      }, 6000);

      window.location.assign(data.authorizationUrl);
    } catch (err: any) {
      toast.error(err.message || "Unable to resume payment at this time.");
      setResumingOrderId(null);
    }
  };

  // Auto-fill email, load customer orders, and load reviews if patron is signed in
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data.customer?.email) {
          setEmail((prev) => prev || data.customer.email);
        }
      })
      .catch(() => {});

    fetch("/api/customer/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data?.orders && Array.isArray(data.orders)) {
          setCustomerOrders(data.orders);
        }
      })
      .catch(() => {});

    fetch("/api/customer/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data?.reviews && Array.isArray(data.reviews)) {
          const map: Record<string, number> = {};
          data.reviews.forEach((r: any) => {
            if (r.product?.slug) map[r.product.slug] = r.rating;
          });
          setReviewedProducts(map);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(
    async (searchQuery?: string, searchEmail?: string, isSilent = false) => {
      const q = (searchQuery || queryRef.current).trim();
      const em = (searchEmail !== undefined ? searchEmail : emailRef.current).trim();
      if (!q) {
        if (!isSilent) setError("Please enter your Order Number or Paystack Reference.");
        return;
      }

      if (!isSilent) {
        setLoading(true);
        setError(null);
        setSearched(true);
      } else {
        setIsRevalidating(true);
      }

      try {
        const params = new URLSearchParams({ query: q });
        if (em) {
          params.append("email", em);
        }

        const res = await fetch(`/api/orders/track?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success && data.order) {
          const ord: Order = data.order;
          const prevOrder = orderRef.current;
          const isPaid =
            ord.paymentStatus === "paid" ||
            ["paid", "confirmed", "crafting", "shipped", "delivered"].includes(ord.status);

          // Detect live status advancement in real time and notify customer
          if (prevOrder && prevOrder.id === ord.id && prevOrder.status !== ord.status) {
            playStatusChime(ord.status);
            if (ord.status === "paid" || ord.status === "confirmed") {
              toast.success(`Payment verified! Order #${ord.orderNumber} is confirmed.`);
            } else if (ord.status === "crafting") {
              toast.info(`Artisan Update: Master weavers have commenced shaping your Fila cap.`);
            } else if (ord.status === "shipped") {
              toast.info(`Dispatched! Order #${ord.orderNumber} is with the courier.`);
            } else if (ord.status === "delivered") {
              toast.success(`Delivered! Your royal Fila cap has arrived safely.`);
            } else if (ord.status === "cancelled") {
              toast.warning(`Order #${ord.orderNumber} has been cancelled.`);
            }
          }

          if (isPaid && typeof window !== "undefined") {
            try {
              const saved =
                localStorage.getItem("filayoruba_pending_checkout") ||
                localStorage.getItem("tradedge_pending_checkout");
              if (saved) {
                const parsed = JSON.parse(saved);
                if (
                  parsed.orderId === ord.id ||
                  parsed.orderNumber === ord.orderNumber ||
                  parsed.reference === ord.orderNumber
                ) {
                  localStorage.removeItem("filayoruba_pending_checkout");
                  localStorage.removeItem("tradedge_pending_checkout");
                  setPendingCheckout(null);
                }
              }
            } catch {}
          }

          setOrder(ord);
          setLastCheckedAt(new Date());

          if (initialAction === "cancel" && (ord.status === "pending" || ord.status === "paid")) {
            setShowCancelModal(true);
          }
        } else {
          if (!isSilent) {
            setOrder(null);
            setError(data.message || "No order found matching this reference.");
          }
        }
      } catch {
        if (!isSilent) {
          setOrder(null);
          setError("Network error while looking up order. Please try again.");
        }
      } finally {
        if (!isSilent) setLoading(false);
        setIsRevalidating(false);
      }
    },
    [initialAction]
  );

  // Initial lookup upon mount
  useEffect(() => {
    if (initialRef) {
      let emailToLookup = initialEmail;
      if (!emailToLookup && typeof window !== "undefined") {
        try {
          const saved =
            localStorage.getItem("filayoruba_pending_checkout") ||
            localStorage.getItem("tradedge_pending_checkout");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (
              parsed &&
              parsed.email &&
              (parsed.orderNumber === initialRef ||
                parsed.orderId === initialRef ||
                parsed.reference === initialRef)
            ) {
              emailToLookup = parsed.email;
              setEmail(parsed.email);
            }
          }
        } catch {}
      }
      handleSearch(initialRef, emailToLookup, false);
    }
  }, [initialRef, initialEmail, handleSearch]);

  // 1. Adaptive Real-Time Polling (3.5s for pending checkout, 15s for active orders)
  useEffect(() => {
    const currentStatus = order?.status;
    const isTerminal = currentStatus === "delivered" || currentStatus === "cancelled";
    if (isTerminal) return;

    const intervalMs = currentStatus === "pending" || (!order && pendingCheckout) ? 3500 : 15000;

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (orderRef.current) {
          handleSearch(undefined, undefined, true);
        } else if (pendingCheckoutRef.current?.orderNumber && pendingCheckoutRef.current?.email) {
          fetch(
            `/api/orders/track?query=${encodeURIComponent(
              pendingCheckoutRef.current.orderNumber
            )}&email=${encodeURIComponent(pendingCheckoutRef.current.email)}`
          )
            .then((res) => res.json())
            .then((data) => {
              if (data?.success && data?.order) {
                const ord = data.order;
                const isPaid =
                  ord.paymentStatus === "paid" ||
                  ["paid", "confirmed", "crafting", "shipped", "delivered"].includes(ord.status);

                if (isPaid) {
                  try {
                    localStorage.removeItem("filayoruba_pending_checkout");
                    localStorage.removeItem("tradedge_pending_checkout");
                  } catch {}
                  setPendingCheckout(null);
                  setOrder(ord);
                  setQuery(ord.orderNumber);
                  setEmail(pendingCheckoutRef.current?.email || "");
                  setSearched(true);
                  playStatusChime("paid");
                  toast.success(`Payment verified! Order #${ord.orderNumber} is confirmed.`);
                }
              }
            })
            .catch(() => {});
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [order?.id, order?.status, pendingCheckout, handleSearch]);

  // 2. Cross-Tab & Window-Focus Instant Sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("filayoruba_order_sync");
      bc.onmessage = (event) => {
        if (event.data?.action === "ORDER_PAID") {
          if (orderRef.current || pendingCheckoutRef.current || initialRef) {
            handleSearch(undefined, undefined, true);
          }
        }
      };
    } catch {}

    const handleFocusSync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (orderRef.current || pendingCheckoutRef.current) {
          handleSearch(undefined, undefined, true);
        }
      }
    };

    const handleWindowOrderPaid = () => {
      handleSearch(undefined, undefined, true);
    };

    window.addEventListener("focus", handleFocusSync);
    document.addEventListener("visibilitychange", handleFocusSync);
    window.addEventListener("filayoruba:order-paid", handleWindowOrderPaid);

    return () => {
      bc?.close();
      window.removeEventListener("focus", handleFocusSync);
      document.removeEventListener("visibilitychange", handleFocusSync);
      window.removeEventListener("filayoruba:order-paid", handleWindowOrderPaid);
    };
  }, [handleSearch, initialRef]);

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <>
      {/* 1. On-Screen Interactive Tracking View (Hidden when printing) */}
      <div className="max-w-4xl mx-auto space-y-10 print:hidden">
        {/* Guest Pending Checkout Recovery Card */}
        {pendingCheckout && !order && (
          <div className="rounded-3xl border border-amber-300/80 bg-amber-50/90 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100/90 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    Incomplete Checkout
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-700"></span>
                    </span>
                    Checking payment live...
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-amber-950 mt-1">
                  Order #{pendingCheckout.orderNumber} Awaiting Payment
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Reserved for {pendingCheckout.email} • Total: ₦{pendingCheckout.amount?.toLocaleString("en-NG")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
              <Button
                type="button"
                size="sm"
                onClick={() => handleResumePayment()}
                disabled={Boolean(resumingOrderId)}
                className="rounded-xl bg-[#000000] hover:bg-black text-[#FED501] font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {resumingOrderId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 text-[#FED501]" />
                )}
                <span>Complete Payment</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSearch(pendingCheckout.orderNumber, pendingCheckout.email);
                }}
                className="rounded-xl border-amber-300 bg-white/80 hover:bg-white text-amber-900 font-bold text-xs"
              >
                View Status
              </Button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.removeItem("filayoruba_pending_checkout");
                      localStorage.removeItem("tradedge_pending_checkout");
                    } catch {}
                  }
                  setPendingCheckout(null);
                }}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                title="Dismiss reminder"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search Box */}
        <div className="rounded-3xl border bg-white p-6 sm:p-10 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#000000] mb-2">
            Track Your Yoruba Fila Order
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your Order Number (e.g. <span className="font-mono text-slate-800 font-semibold">FY-2026-XXXX</span>) and checkout email below.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="grid sm:grid-cols-[1fr_1fr_auto] gap-3"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Order Number or Reference *"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                required
              />
            </div>

            <Input
              type="email"
              placeholder="Order Email Address *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] font-semibold text-white cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching
                </>
              ) : (
                "Track Order"
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/80 p-3.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Guest Patrons / Lost Tracker Assistance */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Mail className="w-4 h-4 text-[#000000]" />
              </div>
              <p className="text-[11px] sm:text-xs">
                Ordered as a guest without a Tracker ID, or have a pending payment? <strong>Sign in with your email</strong> to access all orders instantly.
              </p>
            </div>
            <Link
              href={`/account/login?from=${encodeURIComponent("/track-order")}`}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 hover:border-[#000000] font-bold text-slate-900 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs"
            >
              Sign In with OTP →
            </Link>
          </div>

          {/* Recent Orders Quick Select for Signed-In Patrons */}
          {customerOrders.length > 0 && !order && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#FED501]" /> Your Recent Orders
                </span>
                <Link
                  href="/account/orders"
                  className="text-[11px] font-semibold text-slate-500 hover:text-black underline"
                >
                  View All Orders →
                </Link>
              </div>

              <div className="grid gap-2">
                {customerOrders.slice(0, 3).map((co) => (
                  <div
                    key={co.id}
                    className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#000000]">
                          #{co.orderNumber || co.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                            co.status === "paid" || co.status === "crafting" || co.status === "shipped" || co.status === "delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : co.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}
                        >
                          {co.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {co.items?.length || 1} cap(s) • Total: ₦{co.total.toLocaleString("en-NG")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {(co.status === "pending" || co.status === "paid") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setOrder(co);
                            setShowCancelModal(true);
                          }}
                          className="rounded-xl h-8 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600 mr-1" /> Cancel
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const ordNum = co.orderNumber || co.id;
                          setQuery(ordNum);
                          handleSearch(ordNum, email || (co.customer as any)?.email);
                        }}
                        className="rounded-xl h-8 text-xs font-bold bg-[#000000] hover:bg-[#1A1A1A] text-white cursor-pointer"
                      >
                        Track Progress
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results View */}
        {order && (
          <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header Card */}
            <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-[#000000]/60">
                    Order Details
                  </span>
                  <h3 className="text-2xl font-bold text-[#000000] mt-0.5">
                    #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "Recently"}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      order.status === "paid" || order.status === "crafting" || order.status === "shipped" || order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : order.status === "cancelled"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {order.status}
                  </span>

                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                      </span>
                      <span className="hidden sm:inline">Live Tracking</span>
                      <button
                        type="button"
                        onClick={() => handleSearch(undefined, undefined, false)}
                        disabled={isRevalidating || loading}
                        title="Check for live status updates now"
                        aria-label="Refresh status now"
                        className="ml-0.5 p-0.5 hover:text-emerald-950 transition-colors cursor-pointer"
                      >
                        <RefreshCw
                          className={cn(
                            "w-3 h-3 text-emerald-700 hover:text-emerald-950",
                            isRevalidating && "animate-spin text-emerald-950"
                          )}
                        />
                      </button>
                    </div>
                  )}

                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleResumePayment(order)}
                      disabled={Boolean(resumingOrderId)}
                      className="rounded-xl bg-[#000000] hover:bg-black text-[#FED501] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      title="Complete payment on Paystack"
                    >
                      {resumingOrderId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-[#FED501]" />
                      )}
                      <span>Complete Payment</span>
                    </Button>
                  )}

                  {(order.status === "pending" || order.status === "paid") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelModal(true)}
                      className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-600" /> Cancel Order
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="rounded-xl hidden sm:flex items-center gap-1.5 hover:bg-[#000000] hover:text-white hover:border-[#000000] transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Receipt
                  </Button>
                </div>
              </div>

              {/* Pending Payment Notice Banner */}
              {order.status === "pending" && (
                <div className="pt-6">
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                          Awaiting Payment Confirmation
                        </h4>
                        <p className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5">
                          Your bespoke cap is reserved. Click <strong>Complete Payment</strong> to pay with Paystack and commence handcrafting.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleResumePayment(order)}
                      disabled={Boolean(resumingOrderId)}
                      className="rounded-xl bg-[#000000] hover:bg-black text-[#FED501] font-bold text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {resumingOrderId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-[#FED501]" />
                      )}
                      <span>Pay ₦{order.total.toLocaleString("en-NG")} Now</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancellation Panel OR Fulfillment Timeline */}
              {order.status === "cancelled" ? (
                <div className="pt-6">
                  <div className="p-5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>This order has been cancelled</span>
                    </div>
                    {order.cancelReason && (
                      <p className="text-xs text-rose-800/90 pl-7">
                        <strong>Reason:</strong> {order.cancelReason}
                      </p>
                    )}
                    <p className="text-xs text-rose-700/90 pl-7 leading-relaxed">
                      {order.total > 0
                        ? "If payment was verified via Paystack, a 100% full refund is credited to your bank account within 3–5 business days. Reserved headwear inventory has been restored."
                        : "Reserved cap inventory has been released back to the royal catalog."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-8">
                  <h4 className="text-sm font-semibold text-slate-800 mb-6">
                    Fulfillment Progress
                  </h4>

                  <div className="relative grid sm:grid-cols-4 gap-6">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx + 1 <= currentStepIdx;
                    const isCurrent = idx + 1 === currentStepIdx;

                    return (
                      <div key={step.key} className="relative flex flex-col items-start text-left">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all",
                              isCompleted
                                ? "bg-[#000000] text-white border-[#000000] shadow-sm"
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          {isCurrent && (
                            step.key === "delivered" ? (
                              <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Completed
                              </span>
                            ) : (
                              <span className="inline-block animate-pulse text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                In Progress
                              </span>
                            )
                          )}
                        </div>

                        <h5
                          className={cn(
                            "text-sm font-bold",
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          )}
                        >
                          {step.label}
                        </h5>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Products & Shipping Info */}
            <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
              {/* Products Card */}
              <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-[#000000] border-b pb-3">
                  Ordered Items ({order.items.length})
                </h4>

                <div className="divide-y">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-900 border shrink-0">
                        <ImageWithFallback
                          src={item.product.images?.[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          fallbackTitle={item.product.name}
                          fallbackVariant="sm"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-slate-900 truncate">
                          {item.product.name}
                        </h5>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                          <span>Size: <strong className="text-slate-700">{formatSizeLabel(item.selectedSize)}</strong></span>
                          <span>•</span>
                          <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-sm font-bold text-slate-900">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </div>
                        {order.status === "delivered" && (
                          reviewedProducts[item.product.slug] ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewed ({reviewedProducts[item.product.slug]}★)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReviewItem({
                                  product: {
                                    name: item.product.name,
                                    slug: item.product.slug,
                                    image: item.product.images?.[0],
                                    price: item.product.price,
                                    size: item.selectedSize,
                                  },
                                  orderNumber: order.orderNumber || order.id,
                                })
                              }
                              className="px-2.5 py-1 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Star className="w-3 h-3 fill-[#FED501] text-[#FED501]" />
                              <span>Review Cap</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>₦{order.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ceremonial Shipping:</span>
                    <span>{order.shipping > 0 ? `₦${order.shipping.toLocaleString()}` : "Free Delivery"}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t">
                    <span>Total Amount Paid:</span>
                    <span className="text-[#000000]">₦{order.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Help Card */}
              <div className="space-y-6">
                <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-base font-bold text-[#000000]">
                      Delivery Destination
                    </h4>

                    {["pending", "paid", "crafting"].includes(order.status) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressModal(true)}
                        className="rounded-xl h-7 px-2.5 text-xs font-bold border-slate-200 text-slate-800 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#FED501]" />
                        <span>Change Address</span>
                      </Button>
                    ) : order.status === "shipped" || order.status === "delivered" ? (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Dispatched &bull; Locked
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p className="font-semibold text-slate-900 text-sm">
                      {order.customer?.firstName || "Valued"} {order.customer?.lastName || "Customer"}
                    </p>
                    <p>{order.address?.address || "In-Store / Destination Pending"}</p>
                    <p>
                      {[order.address?.city, order.address?.state].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-slate-400">{order.customer?.phone || order.customer?.email || ""}</p>
                  </div>

                  {order.paymentReference && (
                    <div className="pt-3 border-t text-[11px] text-muted-foreground font-mono truncate">
                      Paystack Ref: {order.paymentReference}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-slate-50 border p-5 text-xs text-muted-foreground space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <HelpCircle className="h-4 w-4 text-[#000000]" />
                    <span>Need Assistance with this order?</span>
                  </div>
                  <p>
                    Our artisan concierge is ready to assist with sizing modifications or ceremonial deadlines.
                  </p>
                  <Link
                    href="/contact"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full rounded-xl bg-white")}
                  >
                    Contact Concierge
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State when first loading page without search */}
        {!order && !loading && !searched && (
          <div className="rounded-3xl border bg-slate-50/50 p-12 text-center max-w-lg mx-auto">
            <Clock className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Real-Time Crafting & Courier Tracking</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
              Check the status of your handcrafted Yoruba Fila cap at each step from weaving in Oyo to final doorstep delivery.
            </p>
          </div>
        )}
      </div>

      {/* 2. Print-Only View: Exact Match with Email Receipt (Only visible when printing) */}
      {order && <OrderReceiptPrint order={order} />}

      {/* 3. In-Place Review Modal for Delivered Orders */}
      {activeReviewItem && order && (
        <ReviewModal
          isOpen={Boolean(activeReviewItem)}
          onClose={() => setActiveReviewItem(null)}
          product={activeReviewItem.product}
          orderNumber={activeReviewItem.orderNumber}
          customerName={`${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || (order.customer?.email ? order.customer.email.split("@")[0] : "Customer")}
          customerEmail={order.customer?.email || undefined}
          onSuccess={(newReview) => {
            setReviewedProducts((prev) => ({
              ...prev,
              [activeReviewItem.product.slug]: newReview.rating,
            }));
          }}
        />
      )}

      {/* 4. Interactive Order Cancellation Modal with Terms & Conditions */}
      {showCancelModal && order && (
        <CancelOrderModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber || order.id.slice(0, 8).toUpperCase()}
          total={order.total}
          customerEmail={email || order.customer?.email}
          isPaid={order.status === "paid"}
          onSuccess={(updated) => {
            if (updated) {
              setOrder({ ...order, ...updated, status: "cancelled" });
            }
          }}
        />
      )}

      {/* 5. Interactive Change Delivery Address Modal */}
      {showAddressModal && order && (
        <ChangeAddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          order={order}
          customerEmail={email || order.customer?.email}
          onSuccess={handleAddressUpdateSuccess}
        />
      )}
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="container mx-auto px-4 py-16 sm:py-20 min-h-[80vh]">
      <div className="max-w-4xl mx-auto mb-10 text-center print:hidden">
        <span className="inline-block text-xs uppercase tracking-widest font-semibold text-[#000000] bg-[#000000]/10 px-3 py-1 rounded-full mb-3">
          Order Tracking Portal
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#000000]">
          Track Your Fìlà Yorùbá Order
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
          Real-time visibility into your cap&apos;s crafting progress, quality inspection, and courier dispatch.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto rounded-3xl border bg-white p-12 text-center print:hidden">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#000000]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading tracking system...</p>
          </div>
        }
      >
        <TrackOrderContent />
      </Suspense>
    </main>
  );
}
