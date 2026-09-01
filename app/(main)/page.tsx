import { AuthGuard } from "@/features/components/AuthGuard";
export default function Home() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
        привет
    </AuthGuard>
  );
}
