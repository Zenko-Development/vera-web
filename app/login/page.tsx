"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/features/alert/alert-store";
import { useAuth } from "@/features/auth/useAuth";
import { AuthGuard } from "@/features/components/AuthGuard";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import Logo from "@/shared/assets/icons/logo.svg";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, FormEvent } from "react";
import { X } from "lucide-react";

export default function Login() {
  const showAlert = useAlert();
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // const [BannerVisible, setBannerVisible] = useState(true)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      await login({
        username: username.trim(),
        password,
      });

      router.push("/");
    } catch {
      showAlert({
        title: "Ошибка входа",
        type: "error",
        description: "Неверное имя пользователя или пароль",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="flex w-dvw h-dvh p-5 gap-5 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <Card className="w-full max-w-sm ring-0 shadow-none dark:bg-transparent">
            <CardHeader>
              <CardTitle className="text-3xl text-center">
                Вход в систему
              </CardTitle>
              <CardDescription className="text-center">
                Введите ваш логин и пароль для продолжения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Логин</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Логин"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Пароль</Label>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Забыли пароль?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Пароль"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? "Входим..." : "Войти"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="absolute left-0 top-0">
            <Logo fill="#33BBFF"/>
          </div>
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>

          <div className="absolute text-sm left-0 bottom-0 opacity-40">
            © «Вера», 2026. Все права защищены.
          </div>
        </div>
       {/* {BannerVisible && <div
          className="relative flex h-full w-full flex-col gap-5 rounded-4xl bg-primary p-10 text-primary-foreground"
            style={{
              backgroundImage: "url('./clouds.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
        >
          <div className="relative z-10 h-full gap-5 flex flex-col ">
            <p className="font-semibold text-4xl">
              Вера – путь от инсульта до операционной без промедления.
            </p>
            <p className="text-xl w-1/2">
              Войдите, чтобы каждая минута работала на спасение.
            </p>
            <Image
              src="/tablet.png"
              alt=""
              width={1859}
              height={1428}
              className="absolute bottom-0 drop-shadow-lg left-1/2 -translate-x-1/2 transition duration-320 ease-[cubic-bezier(0.75,0,0,1)] "
            />
            <Button onClick={() => setBannerVisible(false)} variant="ghost" className="absolute right-0 top-0"><X/></Button>
          </div>
        </div>} */}
      </div>
    </AuthGuard>
  );
}
