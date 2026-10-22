import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import Orders from "@/components/dashboard/Orders";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <Orders user={user} />;
}