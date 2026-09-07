import { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin Portal | Fìlà Yorùbá Luxury",
  description: "Artisan fulfillment, live order tracking and product inventory management.",
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}

