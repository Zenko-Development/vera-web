import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { FormsManagement } from "./components/forms-management";

export default function FormsPage() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login" className="h-full min-h-0">
      <Header title="Формы" />
      <FormsManagement />
    </AuthGuard>
  );
}
