# RBAC: роли и права

## Модель

Vera использует RBAC-модель:

```text
user → role → permission_role → permission
```

`device` не является пользователем и не получает роль. Планшеты скорой
проходят отдельную проверку через device access token.

Право имеет стабильное имя формата `ресурс.действие`, например:

```text
checklist.read
checklist.manage
checklist.publish
device.provision
device.reset_secret
rbac.manage
```

Имя права — контракт кода. Оно хранится в
[internal/rbac/permissions.go](../internal/rbac/permissions.go), а не
создаётся администратором через API: произвольное имя не защитит маршрут, пока
код явно не потребует его через `RequirePermission`.

Администратор управляет ролями и назначает существующие права через маршруты
`/role`, `/permission` и `/link/role/{role_id}/permission/{permission_id}`.
Каталог прав доступен только для чтения: добавление нового права — задача
разработчика, состоящая из константы, Go seed и подключения middleware к
маршруту.

## Проверка запроса

Для пользовательских маршрутов сервер выполняет два последовательных шага:

```text
Bearer access token
    ↓
AuthMiddleware: token типа user и валидная подпись
    ↓
RequirePermission: роль из JWT имеет право в БД
    ↓
handler
```

Отсутствующий или неверный токен возвращает `401 Unauthorized`; действующий
токен без права — `403 Forbidden`. Проверка права делает запрос к БД при
каждом обращении, поэтому назначение или отзыв права у роли действует сразу
для следующего запроса. Изменение роли самого пользователя попадёт в новый
JWT при следующем refresh; срок access token ограничен `JWT_ACCESS_TTL`.

## Go seed

Команда создаёт роль `administrator`, весь системный каталог прав и назначает
все эти права роли администратора. Она идемпотентна: повторный запуск не
создаёт дубликатов и не удаляет данные.

Локальный запуск:

```powershell
go run ./cmd/seed-rbac
```

В Docker Compose сервис `rbac-seed` запускается автоматически после миграций
и до API-сервера.

## Создание первого администратора

Если активного администратора ещё нет, Go seed создаёт его автоматически.
Перед запуском должны быть заданы две переменные окружения:

```text
ADMIN_NAME
ADMIN_PASSWORD
```

`ADMIN_NAME` становится логином и отображаемым именем. Обязательное поле
фамилии, которого требует текущая схема `user`, seed заполняет техническим
значением `Administrator`.

Для Docker Compose добавьте реальные значения в локальный `.env`. Сервис
`rbac-seed` создаст пользователя до запуска API. При ручном повторном запуске
можно выполнить:

```powershell
docker compose run --rm --entrypoint /bootstrap-admin server
```

Seed не изменяет и не перезаписывает существующего активного администратора.
Он не выводит пароль и сохраняет только bcrypt-хеш. После создания можно войти через
`POST /api/v1/auth/login` и управлять остальными ролями через защищённый API.

Не помещайте `ADMIN_PASSWORD` в Git, `.env.example`, документацию
или логи. После bootstrap удалите эти переменные из окружения.

## Текущий каталог

| Группа | Права |
| --- | --- |
| RBAC | `rbac.manage` |
| Пользователи | `user.manage` |
| Планшеты | `device.read`, `device.provision`, `device.reset_secret` |
| Машины | `ambulance_vehicle.manage` |
| Больницы | `hospital.read`, `hospital.manage`, `hospital_service_area.manage` |
| Справочники | `facility_type.manage`, `sickness.manage` |
| Чеклисты | `checklist.read`, `checklist.manage`, `checklist.publish` |
| Вызовы и прибытия | `emergency_call.read`, `hospital_arrival.read` |
| GPS и ETA | `geo_tracking_policy.manage` |
| Аналитика | `analytics.read` |
