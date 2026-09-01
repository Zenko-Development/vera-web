import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";

export default function Hospitals() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <Header title="Сосудистые центры" />
    </AuthGuard>
  );
}
