export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
}

export interface CheckoutState {
  customerInfo: CustomerInfo;

  shippingAddress: ShippingAddress;

  shippingZoneId: string;

  shippingCost: number;
}