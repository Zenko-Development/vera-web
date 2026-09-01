import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AlertProvider } from "@/features/alert/alert-store";
import { ApiInitializer } from "@/features/api/ApiInitializer";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { BacksideMenu } from "@/widgets/BacksideMenu/BacksideMenu";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", "font-sans", inter.variable)}
    >
      <body suppressHydrationWarning>
        <AlertProvider>
          <ApiInitializer>
            <AuthProvider>
                {children}
            </AuthProvider>
          </ApiInitializer>
        </AlertProvider>
      </body>
    </html>
  );
}
