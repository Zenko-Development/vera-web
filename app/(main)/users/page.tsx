import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { ArrowUpRight, Grid2x2, LayoutGrid, Plus, Search } from "lucide-react";

export default function Users() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login" className="h-full ">
      <Header title="Пользователи" />
      <div className="flex flex-col gap-2 h-[calc(100%-40px)] ">
        <div className="flex gap-1 pt-3">
          <ButtonGroup
            orientation="horizontal"
            aria-label="grid-type"
            className="h-fit"
          >
            <Button variant="outline" size="icon-sm">
              <LayoutGrid />
            </Button>
            <Button variant="outline" size="icon-sm">
              <Grid2x2 />
            </Button>
          </ButtonGroup>
          <InputGroup className="h-8 shadow-none bg-white">
            <InputGroupInput id="search" placeholder="Поиск" />
            <InputGroupAddon align="inline-end">
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <Select items={[{ label: "Роль", value: null }]}>
            <SelectTrigger className="bg-white w-100" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Роль</SelectLabel>
                {[{ label: "Все", value: null }].map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select items={[{ label: "Сортировка по", value: null }]}>
            <SelectTrigger className="bg-white w-100" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Сортировка по</SelectLabel>
                {[{ label: "Без сортировки", value: null }].map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button size="sm">
            {" "}
            <Plus /> Создать
          </Button>
        </div>
        <div className="relative h-[calc(100%-52px)] w-full">
          <div className="grid content-start grid-cols-4 gap-3 overflow-y-auto h-full w-full pt-5">
            {[
              0, 1, 2, 3, 4, 5, 6, 7,
            ].map((item) => (
              <button className="relative group bg-white rounded-xl p-3 px-3 py-4 min-w-80 flex-1 h-40 flex flex-col justify-between text-left scale-100 hover:scale-101 transition active:scale-100">
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">Иванов Иван Иванович</span>
                    <span className="text-[14px] opacity-40">Главный врач</span>
                  </div>
                  <Avatar>
                    <AvatarFallback>ИИ</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col text-[14px] leading-normal">
                  <a href="" className="opacity-40 w-fit hover:opacity-100">
                    {" "}
                    i.ivanov@vera.ru
                  </a>
                  <a href="" className="opacity-40 w-fit hover:opacity-100">
                    +7 (495) 123-45-67
                  </a>
                </div>
                <ArrowUpRight
                  className="absolute bottom-4 right-3 opacity-0 scale-0 rotate-45 transition group-hover:opacity-100 group-hover:rotate-0 group-hover:scale-100"
                  size="20"
                />
              </button>
            ))}
          </div>
          <div className="absolute inset-x-0 h-5 bg-linear-to-t from-gray-100 to-gray-100/0 bottom-0"></div>
          <div className="absolute inset-x-0 h-5 bg-linear-to-b from-gray-100 to-gray-100/0 top-0"></div>
        </div>
      </div>
    </AuthGuard>
  );
}
