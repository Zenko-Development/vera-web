import type { Metadata } from "next";
import "../globals.css";
import { BacksideMenu } from "@/widgets/backside-menu/BacksideMenu";

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="h-screen w-screen overflow-hidden flex p-3 gap-5">
      <BacksideMenu />
      <div className="flex-1">{children}</div>
    </div>
  );
}
