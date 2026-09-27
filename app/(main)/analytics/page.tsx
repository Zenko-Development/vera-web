import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { AnalyticsWorkspace } from "./components/analytics-workspace";

export default function AnalyticsPage() {
  return (
    <AuthGuard requireAuth redirectTo="/login" className="h-full min-h-0">
      <Header title="Аналитика и аудит" />
      <AnalyticsWorkspace />
    </AuthGuard>
  );
}
