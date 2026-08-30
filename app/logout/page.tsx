// app/logout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ScreenLoader } from "@/widgets/ScreenLoader/ScreenLoader";

document.title="Доки Доки | Выход из аккаунта"
export default function LogoutPage() {
  const router = useRouter();
  const { logout, isAuth } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        // Небольшая задержка перед редиректом для плавности
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } catch (err) {
        console.error("Logout error:", err);
        setError("Не удалось выйти из системы");
        setIsLoggingOut(false);
      }
    };

    if (isAuth) {
      performLogout();
    } else {
      // Если пользователь не авторизован, сразу редиректим
      router.push("/login");
    }
  }, [logout, isAuth, router]);

  const handleManualRedirect = () => {
    router.push("/login");
  };

  return (
    <ScreenLoader/>

  );
}