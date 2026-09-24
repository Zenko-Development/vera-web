# Отчёт о проверке API и обработки ошибок

Дата проверки: 2026-09-09. Проверялся код из текущей рабочей копии. Внешний порт `8080` был занят Apache, поэтому сервер запускался на `18080` через `BACKEND_PORT=18080`. PostgreSQL был доступен на `localhost:5432`; чтение `GET /api/v1/role/` вернуло `200 OK` и данные из БД. Изменяющие запросы с корректными данными специально не выполнялись, чтобы не менять рабочие записи.

## Что проверено

1. `go test ./...` до исправлений: сборка не проходила из-за устаревших вызовов `auth.NewService` в `internal/auth/service_test.go`; `go vet` также находил дублирующее условие в routing-сервисе.
2. HTTP-сервер: запуск через `go run .` из `cmd/api` с `GOCACHE` внутри рабочей папки.
3. Негативные HTTP-сценарии: неверный тип JSON, пустые обязательные поля, пустой refresh-токен, невалидный UUID.
4. Регрессионные `httptest`: проверяют статус `400`, одиночный JSON-объект ошибки и отсутствие обращения к сервису после невалидного тела.

## Исправления

- Добавлены теги `validate:"required"`, `validate:"required,uuid4"`, `oneof` и `min=0` для обязательных полей auth, user, permission, checklist, checklist version/question/option/result/routing, hospital, sickness и facility type. Пустые обязательные поля и недопустимые значения теперь отклоняются до вызова сервиса.
- Исправлена обработка ошибок декодирования в checklist, hospitals, sickness и permission: после записи `400` обработчик завершает работу и не дописывает успешный JSON или не обращается к БД.
- Исправлено продолжение после ошибки сервиса в checklist и sickness: ошибка теперь является единственным ответом.
- Исправлено проглатывание ошибок в facility type: необработанная ошибка теперь возвращает `500`, а не `200` с пустым телом.
- Ошибка чтения заболевания больше не подавляется в SQL-репозитории.
- Невалидные UUID facility type/checklist/sickness теперь классифицируются как `400` там, где сервис выполняет разбор ID.
- Добавлена валидация тела для обновления facility type и checklist rule; UUID-ошибки permission-role и routing GET теперь также возвращаются как `400`. Ошибки репозитория permission-role больше не теряются в сервисе.
- Для session добавлена проверка обязательных полей и корректная классификация неверного UUID идентификатора.
- Пустые доменные сообщения hospitals заменены на понятные `invalid request`, `hospital not found`, `hospital already exists` и `name can't be empty`.
- Добавлены регрессионные тесты в `internal/auth/handler_test.go`, `internal/checklist/handler_test.go`, `internal/facility_types/handler_test.go`. Устаревшие auth unit-тесты приведены к текущему интерфейсу сессий.

## Результат повторной проверки

Команда:

```powershell
$env:GOCACHE = 'D:\vera-backend\.gocache'
go test ./...
```

Результат: все пакеты прошли (`ok`), включая добавленные тесты auth, checklist и facility type. Отдельно `go vet ./...` также завершился без ошибок. `git diff --check` не обнаружил ошибок пробелов.

Проверенные запросы к запущенному серверу:

| Сценарий | Ожидаемый результат после исправления | Фактический результат |
| --- | --- | --- |
| `POST /api/v1/auth/login`, числовой `user_name` | `400`, JSON с `message` | `400`, `{"message":"invalid json"}` |
| `POST /api/v1/auth/refresh`, тело `{}` | `400`, обязательный `refresh_token` | `400`, ошибка валидации поля |
| `POST /api/v1/checklist/`, пустой `name`/невалидный `sickness_id` | `400`, без обращения к БД | `400`, ошибки `required` и `uuid4` |
| `POST /api/v1/facility-type/`, пустой `name`/числовой `code` | `400`, без обращения к БД | `400`, `{"message":"invalid json"}` для неверного типа |
| `PATCH /api/v1/facility-type/{id}`, пустые `name`/`code` | `400`, без обращения к БД | `400`, ошибки `required` |
| `POST /api/v1/checklist-versions/{version_id}/rules`, пустой `name`/невалидный `result_id`/отрицательный `priority` | `400`, без обращения к БД | `400`, ошибки `required`, `uuid4` и `min` |
| `GET /api/v1/checklist-result-routing/checklist-results/not-a-uuid` | `400` | `400`, `{"message":"invalid request"}` |
| `GET /api/v1/facility-type/not-a-uuid` | `400` | `400`, `{"message":"invalid request"}` |
| `GET /api/v1/role/` с доступной БД | `200`, массив в `data` | `200`, массив ролей |

