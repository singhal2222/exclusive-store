import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Wishlist from "@/components/dashboard/Wishlist";

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <Wishlist user={user} />;
}