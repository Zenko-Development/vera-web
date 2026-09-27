import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { SettingsPanel } from "./components/settings-panel";

const settingsSections = ["general", "gps", "catalogs", "access"] as const;

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { section } = await searchParams;
  const requestedSection = Array.isArray(section) ? section[0] : section;
  const initialSection = settingsSections.find(
    (item) => item === requestedSection,
  );

  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/login"
      className="h-full min-h-0"
    >
      <Header title="Настройки" />
      <SettingsPanel initialTab={initialSection} />
    </AuthGuard>
  );
}
