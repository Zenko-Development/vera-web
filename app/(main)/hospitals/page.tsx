import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { HospitalsManagement } from "./components/hospitals-management";
import { hospitalPermissions } from "@/features/auth/access-control";

export default function HospitalsPage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/login"
      permissions={hospitalPermissions}
      className="h-full min-h-0"
    >
      <Header title="Сосудистые центры" />
      <HospitalsManagement />
    </AuthGuard>
  );
}
