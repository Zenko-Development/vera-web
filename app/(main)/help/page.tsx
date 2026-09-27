import { AuthGuard } from "@/features/components/AuthGuard";
import { Header } from "@/widgets/header/header";
import { Ambulance, ArrowRight, Hospital, ListChecks, Settings, UsersRound } from "lucide-react";
import Link from "next/link";

const steps = [
  { href: "/settings", title: "Настройте систему", description: "Заполните справочники, создайте роли и назначьте права.", icon: Settings },
  { href: "/users", title: "Добавьте сотрудников", description: "Создайте учётные записи и выдайте доступ к системе.", icon: UsersRound },
  { href: "/hospitals", title: "Настройте центры", description: "Добавьте контакты, направления, ресурсы, сотрудников и зоны.", icon: Hospital },
  { href: "/forms", title: "Опубликуйте формы", description: "Настройте вопросы и маршрутизацию, затем свяжите заболевания с центрами.", icon: ListChecks },
  { href: "/fleet", title: "Подготовьте смену", description: "Добавьте машины и зарегистрируйте планшеты.", icon: Ambulance },
];

export default function Help() {
  return (
    <AuthGuard requireAuth redirectTo="/login" className="h-full min-h-0">
      <Header title="Помощь" />
      <main className="min-h-0 flex-1 overflow-y-auto pb-6">
        <section className="rounded-xl bg-background p-5">
          <h2 className="text-lg font-semibold">Первичная настройка системы</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Это рекомендуемый порядок запуска. К данным центров и форм можно возвращаться по мере настройки связей между ними.</p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {steps.map(({ href, title, description, icon: Icon }, index) => (
              <li key={href}>
                <Link href={href} className="group flex h-full flex-col rounded-xl border p-4 outline-none transition hover:border-foreground/25 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span><span className="text-xs font-medium text-muted-foreground">Шаг {index + 1}</span></div>
                  <h3 className="mt-4 font-medium">{title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-medium">Перейти <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-3 grid gap-3 md:grid-cols-2">
          <HelpCard title="Форма не публикуется" text="Нажмите «Опубликовать» — редактор покажет незавершённые пункты. Каждый пункт можно открыть прямо из проверки готовности." />
          <HelpCard title="Планшет не начинает смену" text="Проверьте, что планшет и выбранная машина активны. После замены секрета старые данные и активная смена устройства перестают работать." />
          <HelpCard title="Центр не участвует в маршрутизации" text="Проверьте принимаемые заболевания, координаты, зоны обслуживания и доступность обязательных ресурсов." />
          <HelpCard title="Раздел недоступен" text="Доступ определяется правами роли. Администратор может изменить их в разделе «Настройки → Роли и доступ»." />
        </section>
      </main>
    </AuthGuard>
  );
}

function HelpCard({ title, text }: { title: string; text: string }) {
  return <article className="rounded-xl bg-background p-5"><h2 className="font-medium">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>;
}
