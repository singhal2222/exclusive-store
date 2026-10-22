import Dashboard from "@/components/dashboard/Dashboard";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return <Dashboard user={user} />;
}