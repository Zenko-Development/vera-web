import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "@/shared/assets/icons/logo-icon.svg";
import {
  Squircle,
  LogOut,
  Settings,
  MessageCircleQuestionMark,
  UsersRound,
  LayoutDashboard,
  Hospital,
  ListTodo,
} from "lucide-react";
import Link from "next/link";

export const BacksideMenu = () => {
  return (
    <div className="w-12 h-full bg-black p-1 rounded-full flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        <Tooltip >
          <TooltipTrigger 
            render={
              <Link href="/">
                <Logo
                  fill="#ffffff"
                  className="size-full p-1 transition duration-600 hover:-rotate-180"
                />
              </Link>
            }
          />
          <TooltipContent side="right" sideOffset={12}>
            <p>Главная</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-col items-center">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="hover:bg-white/20 rounded-full"
                  >
                    <LayoutDashboard color="#fff" />
                  </Button>
                </Link>
              }
            />
            <TooltipContent side="right" sideOffset={12}>
              <p>Метрики</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link href="/users">
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="hover:bg-white/20 rounded-full"
                  >
                    <UsersRound color="#fff" />
                  </Button>
                </Link>
              }
            />
            <TooltipContent side="right" sideOffset={12}>
              <p>Пользователи</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link href="/hospitals">
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="hover:bg-white/20 rounded-full"
                  >
                    <Hospital color="#fff" />
                  </Button>
                </Link>
              }
            />
            <TooltipContent side="right" sideOffset={12}>
              <p>Сосудистые центры</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link href="/forms">
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="hover:bg-white/20 rounded-full"
                  >
                    <ListTodo color="#fff" />
                  </Button>
                </Link>
              }
            />
            <TooltipContent side="right" sideOffset={12}>
              <p>Формы</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="hover:bg-white/20 rounded-full"
                >
                  <Settings color="#fff" />
                </Button>
              </Link>
            }
          />
          <TooltipContent side="right" sideOffset={12}>
            <p>Настройки</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link href="/help">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="hover:bg-white/20 rounded-full"
                >
                  <MessageCircleQuestionMark color="#fff" />
                </Button>
              </Link>
            }
          />
          <TooltipContent side="right" sideOffset={12}>
            <p>Помощь</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link href="/logout">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="hover:bg-white/20 rounded-full"
                >
                  <LogOut color="#fff" />
                </Button>
              </Link>
            }
          />
          <TooltipContent side="right" sideOffset={12}>
            <p>Выйти из аккаунта</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
