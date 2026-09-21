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
import Logo from "@/shared/assets/icons/logo.svg";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function Login() {
  const showAlert = useAlert();
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
          <Card className="w-full max-w-sm ring-0 shadow-none">
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

          <div className="absolute text-sm left-0 bottom-0 opacity-40">
            © «Вера», 2026. Все права защищены.
          </div>
        </div>
        <div
          className="relative w-full h-full bg-primary rounded-4xl p-10 text-white gap-5 flex flex-col"
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
            <img
              src="./tablet.png"
              alt=""
              className="absolute bottom-0 drop-shadow-lg left-1/2 -translate-x-1/2 transition duration-320 ease-[cubic-bezier(0.75,0,0,1)] hover:rotate-10 hover:scale-105"
            />
          </div>

          {/* <iframe

            className="absolute top-0 left-0 w-full h-full rounded-4xl"
            src="data:text/html;base64,PGh0bWw+CiAgICAgICAgPGhlYWQ+CiAgICAgICAgICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSI+CiAgICAgICAgICAgIDxzdHlsZT4KICAgICAgICAgICAgICAgIGh0bWwsIGJvZHl7CiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwOwogICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7CiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7CiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlOwogICAgICAgICAgICAgICAgICAgIGJvcmRlcjogMDsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgPC9zdHlsZT4KICAgICAgICAgICAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vdW5wa2cuY29tL21lZGlhLXNoYWRlckBsYXRlc3QvbWVkaWEtc2hhZGVyLmpzIj48L3NjcmlwdD4KICAgIDxtZWRpYS1zaGFkZXIKICAgICAgICB3aWR0aD0iMTAyNHB4IiAKICAgICAgICBoZWlnaHQ9IjEwMjRweCIKICAgICAgICBmcmFnbWVudC1zaGFkZXI9JyN2ZXJzaW9uIDMwMCBlcwogICAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0OwogICAgb3V0IHZlYzQgZ2xGcmFnQ29sb3I7CiAgICAjaWZkZWYgR0xfRVMKICBwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDsKI2VuZGlmCnVuaWZvcm0gdmVjMiB1X3Jlc29sdXRpb247CnVuaWZvcm0gdmVjMiB1X21vdXNlOwp1bmlmb3JtIHZlYzQgdV9jb2xvcnNbMl07CnVuaWZvcm0gZmxvYXQgdV9zcGVlZDsKdW5pZm9ybSBmbG9hdCB1X3RpbWU7CnVuaWZvcm0gZmxvYXQgdV9zY2FsZTsgCnVuaWZvcm0gZmxvYXQgbGlnaHQ7CnVuaWZvcm0gZmxvYXQgc2hhZG93Owp1bmlmb3JtIGZsb2F0IHRpbnQ7CnVuaWZvcm0gZmxvYXQgY292ZXJhZ2U7CnVuaWZvcm0gZmxvYXQgYWxwaGE7CmNvbnN0IGZsb2F0IGNsb3VkYWxwaGEgPSAyMC47CmNvbnN0IG1hdDIgbSA9IG1hdDIoIDEuNiwgIDEuMiwgLTEuMiwgIDEuNiApOwp2ZWMyIGhhc2goIHZlYzIgcCApIHsKCXAgPSB2ZWMyKGRvdChwLHZlYzIoMTI3LjEsMzExLjcpKSwgZG90KHAsdmVjMigyNjkuNSwxODMuMykpKTsKCXJldHVybiAtMS4wICsgMi4wKmZyYWN0KHNpbihwKSo0Mzc1OC41NDUzMTIzKTsKfQpmbG9hdCBub2lzZSggaW4gdmVjMiBwICkgewogICAgY29uc3QgZmxvYXQgSzEgPSAwLjM2NjAyNTQwNDsgCiAgICBjb25zdCBmbG9hdCBLMiA9IDAuMjExMzI0ODY1OyAKCXZlYzIgaSA9IGZsb29yKHAgKyAocC54K3AueSkqSzEpOwkKICAgIHZlYzIgYSA9IHAgLSBpICsgKGkueCtpLnkpKksyOwogICAgdmVjMiBvID0gKGEueD5hLnkpID8gdmVjMigxLjAsMC4wKSA6IHZlYzIoMC4wLDEuMCk7IAogICAgdmVjMiBiID0gYSAtIG8gKyBLMjsKCXZlYzIgYyA9IGEgLSAxLjAgKyAyLjAqSzI7CiAgICB2ZWMzIGggPSBtYXgoMC41LXZlYzMoZG90KGEsYSksIGRvdChiLGIpLCBkb3QoYyxjKSApLCAwLjAgKTsKCXZlYzMgbiA9IGgqaCpoKmgqdmVjMyggZG90KGEsaGFzaChpKzAuMCkpLCBkb3QoYixoYXNoKGkrbykpLCBkb3QoYyxoYXNoKGkrMS4wKSkpOwogICAgcmV0dXJuIGRvdChuLCB2ZWMzKDcwLjApKTsJCn0KZmxvYXQgZmJtKHZlYzIgbikgewoJZmxvYXQgdG90YWwgPSAwLjAsIGFtcGxpdHVkZSA9IDAuMTsKCWZvciAoaW50IGkgPSAwOyBpIDwgNzsgaSsrKSB7CgkJdG90YWwgKz0gbm9pc2UobikgKiBhbXBsaXR1ZGU7CgkJbiA9IG0gKiBuOwoJCWFtcGxpdHVkZSAqPSAwLjQ7Cgl9CglyZXR1cm4gdG90YWw7Cn0Kdm9pZCBtYWluKCApIHsKICAgIHZlYzIgcCA9IGdsX0ZyYWdDb29yZC54eSAvIHVfcmVzb2x1dGlvbi54eTsKCXZlYzIgdXYgPSBwKnZlYzIodV9yZXNvbHV0aW9uLngvdV9yZXNvbHV0aW9uLnksMS4wKTsgICAgCgkgIGZsb2F0IHNwZWVkID0gdV9zcGVlZCAqIDAuMTsKICAgIGZsb2F0IHRpbWUgPSB1X3RpbWUgKiBzcGVlZDsKICAgIGZsb2F0IHNjYWxlID0gKDEuIC0gdV9zY2FsZSk7CiAgICBmbG9hdCBxID0gZmJtKHV2ICogc2NhbGUgKiAwLjUpOwoJZmxvYXQgciA9IDAuMDsKCXV2ICo9IHNjYWxlOwogICAgdXYgLT0gcSAtIHRpbWU7CiAgICBmbG9hdCB3ZWlnaHQgPSAwLjg7CiAgICBmb3IgKGludCBpPTA7IGk8ODsgaSsrKXsKCQlyICs9IGFicyh3ZWlnaHQqbm9pc2UoIHV2ICkpOwogICAgICAgIHV2ID0gbSp1diArIHRpbWU7CgkJd2VpZ2h0ICo9IDAuNzsKICAgIH0KCWZsb2F0IGYgPSAwLjA7CiAgICB1diA9IHAqdmVjMih1X3Jlc29sdXRpb24ueC91X3Jlc29sdXRpb24ueSwxLjApOwoJdXYgKj0gc2NhbGU7CiAgICB1diAtPSBxIC0gdGltZTsKICAgIHdlaWdodCA9IDAuNzsKICAgIGZvciAoaW50IGk9MDsgaTw4OyBpKyspewoJCWYgKz0gd2VpZ2h0Km5vaXNlKCB1diApOwogICAgICAgIHV2ID0gbSp1diArIHRpbWU7CgkJd2VpZ2h0ICo9IDAuNjsKICAgIH0KICAgIGYgKj0gciArIGY7CiAgICBmbG9hdCBjID0gMC4wOwogICAgdGltZSA9IHVfdGltZSAqIHNwZWVkICogMi4wOwogICAgdXYgPSBwKnZlYzIodV9yZXNvbHV0aW9uLngvdV9yZXNvbHV0aW9uLnksMS4wKTsKCXV2ICo9IHNjYWxlKjIuMDsKICAgIHV2IC09IHEgLSB0aW1lOwogICAgd2VpZ2h0ID0gMC40OwogICAgZm9yIChpbnQgaT0wOyBpPDc7IGkrKyl7CgkJYyArPSB3ZWlnaHQqbm9pc2UoIHV2ICk7CiAgICAgICAgdXYgPSBtKnV2ICsgdGltZTsKCQl3ZWlnaHQgKj0gMC42OwogICAgfQogICAgZmxvYXQgYzEgPSAwLjA7CiAgICB0aW1lID0gdV90aW1lICogc3BlZWQgKiAzLjA7CiAgICB1diA9IHAqdmVjMih1X3Jlc29sdXRpb24ueC91X3Jlc29sdXRpb24ueSwxLjApOwoJdXYgKj0gc2NhbGUqMy4wOwogICAgdXYgLT0gcSAtIHRpbWU7CiAgICB3ZWlnaHQgPSAwLjQ7CiAgICBmb3IgKGludCBpPTA7IGk8NzsgaSsrKXsKCQljMSArPSBhYnMod2VpZ2h0Km5vaXNlKCB1diApKTsKICAgICAgICB1diA9IG0qdXYgKyB0aW1lOwoJCXdlaWdodCAqPSAwLjY7CiAgICB9CiAgICBjICs9IGMxOwogICAgdmVjNCBza3ljb2xvdXIgPSBtaXgodV9jb2xvcnNbMV0sIHVfY29sb3JzWzBdLCBwLnkpOwogICAgdmVjNCBjbG91ZGNvbG91ciA9IHZlYzQoMS4wLCAxLjAsIDEuMCwxLjApICogY2xhbXAoKCgxLjAtc2hhZG93KSArIGxpZ2h0KmMpLCAwLjAsIDEuMCk7CiAgICBmID0gY292ZXJhZ2UgKyBjbG91ZGFscGhhKmFscGhhKmYqcjsKICAgIHZlYzQgcmVzdWx0ID0gbWl4KHNreWNvbG91ciwgY2xhbXAodGludCAqIHNreWNvbG91ciArIGNsb3VkY29sb3VyLCAwLjAsIDEuMCksIGNsYW1wKGYgKyBjLCAwLjAsIDEuMCkpOwoJICBnbEZyYWdDb2xvciA9IHJlc3VsdDsKfScKICAgICAgICB1bmlmb3Jtcz0neyJ1X2NvbG9ycyI6W1sxLDEsMSwwXSxbMC4xMjk0MTE3NjQ3MDU4ODIzNywwLjcxMzcyNTQ5MDE5NjA3ODQsMSwxXV0sInVfc3BlZWQiOjAuMTk2LCJ1X3NjYWxlIjowLCJsaWdodCI6MC41LCJzaGFkb3ciOjAuNSwidGludCI6MC41OTYsImNvdmVyYWdlIjowLjI3NiwiYWxwaGEiOjF9Jz4KICAgIDwvbWVkaWEtc2hhZGVyPgogICAgICAgIDwvaGVhZD4KICAgICAgICA8Ym9keT48L2JvZHk+CiAgICAgICAgPC9odG1sPg=="
          ></iframe> */}
        </div>
      </div>
    </AuthGuard>
  );
}
