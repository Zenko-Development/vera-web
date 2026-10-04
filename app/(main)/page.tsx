import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { Dashboard } from "./components/dashboard";
import { dashboardPermissions } from "@/features/auth/access-control";

export default function Home() {
  return (
    <AuthGuard requireAuth redirectTo="/login" permissions={dashboardPermissions} className="h-full min-h-0">
      <Header title="Главная" />
      <Dashboard />
    </AuthGuard>
  );
}
