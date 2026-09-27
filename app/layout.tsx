import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AlertProvider } from "@/features/alert/alert-store";
import { ApiInitializer } from "@/features/api/ApiInitializer";
import { AuthProvider } from "@/features/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full font-sans antialiased"
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
