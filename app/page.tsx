import { Spinner } from "@/components/ui/spinner";
import { AuthGuard } from "@/features/components/AuthGuard";
import LogoIcon from "@/shared/assets/icons/logo-icon.svg"
export default function Home() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <div className="">Привет</div>
      <a href="/login">логин</a>
      <a href="/logout">логоут</a>
    </AuthGuard>
  );
}
