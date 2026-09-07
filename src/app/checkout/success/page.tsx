import SuccessPageClient from "@/components/checkout/SuccessPageClient";

interface SuccessPageProps {
  searchParams: Promise<{
    orderId?: string;
    orderNumber?: string;
    amount?: string;
    reference?: string;
    email?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId, orderNumber, amount, reference, email } = await searchParams;

  return (
    <SuccessPageClient
      orderId={orderId}
      orderNumber={orderNumber}
      amount={amount}
      reference={reference}
      email={email}
    />
  );
}
