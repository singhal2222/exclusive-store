import Addresses from "@/components/dashboard/Addresses";
import { getCurrentUser } from "@/lib/auth";

export default async function AddressesPage() {
  const user = await getCurrentUser();

  return <Addresses user={user} />;
}