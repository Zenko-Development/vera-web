import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";

export default function Settings() {
  return (
    <AuthGuard>
      <Header title="Настройки" />
    </AuthGuard>
  );
}
