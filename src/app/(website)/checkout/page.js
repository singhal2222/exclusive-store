import { redirect } from "next/navigation";

import Checkout from "@/components/checkout/Checkout";
import { getCurrentUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <Checkout user={user} />;
}