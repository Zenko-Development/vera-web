import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { UsersManagement } from "./components/users-management";

export default function UsersPage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/login"
      permissions={["user.manage"]}
      className="h-full min-h-0"
    >
      <Header title="Пользователи" />
      <UsersManagement />
    </AuthGuard>
  );
}
