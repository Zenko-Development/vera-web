# Как создавать и назначать permissions

## Главное правило

В Vera право — это **стабильный контракт кода** формата `resource.action`.
Например:

```text
checklist.read
checklist.manage
checklist.publish
device.provision
```

Нельзя защитить новую ручку, просто создав произвольную строку в таблице
`permission`: middleware должен явно потребовать это же имя в Go-коде. Поэтому
новые permissions добавляет разработчик через код и Go seed, а администратор
через API только назначает уже существующие permissions ролям.

## Как запрос проходит проверку

```text
HTTP request + Bearer access token
        ↓
AuthMiddleware проверяет подпись и извлекает user_id / role_id из JWT
        ↓
RequirePermission(..., "checklist.publish")
        ↓
RoleHasPermission: role → permission_role → permission в PostgreSQL
        ↓
200 и handler либо 403 Forbidden
```

`cmd/api/main.go` определяет, какая операция требует какое право. Например,
публикация версии чеклиста защищена так:

```go
r.With(middleware.RequirePermission(authorizer, rbac.ChecklistPublish)).
    Post("/{id}/publish", handlerChecklistVersion.PublishChecklistVersion)
```

Здесь URL и HTTP-метод не являются именем права. Их проверяет router, а право
`checklist.publish` выражает бизнес-действие «публиковать чеклисты».

## Когда нужно новое permission

Добавляйте новое право, только если действие действительно имеет иной уровень
доступа. Не создавайте права для технических вариантов одной операции:

```text
Плохо: checklist.get.list, checklist.get.by_id
Хорошо: checklist.read
```

Отдельное право оправдано, когда риск или ответственность отличаются:

```text
hospital_resource.read
hospital_resource.manage
hospital_resource.change_status
```

Для MVP обычно достаточно `read`, `manage`, а для особо важных операций —
отдельного глагола, например `publish`, `provision`, `reset_secret`.

## Пошаговое добавление нового permission

Пример: создаётся модуль ресурсов больницы и действие изменения их статуса.

### 1. Добавить константу

В `internal/rbac/permissions.go`:

```go
const (
    HospitalResourceChangeStatus = "hospital_resource.change_status"
)
```

Имя после выпуска не следует переименовывать без отдельной миграции данных и
кода: оно может быть назначено существующим ролям.

### 2. Добавить его в каталог seed

В тот же файл, в `DefaultPermissions`:

```go
{
    Name:        HospitalResourceChangeStatus,
    Description: "Change availability of hospital resources",
},
```

`DefaultPermissions` — единственный каталог permissions, известных приложению.
Команда `seed-rbac` проходит по нему, создаёт отсутствующие строки в таблице
`permission` и автоматически выдаёт новое право роли `administrator`.
Повторный запуск безопасен: дубликаты не появляются.

### 3. Потребовать право на маршруте

В `cmd/api/main.go` импортируется пакет `rbac`, после чего middleware ставится
на конкретную ручку или группу ручек:

```go
r.With(middleware.RequirePermission(
    authorizer,
    rbac.HospitalResourceChangeStatus,
)).Patch("/{id}/status", handler.UpdateStatus)
```

Не прячьте эту проверку внутри handler: маршрут в `main.go` остаётся полным
списком границ доступа приложения.

### 4. Проверить тестами

Минимум нужны:

- тест каталога: имя непустое и не повторяется;
- тест middleware: роль с правом получает доступ, без права — `403`;
- тест бизнес-сервиса, что изменение статуса подчиняется его инвариантам.

Команды проверки:

```powershell
go test ./internal/rbac ./internal/middleware
go test ./...
```

### 5. Загрузить право в базу

Локально:

```powershell
go run ./cmd/seed-rbac
```

В Docker Compose это делает сервис `rbac-seed` после миграций и до запуска API.
Для добавления permission **не нужна SQL-миграция**, если не меняется схема БД.
Миграция потребуется для новых таблиц, колонок, индексов или ограничений.

### 6. Назначить право нужной роли

После seed администратор получает право автоматически. Для другой роли:

1. получить ID права через `GET /api/v1/permission/`;
2. получить или создать роль через `/api/v1/role/`;
3. выполнить запрос без тела:

```http
POST /api/v1/link/role/{role_id}/permission/{permission_id}
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

Эти операции требуют `rbac.manage`. Изменение набора прав роли начинает
действовать сразу для новых HTTP-запросов с JWT этой роли: middleware делает
проверку связи role–permission в БД на каждом защищённом запросе.

## Что можно делать через API

| Действие | Как выполняется |
| --- | --- |
| Создать роль | `POST /api/v1/role/` |
| Посмотреть каталог permissions | `GET /api/v1/permission/` |
| Выдать право роли | `POST /api/v1/link/role/{role_id}/permission/{permission_id}` |
| Отозвать право у роли | `DELETE /api/v1/link/role/{role_id}/permission/{permission_id}` |
| Создать новое системное permission | Только код + `DefaultPermissions` + Go seed |

Внешние `POST /permission` и `DELETE /permission` не зарегистрированы намеренно:
они позволили бы создать строку в БД, которая ничего не защищает, либо удалить
право, требуемое работающим маршрутом.

## Удаление или переименование права

Сначала удалите все вызовы `RequirePermission` с этим именем и замените их
новой политикой, затем отзовите право у ролей. `seed-rbac` не удаляет старые
строки, поэтому физическое удаление — отдельная осознанная миграция данных.
Не удаляйте permission напрямую из production-БД, пока код продолжает его
требовать: все запросы к такой ручке станут получать `403`.
