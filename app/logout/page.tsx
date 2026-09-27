// app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { ScreenLoader } from "@/widgets/screen-loader/ScreenLoader";

export default function LogoutPage() {
  const router = useRouter();
  const { logout, isAuth } = useAuth();


  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        // Небольшая задержка перед редиректом для плавности
          router.push("/login");
      } catch (err) {
        console.error("Logout error:", err);
      }
    };

    if (isAuth) {
      performLogout();
    } else {
      // Если пользователь не авторизован, сразу редиректим
      router.push("/login");
    }
  }, [logout, isAuth, router]);

  return (
    <ScreenLoader/>

  );
}
