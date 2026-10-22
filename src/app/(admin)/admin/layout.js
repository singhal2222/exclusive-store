import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <AdminDashboard admin={user}>
      {children}
    </AdminDashboard>
  );
}