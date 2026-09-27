import { cn } from "@/lib/utils"
import LogoIcon from "@/shared/assets/icons/logo-icon.svg"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LogoIcon data-slot="spinner" role="status" aria-label="Загрузка" className={cn("size-10 animate-[spin_2s_linear_infinite] ", className)} {...props} />
  )
}

export { Spinner }
