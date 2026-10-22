import Profile from "@/components/dashboard/Profile";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return <Profile user={user} />;
}