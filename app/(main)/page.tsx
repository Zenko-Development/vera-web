import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { Dashboard } from "./components/dashboard";

export default function Home() {
  return (
    <AuthGuard requireAuth redirectTo="/login" className="h-full min-h-0">
      <Header title="Дашборд" />
      <Dashboard />
    </AuthGuard>
  );
}
