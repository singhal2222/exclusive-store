import { redirect } from "next/navigation";

import Payment from "@/components/checkout/Payment";
import { getCurrentUser } from "@/lib/auth";

export default async function PaymentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <Payment user={user} />;
}