"use client";

import Link from "next/link";
import {
  Activity,
  Ambulance,
  ArrowRight,
  ChartNoAxesCombined,
  Hospital,
  ListChecks,
  MapPinned,
  Settings,
  UsersRound,
} from "lucide-react";
import { AuthGuard } from "@/features/components/AuthGuard";
import {
  checklistPermissions,
  checklistPagePermissions,
  dashboardPermissions,
  fleetPermissions,
  hospitalPermissions,
  hospitalPagePermissions,
  mapPermissions,
  settingsPermissions,
} from "@/features/auth/access-control";
import { usePermissions } from "@/features/auth/use-permissions";
import { useAuth } from "@/features/auth/useAuth";
import { Header } from "@/widgets/header/header";

const setupSteps = [
  { href: "/settings", title: "Настройте систему", description: "Заполните справочники, создайте роли и назначьте права.", icon: Settings, permissions: settingsPermissions },
  { href: "/users", title: "Добавьте сотрудников", description: "Создайте учётные записи и выдайте доступ к системе.", icon: UsersRound, permissions: ["user.manage"] },
  { href: "/hospitals", title: "Настройте центры", description: "Добавьте контакты, направления, ресурсы, сотрудников и зоны.", icon: Hospital, permissions: hospitalPagePermissions },
  { href: "/forms", title: "Опубликуйте формы", description: "Настройте вопросы и маршрутизацию, затем свяжите заболевания с центрами.", icon: ListChecks, permissions: checklistPagePermissions },
  { href: "/fleet", title: "Подготовьте смену", description: "Добавьте машины и зарегистрируйте планшеты.", icon: Ambulance, permissions: fleetPermissions },
] as const;

const workspaces = {
  hospital: {
    title: "Работа сосудистого центра",
    description: "Начните с оперативной сводки: ближайшие прибытия и требующие внимания ресурсы находятся выше справочных данных.",
    items: [
      { href: "/", title: "Оперативная сводка", description: "Оцените прибытия, готовность ресурсов и ближайшие операции.", icon: Activity, permissions: dashboardPermissions },
      { href: "/hospitals", title: "Работа центра", description: "Управляйте расписанием, ресурсами, сотрудниками и зонами обслуживания.", icon: Hospital, permissions: hospitalPagePermissions },
      { href: "/map", title: "Обстановка на карте", description: "Следите за машинами и ожидаемыми прибытиями в реальном времени.", icon: MapPinned, permissions: mapPermissions },
    ],
  },
  dispatcher: {
    title: "Работа с вызовами",
    description: "Главные действия диспетчера собраны вокруг актуального положения машин и выбора подходящего центра.",
    items: [
      { href: "/map", title: "Оперативная карта", description: "Контролируйте машины, прибытия и назначение центра для вызова.", icon: MapPinned, permissions: mapPermissions },
      { href: "/", title: "Сводка системы", description: "Проверьте текущее состояние парка и активность системы.", icon: Activity, permissions: dashboardPermissions },
      { href: "/analytics", title: "История вызовов", description: "Найдите завершённый вызов и проверьте выбранное направление.", icon: ChartNoAxesCombined, permissions: ["analytics.read"] },
    ],
  },
  analyst: {
    title: "Аналитика системы",
    description: "Сводка показывает текущее состояние, а журнал помогает восстановить последовательность решений и изменений.",
    items: [
      { href: "/", title: "Сводка показателей", description: "Быстро оцените доступные показатели системы.", icon: ChartNoAxesCombined, permissions: dashboardPermissions },
      { href: "/analytics", title: "Вызовы и аудит", description: "Изучайте завершённые вызовы и журнал действий пользователей.", icon: Activity, permissions: ["analytics.read"] },
    ],
  },
  general: {
    title: "Доступные возможности",
    description: "Здесь собраны разделы, доступные вашей роли. В каждом из них показаны только разрешённые данные и действия.",
    items: [
      { href: "/forms", title: "Формы", description: "Откройте доступные медицинские формы и их опубликованные версии.", icon: ListChecks, permissions: checklistPagePermissions },
      { href: "/hospitals", title: "Сосудистые центры", description: "Просматривайте доступные сведения о центрах.", icon: Hospital, permissions: hospitalPagePermissions },
      { href: "/fleet", title: "Машины и планшеты", description: "Работайте с доступной частью парка устройств.", icon: Ambulance, permissions: fleetPermissions },
      { href: "/settings", title: "Настройки", description: "Изменяйте доступные справочники и параметры системы.", icon: Settings, permissions: settingsPermissions },
    ],
  },
} as const;

