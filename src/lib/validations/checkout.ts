import { z } from "zod";

export const customerInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const shippingAddressSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  shippingZoneId: z.string().min(1, "Please select a shipping zone"),
});

export const checkoutSchema = customerInfoSchema.merge(shippingAddressSchema);

export type CustomerInfoFormValues = z.infer<typeof customerInfoSchema>;
export type ShippingAddressFormValues = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;