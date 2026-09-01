import type { Metadata } from "next";
import "../globals.css";
import { BacksideMenu } from "@/widgets/backside-menu/BacksideMenu";
import { HeaderRight } from "@/widgets/header/header-right";

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="h-screen w-screen flex p-3 gap-5 bg-gray-100">
      <BacksideMenu />
      <HeaderRight/>
      <div className="flex-1 h-full">{children}</div>
    </div>
  );
}
