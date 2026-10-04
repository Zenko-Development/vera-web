import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { LiveMapWorkspace } from "./components/live-map-workspace";
import { mapPermissions } from "@/features/auth/access-control";

export default function MapPage() {
  return (
    <AuthGuard requireAuth redirectTo="/login" permissions={mapPermissions} className="h-full min-h-0">
      <Header title="Карта" />
      <LiveMapWorkspace />
    </AuthGuard>
  );
}
