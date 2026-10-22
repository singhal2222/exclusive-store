import { redirect } from "next/navigation";

import OrderSuccess from "@/components/orders/OrderSuccess";
import { getCurrentUser } from "@/lib/auth";

export default async function OrderSuccessPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <OrderSuccess user={user} />;
}