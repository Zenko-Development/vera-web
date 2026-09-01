import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";

export default function Help() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <Header title="Помощь" />
    </AuthGuard>
  );
}
