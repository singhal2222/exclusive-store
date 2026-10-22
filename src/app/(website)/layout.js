// app/(website)/layout.js

"use client";

import { usePathname } from "next/navigation";
import Sale from "@/components/Sale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function WebsiteLayout({ children }) {
  const pathname = usePathname();

  const isAccountArea =
    pathname.startsWith("/account") &&
    pathname !== "/account/wishlist";

  const isAuthArea =
    pathname.startsWith("/auth");

  return (
    <div>
      {!isAccountArea && !isAuthArea && <Sale />}

      {!isAccountArea && <Header />}

      {children}

      {!isAccountArea && !isAuthArea && <Footer />}
    </div>
  );
}