export default function Help() {
  const { user } = useAuth();
  const { can, canAny } = usePermissions();
  const setupMode = canAny([
    "rbac.manage",
    "user.manage",
    "geo_tracking_policy.manage",
    "facility_type.manage",
    "sickness.manage",
    "checklist.manage",
    "ambulance_vehicle.manage",
    "device.provision",
  ]);
  const hospitalMode = !setupMode && Boolean(user?.hospitalIds.length) && canAny([
    "hospital_arrival.read",
    "hospital_resource.read",
    "hospital_resource.change_status",
    "hospital_resource.manage",
  ]);
  const dispatcherMode = !setupMode && !hospitalMode && canAny([
    "emergency_call.read",
    "emergency_call.destination.select",
    "fleet_location.read",
  ]);
  const workspace = hospitalMode
    ? workspaces.hospital
    : dispatcherMode
      ? workspaces.dispatcher
      : can("analytics.read")
        ? workspaces.analyst
        : workspaces.general;
  const items = setupMode
    ? setupSteps.filter((step) => canAny(step.permissions))
    : workspace.items.filter((item) => canAny(item.permissions));
  const title = setupMode ? "Первичная настройка системы" : workspace.title;
  const description = setupMode
    ? "Рекомендуемый порядок запуска: сначала доступы и справочники, затем центры, формы и устройства."
    : workspace.description;

  return (
    <AuthGuard requireAuth redirectTo="/login" className="h-full min-h-0">
      <Header title="Помощь" />
      <main className="min-h-0 flex-1 overflow-y-auto pb-6">
        <section className="rounded-xl bg-card p-5 text-card-foreground ring-1 ring-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map(({ href, title: itemTitle, description: itemDescription, icon: Icon }, index) => (
              <li key={href}>
                <Link href={href} className="group flex h-full flex-col rounded-xl border p-4 outline-none transition-colors duration-200 hover:border-primary/35 hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                    {setupMode && <span className="text-xs font-medium text-muted-foreground">Шаг {index + 1}</span>}
                  </div>
                  <h3 className="mt-4 font-medium">{itemTitle}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{itemDescription}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-medium">Открыть <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" /></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-3 grid gap-3 md:grid-cols-2">
          {canAny(checklistPermissions) && <HelpCard title="Форма не публикуется" text="Нажмите «Опубликовать» — редактор покажет незавершённые пункты. Каждый пункт можно открыть прямо из проверки готовности." />}
          {canAny(fleetPermissions) && <HelpCard title="Планшет не начинает смену" text="Проверьте, что планшет и выбранная машина активны. После замены секрета старые данные и активная смена устройства перестают работать." />}
          {canAny(hospitalPermissions) && <HelpCard title="Центр не участвует в маршрутизации" text="Проверьте принимаемые заболевания, адрес, зоны обслуживания и доступность обязательных ресурсов." />}
          <HelpCard title="Раздел недоступен" text={can("rbac.manage") ? "Доступ определяется правами роли. Изменить их можно в разделе «Настройки → Роли и доступ»." : "Доступ определяется вашей ролью. Обратитесь к администратору системы, если нужен дополнительный раздел."} />
        </section>
      </main>
    </AuthGuard>
  );
}

function HelpCard({ title, text }: { title: string; text: string }) {
  return <article className="rounded-xl bg-card p-5 text-card-foreground ring-1 ring-border"><h2 className="font-medium">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>;
}
