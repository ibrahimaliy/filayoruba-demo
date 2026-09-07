"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Store,
  MessageSquare,
  ShoppingBag,
  Truck,
  Sparkles,
} from "lucide-react";
import { normalizePhoneNumber, isValidPhoneNumber } from "@/lib/phone";
import { Product } from "@/types/product";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

interface CreateOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface SelectedItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  stock: number;
  image?: string;
}

export default function CreateOrderDrawer({
  isOpen,
  onClose,
  onOrderCreated,
}: CreateOrderDrawerProps) {
  const [channel, setChannel] = useState<"WHATSAPP" | "INSTAGRAM" | "X" | "WALK_IN">("WHATSAPP");
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");

  // Customer State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [socialHandle, setSocialHandle] = useState("");

  // Address State
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Lagos");
  const [state, setState] = useState("Lagos");

  // Items State
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Item Selector State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Financial State
  const [discount, setDiscount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(2000);

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PENDING" | "PAID">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "POS" | "PAYSTACK">("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState("");
  const [reservationHours, setReservationHours] = useState(4);

  // Notes & System
  const [internalNotes, setInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [clientRequestId, setClientRequestId] = useState("");

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setCatalogProducts(data);
        if (data.length > 0 && !selectedProductId) {
          setSelectedProductId(data[0].id);
          setSelectedSize(data[0].sizes?.[0] || "Standard");
        }
      }
    } catch (err) {
      console.error("Failed to load catalog products", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Initialize unique request ID each time drawer opens
  useEffect(() => {
    if (isOpen) {
      setClientRequestId(`req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      setErrorMessage("");
      fetchProducts();
    }
  }, [isOpen]);

  // Adjust default shipping fee when fulfillment type changes
  useEffect(() => {
    if (fulfillmentType === "pickup") {
      setShippingFee(0);
    } else if (shippingFee === 0) {
      setShippingFee(2000);
    }
  }, [fulfillmentType]);

  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProductId(id);
    const prod = catalogProducts.find((p) => p.id === id);
    if (prod && prod.sizes && prod.sizes.length > 0) {
      setSelectedSize(prod.sizes[0]);
    } else {
      setSelectedSize("Standard");
    }
    setSelectedQuantity(1);
  };

  const handleAddItem = () => {
    const prod = catalogProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (prod.stock < selectedQuantity) {
      setErrorMessage(`Cannot add item: Only ${prod.stock} physical units available in catalog.`);
      return;
    }

    const existingIndex = selectedItems.findIndex(
      (item) => item.productId === prod.id && item.size === selectedSize
    );

    if (existingIndex > -1) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + selectedQuantity;
      if (newQty > prod.stock) {
        setErrorMessage(`Total requested quantity (${newQty}) exceeds catalog stock (${prod.stock}).`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          size: selectedSize || "Standard",
          quantity: selectedQuantity,
          stock: prod.stock,
          image: prod.images?.[0],
        },
      ]);
    }
    setErrorMessage("");
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(shippingFee) || 0));

  // Reservation expiration preview
  const getExpirationPreview = () => {
    const d = new Date(Date.now() + reservationHours * 60 * 60 * 1000);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const normalizedPhonePreview = phone ? normalizePhoneNumber(phone) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please provide customer first and last name.");
      return;
    }

    if (!phone.trim() && !email.trim()) {
      setErrorMessage("At least one contact method (phone number or email) is required.");
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMessage("Please add at least one product item to the order.");
      return;
    }

    if (fulfillmentType === "delivery" && !address.trim()) {
      setErrorMessage("Delivery address is required when fulfillment type is Home Delivery.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        clientRequestId,
        salesChannel: channel,
        fulfillmentType,
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : undefined,
          email: email ? email.trim() : undefined,
          instagramHandle: channel === "INSTAGRAM" && socialHandle ? socialHandle.trim() : undefined,
          xHandle: channel === "X" && socialHandle ? socialHandle.trim() : undefined,
        },
        address:
          fulfillmentType === "delivery"
            ? {
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                country: "Nigeria",
              }
            : undefined,
        items: selectedItems.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
        discount: Number(discount) || 0,
        shippingFee: Number(shippingFee) || 0,
        paymentStatus,
        paymentMethod: paymentStatus === "UNPAID" ? "CASH" : paymentMethod,
        paymentReference: paymentReference ? paymentReference.trim() : undefined,
        reservationHours,
        internalNotes: internalNotes ? internalNotes.trim() : undefined,
      };

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-request-id": clientRequestId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      onOrderCreated();
      onClose();
    } catch (err: any) {
      console.error("Order creation error:", err);
      setErrorMessage(err.message || "An unexpected error occurred while saving the order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSelectedProduct = catalogProducts.find((p) => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-neutral-900 border-l border-neutral-800 text-neutral-100 shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold tracking-wide text-neutral-100 flex items-center gap-2">
                  Create Omnichannel Order
                  <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Record social media orders or walk-in sales with atomic stock deduction
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p className="font-semibold">Order Error</p>
                  <p className="text-xs mt-0.5 text-rose-200/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* 1. Sales Channel Selection */}
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400 block mb-2.5">
                Sales Channel
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChannel("WHATSAPP")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                    channel === "WHATSAPP"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/10"
                      : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mb-1.5" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("INSTAGRAM")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                    channel === "INSTAGRAM"
                      ? "bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-400 shadow-sm shadow-fuchsia-500/10"
                      : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <InstagramIcon className="w-4 h-4 mb-1.5" />
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("X")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                    channel === "X"
                      ? "bg-neutral-700/60 border-neutral-400 text-neutral-100 shadow-sm"
                      : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <TwitterIcon className="w-4 h-4 mb-1.5" />
                  X (Twitter)
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("WALK_IN")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                    channel === "WALK_IN"
                      ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/10"
                      : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <Store className="w-4 h-4 mb-1.5" />
                  Walk-in
                </button>
              </div>
            </div>

            {/* 2. Customer Details */}
            <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <User className="w-4 h-4 text-amber-400" />
                Customer Information
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Adebayo"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Adeleke"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 flex items-center justify-between">
                    <span>Phone Number</span>
                    {normalizedPhonePreview && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {normalizedPhonePreview}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    Email <span className="text-neutral-500">(Optional for Social/Walk-in)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>

              {(channel === "INSTAGRAM" || channel === "X") && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    {channel === "INSTAGRAM" ? "Instagram Handle" : "X Handle"}
                  </label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder={channel === "INSTAGRAM" ? "@adebayo_couture" : "@adebayo"}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              )}
            </div>

            {/* 3. Fulfillment Method */}
            <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                  <Truck className="w-4 h-4 text-amber-400" />
                  Fulfillment Method
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("delivery")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      fulfillmentType === "delivery"
                        ? "bg-amber-500 text-neutral-950 font-semibold"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("pickup")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      fulfillmentType === "pickup"
                        ? "bg-amber-500 text-neutral-950 font-semibold"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    In-Store Pickup
                  </button>
                </div>
              </div>

              {fulfillmentType === "delivery" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Delivery Address *</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street Address, Apartment, Landmark"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Customer will pick up in person at the Lagos showroom. Delivery fee is ₦0.</span>
                </div>
              )}
            </div>

            {/* 4. Product Catalog Selection & Items */}
            <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between text-sm font-semibold text-neutral-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  Order Items
                </div>
                {currentSelectedProduct && (
                  <span className="text-xs font-normal text-neutral-400">
                    Physical Stock:{" "}
                    <strong className={currentSelectedProduct.stock > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {currentSelectedProduct.stock} units
                    </strong>
                  </span>
                )}
              </div>

              {/* Add item control */}
              <div className="grid grid-cols-12 gap-2 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <div className="col-span-5">
                  <label className="text-[11px] text-neutral-400 block mb-1">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={handleProductSelectChange}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₦{p.price.toLocaleString()}) - Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="text-[11px] text-neutral-400 block mb-1">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    {currentSelectedProduct?.sizes?.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    )) || <option value="Standard">Standard</option>}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] text-neutral-400 block mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={currentSelectedProduct?.stock || 1}
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!currentSelectedProduct || currentSelectedProduct.stock === 0}
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Selected items table */}
              {selectedItems.length > 0 ? (
                <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-200 truncate">{item.name}</p>
                          <p className="text-[11px] text-neutral-400">
                            Size: {item.size} • ₦{item.price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-neutral-100">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-neutral-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-500">
                  No items selected yet. Choose a product above to add to this order.
                </div>
              )}
            </div>

            {/* 5. Financial & Price Modifiers */}
            <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-3">
              <div className="text-sm font-semibold text-neutral-200">Adjustments & Pricing</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Discount (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Delivery Fee (₦)</label>
                  <input
                    type="number"
                    min={0}
                    disabled={fulfillmentType === "pickup"}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 disabled:opacity-50 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-neutral-200">₦{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>-₦{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee:</span>
                  <span className="text-neutral-200">₦{shippingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-100 pt-2 border-t border-neutral-800">
                  <span>Total Due:</span>
                  <span className="text-amber-400 font-mono">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 6. Payment & Reservation State */}
            <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Payment & Inventory Allocation
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">Initial Payment State</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("PAID")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentStatus === "PAID"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Paid (Immediate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("PENDING")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentStatus === "PENDING"
                        ? "bg-amber-500/15 border-amber-500 text-amber-400"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Pending Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("UNPAID")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentStatus === "UNPAID"
                        ? "bg-blue-500/15 border-blue-500 text-blue-400"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Unpaid Hold
                  </button>
                </div>
              </div>

              {paymentStatus === "PAID" ? (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="BANK_TRANSFER">Bank Transfer (Manual)</option>
                        <option value="CASH">Cash (Storefront)</option>
                        <option value="POS">POS Terminal</option>
                        <option value="PAYSTACK">Paystack</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">
                        Receipt / Ref <span className="text-neutral-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. TRF-90219"
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Physical stock will be decremented immediately and SALE movement logged.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Inventory Reservation Hold</label>
                    <select
                      value={reservationHours}
                      onChange={(e) => setReservationHours(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value={4}>4 Hours (Standard inquiry hold)</option>
                      <option value={12}>12 Hours (Half-day hold)</option>
                      <option value={24}>24 Hours (Full day)</option>
                      <option value={48}>48 Hours (Weekend reservation)</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-semibold block">
                        Reserved until {getExpirationPreview()} (in {reservationHours}h)
                      </span>
                      <span className="text-amber-200/80 leading-relaxed text-[11px] block mt-0.5">
                        Stock will be temporarily reserved from the available pool. If payment is not confirmed
                        within this window, the hold automatically expires and returns to available stock.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Internal Notes */}
            <div>
              <label className="text-xs text-neutral-400 block mb-1">
                Internal Notes <span className="text-neutral-500">(Artisan / Fulfillment instructions)</span>
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. Customer requested gold thread embroidery on royal blue base..."
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              Total: <strong className="text-neutral-100 text-sm">₦{total.toLocaleString()}</strong>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || selectedItems.length === 0}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Confirm & Create Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
