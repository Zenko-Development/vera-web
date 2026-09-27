import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AlertProvider } from "@/features/alert/alert-store";
import { ApiInitializer } from "@/features/api/ApiInitializer";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/theme/theme-provider";

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full font-sans antialiased"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="vera-theme"
        >
          <AlertProvider>
            <ApiInitializer>
              <AuthProvider>{children}</AuthProvider>
            </ApiInitializer>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
