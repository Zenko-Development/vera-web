import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { FleetManagement } from "./components/fleet-management";
import { fleetPermissions } from "@/features/auth/access-control";

export default function FleetPage() {
  return (
    <AuthGuard requireAuth redirectTo="/login" permissions={fleetPermissions} className="h-full min-h-0">
      <Header title="Машины и планшеты" />
      <FleetManagement />
    </AuthGuard>
  );
}
