import { redirect } from "next/navigation";

import Cart from "@/components/cart/Cart";
import { getCurrentUser } from "@/lib/auth";

// ============================================================
// CART PAGE
// ============================================================

export default async function CartPage() {
  // ----------------------------------------------------------
  // CHECK AUTHENTICATION
  // ----------------------------------------------------------

  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ----------------------------------------------------------
  // RENDER CART
  // ----------------------------------------------------------

  return <Cart />;
}