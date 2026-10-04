import type { Metadata } from "next";
import "../globals.css";
import { BacksideMenu } from "@/widgets/backside-menu/BacksideMenu";
import { HeaderRight } from "@/widgets/header/header-right";
import { UnsavedChangesProvider } from "@/features/unsaved-changes/unsaved-changes-provider";

export const metadata: Metadata = {
  title: "Вера",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <UnsavedChangesProvider>
      <div className="flex h-dvh w-full gap-3 bg-muted p-3 dark:bg-background lg:gap-5">
        <BacksideMenu />
        <HeaderRight />
        <div className="h-full min-w-0 flex-1">{children}</div>
      </div>
    </UnsavedChangesProvider>
  );
}
