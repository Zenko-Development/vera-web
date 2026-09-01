import type { Metadata } from "next";
import "../globals.css";
import { BacksideMenu } from "@/widgets/BacksideMenu/BacksideMenu";

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (

        <div className="flex h-dvh w-dvw overflow-hidden p-3 gap-5">
          <BacksideMenu />
          {children}
        </div>
  );
}
