import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
export default function Home() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
       <Header title="Главная"/>
    </AuthGuard>
  );
}
