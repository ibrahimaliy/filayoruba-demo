"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerInfoSchema,
  CustomerInfoFormValues,
} from "@/lib/validations/checkout";
import { useCheckoutStore } from "@/store/checkout-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, UserCheck } from "lucide-react";

export default function CustomerInfoStep() {
  const customerInfo = useCheckoutStore((state) => state.customerInfo);
  const setCustomerInfo = useCheckoutStore((state) => state.setCustomerInfo);
  const nextStep = useCheckoutStore((state) => state.nextStep);

  const [loggedInCustomer, setLoggedInCustomer] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInfoFormValues>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      firstName: customerInfo.firstName || "",
      lastName: customerInfo.lastName || "",
      email: customerInfo.email || "",
      phone: customerInfo.phone || "",
    },
  });

  // Autofill customer profile if logged in
  useEffect(() => {
    async function loadCustomerSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (res.ok && data.authenticated && data.customer) {
          setLoggedInCustomer(data.customer);

          // If store is empty, or email differs from logged-in customer, or fields are missing, prefill
          const shouldAutofill =
            !customerInfo.email ||
            customerInfo.email.toLowerCase() !== (data.customer.email || "").toLowerCase() ||
            !customerInfo.firstName ||
            (!customerInfo.phone && data.customer.phone);

          if (shouldAutofill) {
            const prefilled = {
              firstName: data.customer.firstName || customerInfo.firstName || "",
              lastName: data.customer.lastName || customerInfo.lastName || "",
              email: data.customer.email || customerInfo.email || "",
              phone: data.customer.phone || customerInfo.phone || "",
            };
            reset(prefilled);
            setCustomerInfo(prefilled);
          }
        }
      } catch {
        // Guest checkout fallback
      }
    }

    loadCustomerSession();
  }, [customerInfo.email, customerInfo.firstName, customerInfo.phone, reset, setCustomerInfo]);

  function onSubmit(data: CustomerInfoFormValues) {
    setCustomerInfo(data);
    nextStep();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-2xl font-bold text-[#000000]">
            Contact Information
          </h2>
          {loggedInCustomer && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#000000]/10 text-[#000000] px-2.5 py-1 rounded-full">
              <UserCheck className="w-3.5 h-3.5 text-[#FED501]" /> Signed in as {loggedInCustomer.firstName}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Please enter your details so we can send order confirmations and artisan updates.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Adebayo"
              {...register("firstName")}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Ogunlesi"
              {...register("lastName")}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="e.g. adebayo@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              placeholder="e.g. 08012345678"
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto bg-[#000000] hover:bg-[#1A1A1A] px-8 cursor-pointer"
          >
            Continue to Shipping
          </Button>
        </div>
      </div>
    </form>
  );
}
