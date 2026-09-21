import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { SettingsPanel } from "./components/settings-panel";

export default function Settings() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/login"
      className="h-full min-h-0"
    >
      <Header title="Настройки" />
      <SettingsPanel />
    </AuthGuard>
  );
}
