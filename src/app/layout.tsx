import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import { Toaster } from "sonner";
import StorefrontShell from "@/components/layout/StorefrontShell";
import RouteProgressBar from "@/components/layout/RouteProgressBar";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://filayoruba-theta.vercel.app")
  ),
  title: {
    default: "Fìlà Yorùbá | Handcrafted For Thoroughbred Gentlemen",
    template: "%s | Fìlà Yorùbá",
  },
  description:
    "Nigeria's premier luxury Yoruba headwear house. Authentic handcrafted Fìlà caps, vintage Aṣọ Òkè (Sányán, Aláàárì, Ẹtù), Gòbì, Abetíajá, and embroidered velvet for weddings, coronations, and discerning gentlemen.",
  keywords: [
    "Fìlà Yorùbá",
    "Fila Yoruba",
    "Yoruba Fila",
    "Aso Oke Fila",
    "Gobi Fila",
    "Abeti Aja",
    "Fila Ijebu",
    "Senator Fila",
    "Sanyan Aso-Oke",
    "Alaari",
    "Etu",
    "Nigerian Men Traditional Cap",
  ],
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Fìlà Yorùbá | Handcrafted For Thoroughbred Gentlemen",
    description:
      "Nigeria's premier luxury headwear house. Authentic handcrafted Fìlà caps, vintage Aṣọ Òkè (Sányán, Aláàárì, Ẹtù), Gòbì, and Abetíajá.",
    type: "website",
    locale: "en_NG",
    siteName: "Fìlà Yorùbá",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Fìlà Yorùbá Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${playfair.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-[#FAF9F6] text-[#000000] selection:bg-[#FED501]/30 selection:text-[#000000]">
        <QueryProvider>
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          <StorefrontShell>{children}</StorefrontShell>
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            duration={5000}
            style={{ zIndex: 9999999 }}
            toastOptions={{
              style: { zIndex: 9999999 },
              className: "z-[9999999]",
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
