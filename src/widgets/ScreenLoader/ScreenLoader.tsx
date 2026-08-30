import { Spinner } from "@/components/ui/spinner";

export const ScreenLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-20"/>
    </div>
  );
};
