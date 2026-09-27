import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { LiveMapWorkspace } from "./components/live-map-workspace";

export default function MapPage() {
  return (
    <AuthGuard requireAuth redirectTo="/login" className="h-full min-h-0">
      <Header title="Карта" />
      <LiveMapWorkspace />
    </AuthGuard>
  );
}