Для проверки тела через PowerShell удобнее передавать объект через `ConvertTo-Json`, чтобы PowerShell не добавлял кавычки вокруг всего JSON:

```powershell
$base = 'http://localhost:18080'
$body = @{ name = ''; description = 'x'; sickness_id = 'not-a-uuid' } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Post -Uri "$base/api/v1/checklist/" -ContentType 'application/json' -Body $body
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

## Обнаруженные логические дефекты, которые остаются в отчёте

Эти случаи требуют отдельного решения по бизнес-логике или SQL и намеренно не маскировались как ошибки валидации.

### CR-01. Обновление больницы всегда может завершиться ошибкой типов SQL

Сценарий: `PATCH /api/v1/hospital/{id}` с существующим UUID и телом `{"name":"Новая больница","description":"x"}`. Handler передаёт только `name` и `description`, а SQL использует `phone` как запасное значение для `facility_type_id`, `latitude` и `longitude`. PostgreSQL получает несовместимые типы, запрос заканчивается `500`. Исправлять запрос в `db/query/hospitals.sql` и регенерировать sqlc-код.

### CR-02. Создание/обновление routing нарушает CHECK миграции +

Сценарий: `POST /api/v1/checklist-result-routing/{result_id}` с `routing_type=fixed` и существующим `hospital_id`, либо `nearest` с `facility_type_id`, для результата черновой версии. Репозиторий передаёт неиспользуемый FK как UUID `00000000-...` вместо SQL `NULL`; миграция 017 требует `NULL`. Фактический ответ `500` с ошибкой ограничения. Нужно передавать `pgtype.UUID{Valid:false}` для неиспользуемого FK.

### CR-03. В routing GET SQL NULL превращается в нулевой UUID +

Сценарий: после исправления CR-02 вызвать `GET /api/v1/checklist-result-routing/{id}`. Поле неиспользуемого FK возвращается строкой `00000000-0000-0000-0000-000000000000`, а не JSON `null`. Нужно изменить DTO/преобразование ответа, если клиенту требуется различать NULL.

### CR-04. Версия/вопрос имеют дублирование ID в URL и JSON

Сценарий: отправить `POST /api/v1/checklist/{checklist_id}/versions/` с `checklist_id` в теле, отличным от URL; либо `POST /api/v1/checklist-questions/{version_id}/checklist-versions` с отличным `checklist_version_id`. Сервисы используют ID из тела и игнорируют URL. Нужно выбрать один источник идентификатора и проверить совпадение.

### CR-05. AuthMiddleware подключён к пустой группе

Сценарий: вызвать любую ручку из `/api/v1` без `Authorization`. Запрос проходит; группа с `middleware.AuthMiddleware` не содержит маршрутов. Если API должен быть закрытым, перенести защищённые маршруты внутрь группы.

### CR-06. Несогласованные статусы и пустые ответы DELETE/GET

Сценарии: `DELETE /api/v1/hospital/{id}`, `DELETE /api/v1/permission/{id}`, `DELETE /api/v1/link/role/{role_id}/permission/{permission_id}` успешно завершаются без тела; GET связей hospital/sickness возвращают `201`; facility type при ряде ошибок отвечает `200` без тела (исправление теперь возвращает `500`, но доменный `404` ещё не выделен). Зафиксировать единый контракт статусов для клиентов.

### CR-07. Удаление routing не проверяет draft

Сценарий: удалить routing, относящийся к опубликованной или архивной версии. Текущий сервис удаляет запись без проверки статуса версии. Если это запрещено бизнес-правилом, добавить такую проверку и тест.

### CR-08. Ошибки отсутствующих записей не унифицированы

Сценарии: `GET /api/v1/user/{unknown-uuid}`, `GET /api/v1/checklist-results/{unknown-uuid}`, `GET /api/v1/checklist-rules/{unknown-uuid}`. В разных модулях можно получить `400`, `404` или `500`, потому что `pgx.ErrNoRows` не везде преобразуется в доменную ошибку. Нужна общая политика `pgx.ErrNoRows -> 404`.

### CR-09. Несколько полей/связей допускают дубли

Сценарий: повторить POST с тем же `device_id`, permission name или парой role/permission и hospital/sickness. Текущие миграции не везде содержат UNIQUE, поэтому создаются дубли. Решение зависит от требований: добавить ограничения или явно разрешить повторения и описать их клиенту.

### CR-10. Миграции имеют порядок/ссылочные риски

Сценарий: выполнить чистый `migrate up` с нуля. Миграция routing ссылается на `facility_types`, таблица которой создаётся позднее в 019; также индексы/SQL местами используют разные имена колонок. Нужен отдельный прогон миграций на пустой БД и исправление порядка/имен.

## Повторный сценарий для проверки отчёта

1. Запустить PostgreSQL и применить все миграции на отдельной тестовой базе.
2. Запустить API: `cd cmd/api; $env:BACKEND_PORT='18080'; go run .`.
3. Для каждого CR-сценария создать минимальные связанные записи через POST или SQL-фикстуры и сохранить UUID ответа.
4. Отправить запрос, указанный в сценарии, сохранить HTTP-статус и тело ответа.
5. Проверить, что тело ошибки — один JSON-объект с `message`, а успешные ответы имеют ожидаемую обёртку `data`.
6. После исправления дефекта повторить тот же запрос и добавить в этот отчёт фактический статус до/после.

## Повторная проверка после исправления (2026-09-11)

Исправлены CR-01—CR-10. Приняты следующие единые контракты: вложенный ID берётся из URL и при наличии в JSON должен совпадать с ним; все ручки, кроме `auth/login` и `auth/refresh`, требуют access token; успешный `DELETE` возвращает `204` без тела; успешный `GET` возвращает `200`; отсутствующая запись возвращает `404`; неиспользуемый routing FK возвращается как JSON `null`; перечисленные в CR-09 дубли запрещены уникальными индексами миграции 020.

Автоматические проверки:

- `go test ./...` — все пакеты прошли.
- `go vet ./...` — ошибок нет.
- `git diff --check` — ошибок нет.
- Чистый цикл PostgreSQL на отдельной БД — `20 up / 20 down`, успешно.

Ручной HTTP-прогон выполнялся на `http://localhost:18084`/`18085` с отдельной БД `vera_api_test`:

| Сценарий | Результат после исправления |
| --- | --- |
| `GET /api/v1/role/` без `Authorization` | `401`, один JSON-объект с `message` |
| `POST /api/v1/auth/login` с тестовым пользователем | `200`, access/refresh token в `data` |
| `PATCH /api/v1/hospital/{id}` только с `name`/`description` | `200`; пропущенные address, phone, facility type и координаты сохранены |
| Routing `fixed` create и `nearest` update | `201`/`200`; неиспользуемый FK равен JSON `null` |
| Routing GET по ID и result ID | `200` |
| DELETE routing опубликованной версии | `409`; запись не удалена |
| Несовпадающие ID URL/JSON для version и question | `400` |
| Неизвестные UUID user/checklist-result/checklist-rule/facility-type | `404` |
| GET связей hospital/sickness | `200` |
| Повторные device ID, permission name, role/permission и hospital/sickness | `409` |
| DELETE hospital, permission, role/permission и hospital/sickness | `204` без тела |
