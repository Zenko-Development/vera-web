import { Button } from "@/components/ui/button";
import Logo from "@/shared/assets/icons/logo-icon.svg";
import { Squircle, LogOut, Settings } from "lucide-react";
import Link from "next/link";

export const BacksideMenu = () => {
  return (
    <div className="w-12 h-full bg-black p-1 rounded-full flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        <Link href="/">
            <Logo fill="#ffffff" className="size-full p-1 transition duration-600 hover:-rotate-180" />
        </Link>
        
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon-lg"
            className="hover:bg-white/20 rounded-full"
          >
            <Squircle color="#fff" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="hover:bg-white/20 rounded-full"
          >
            <Squircle color="#fff" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="hover:bg-white/20 rounded-full"
          >
            <Squircle color="#fff" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon-lg"
            className="hover:bg-white/20 rounded-full"
          >
            <Settings color="#fff" />
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            size="icon-lg"
            className="hover:bg-white/20 rounded-full"
          >
            <Squircle color="#fff" />
          </Button>
        </Link>
        <Link href="/logout">
          <Button
            variant="ghost"
            size="icon-lg"
            className="hover:bg-white/20 rounded-full"
          >
            <LogOut color="#fff" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
