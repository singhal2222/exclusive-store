import { redirect } from "next/navigation";
import Settings from "@/components/dashboard/Settings";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <Settings user={user} />;
}