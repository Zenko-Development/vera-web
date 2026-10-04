# Авторизация, пользователи, устройства и права

[К общей документации API](../API_DOCUMENTATION.md)

Маршруты взяты из [cmd/api/main.go](../../cmd/api/main.go); поля — из `internal/<модуль>/dto.go`, ограничения хранения — из [миграций](../../db/migrations/). Статусы и фактическое представление данных сверены с handler, service, repository и SQL-запросами.

Все URL указаны относительно адреса сервера. Для JSON-запросов используйте `Content-Type: application/json`. Успешные JSON-ответы имеют обёртку `data`; ошибки — поле `message`, например:

```json
{
  "message": "invalid json"
}
```

Исключения с пустым ответом явно указаны ниже. UUID и даты в примерах условные, даты возвращаются строками RFC 3339. Значения токенов в примерах нужно заменить токенами из ответа сервера. Пагинация и фильтры через query-параметры в этих ручках не реализованы.

Маршруты этого раздела, кроме `/auth/login` и `/auth/refresh`, требуют employee access token в заголовке `Authorization: Bearer <access_token>`. На маршрутах с RBAC после проверки JWT сервер сверяет право роли с БД: отсутствие или недействительность токена даёт `401`, отсутствие права — `403`. `/auth/me` не требует отдельного права и читает актуальные данные сотрудника из БД. Условия в таблицах БД не означают, что DTO проверяет их до SQL-запроса. Устройства скорой и их вход описаны отдельно: [устройства, машины и доступ устройства](device-ambulance-access.md).

## Авторизация

Источники: [DTO](../../internal/auth/dto.go), [handler](../../internal/auth/handler.go), [service](../../internal/auth/service.go), [сессии](../../db/migrations/006_session.up.sql).

### POST /api/v1/auth/login

Вход по логину и паролю; создаёт сессию и возвращает пару JWT.

**URL:** `POST /api/v1/auth/login`

**Request:** JSON. Все три поля — обязательные непустые строки; это проверяется валидатором DTO. `device_id` — строковая метка устройства сессии, связь с таблицей `device` отсутствует.

```json
{
  "user_name": "ivanov",
  "password": "example-password",
  "device_id": "tablet-001"
}
```

**Response:** `200 OK`.

```json
{
  "data": {
    "access_token": "ACCESS_TOKEN_FROM_SERVER",
    "refresh_token": "REFRESH_TOKEN_FROM_SERVER"
  }
}
```

Ошибки: `400` при некорректном JSON или пустом обязательном поле; `401` с `{"message":"invalid username or password"}` при неверных учётных данных, отключённом `acces_status` и любой ошибке сервиса, включая ошибку создания сессии.

### GET /api/v1/auth/me

Возвращает профиль сотрудника по employee access token. Тело запроса отсутствует, дополнительных прав не требуется. Пользователь, роль, права и больницы читаются из БД на каждом вызове, поэтому ответ отражает изменения после выдачи JWT.

**Response:** `200 OK`.

```json
{
  "data": {
    "user": {
      "id": "11111111-1111-4111-8111-111111111111",
      "user_name": "ivanov",
      "name_first": "Иван",
      "name_middle": "Иванович",
      "name_last": "Иванов",
      "acces_status": true,
      "role_id": "22222222-2222-4222-8222-222222222222"
    },
    "role": {"id": "22222222-2222-4222-8222-222222222222", "name": "hospital_staff"},
    "permissions": ["hospital_arrival.read", "hospital_resource.read"],
    "hospital_ids": ["33333333-3333-4333-8333-333333333333"]
  }
}
```

Для сотрудника без назначений `hospital_ids` — `[]`; права тоже возвращаются массивом, даже если он пуст. Недействительный/истёкший access token, удалённый или заблокированный пользователь дают `401`. Ошибка БД — `500`. Текущий employee access token не содержит ID refresh-сессии, поэтому ручка проверяет актуальный аккаунт, но не может подтвердить, что конкретная refresh-сессия не была отозвана.

### POST /api/v1/auth/refresh

Обновляет токены и хеш refresh-токена в существующей сессии. Сроки жизни берутся из конфигурации JWT.

**URL:** `POST /api/v1/auth/refresh`

**Request:** JSON с действующим refresh-токеном. У DTO нет `required`, поэтому отсутствующий/пустой `refresh_token` доходит до проверки токена и приводит к `401`.

```json
{
  "refresh_token": "REFRESH_TOKEN_FROM_LOGIN"
}
```

**Response:** `200 OK`.

```json
{
  "data": {
    "access_token": "ACCESS_TOKEN_FROM_SERVER",
    "refresh_token": "REFRESH_TOKEN_FROM_SERVER"
  }
}
```

Ошибки: `400` с `{"message":"invalid json"}`; `401` с `{"message":"invalid or expired refresh token"}` при недействительном токене, неверном типе токена, отсутствующей, отозванной или истёкшей сессии. Используйте возвращённый refresh-токен для следующих обращений.

### POST /api/v1/auth/logout

Удаляет сессию по refresh-токену.

**URL:** `POST /api/v1/auth/logout`

**Request:** JSON. Для успеха нужен действующий refresh-токен существующей сессии; отсутствие поля валидатор DTO не отклоняет.

```json
{
  "refresh_token": "REFRESH_TOKEN_FROM_SERVER"
}
```

**Response:** `200 OK`, тело пустое. JSON-объект не возвращается: handler после успешного удаления ничего не записывает в ответ.

Ошибки: `400` с `{"message":"invalid json"}`; `401` с `{"message":"invalid or expired refresh token"}`. Повторный выход с токеном удалённой сессии возвращает `401`. Уже выданный access-токен эта операция не отзывает.

## Пользователи

Источники: [DTO](../../internal/user/dto.go), [handler](../../internal/user/handler.go), [service](../../internal/user/service.go), [repository](../../internal/user/repository_sqlc.go), [миграция](../../db/migrations/004_user.up.sql).

### POST /api/v1/user/

Создаёт пользователя и хеширует переданный пароль.

**URL:** `POST /api/v1/user/`

**Request:** JSON.

```json
{
  "user_name": "ivanov",
  "name_first": "Иван",
  "name_middle": "Иванович",
  "name_last": "Иванов",
  "acces_status": true,
  "role_id": "11111111-1111-4111-8111-111111111111",
  "password": "example-password"
}
```

| Поле | Тип | Ограничения и поведение |
| --- | --- | --- |
| `user_name` | string | В БД `username`: `NOT NULL`, `UNIQUE`; обязательная непустая строка. |
| `name_first`, `name_last` | string | Обязательные непустые строки. |
| `name_middle` | string | Необязательное отчество; пустая строка/отсутствующее поле записываются как SQL `NULL`, в ответе возвращается `""`. |
| `acces_status` | boolean | Именно такое написание JSON-ключа. При отсутствии — `false`; в БД `NOT NULL DEFAULT false`. |
| `role_id` | string (UUID v4) | Обязательное поле; ссылка на существующую роль, в БД внешний ключ `ON DELETE RESTRICT`. |
| `password` | string | Обязательная исходная строка пароля; сервер сохраняет bcrypt-хеш. |

В `CreateUserDto` обязательность `user_name`, имени, фамилии, `role_id` и `password` проверяется валидатором до вызова сервиса. `role_id` также должен быть UUID v4.

**Response:** `201 Created`. Пароль, хеш и даты пользователя не возвращаются.

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "user_name": "ivanov",
    "name_first": "Иван",
    "name_middle": "Иванович",
    "name_last": "Иванов",
    "acces_status": true,
    "role_id": "11111111-1111-4111-8111-111111111111"
  }
}
```

Ошибки: `400` при некорректном JSON; `409` с `{"message":"user already exist"}` при повторном логине или `{"message":"Role not found"}` при нарушении внешнего ключа роли; `500` с `{"message":"internal server error"}` при остальных ошибках.

### GET /api/v1/user/{id}

Возвращает пользователя по UUID записи.

**URL:** `GET /api/v1/user/{id}`

**Request:** path `id` — UUID пользователя, например `22222222-2222-4222-8222-222222222222`. Тела нет.

**Response:** `200 OK`.

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "user_name": "ivanov",
    "name_first": "Иван",
    "name_middle": "",
    "name_last": "Иванов",
    "acces_status": true,
    "role_id": "11111111-1111-4111-8111-111111111111"
  }
}
```

Неверный UUID возвращает `400`, отсутствующий или удалённый пользователь — `404`.

### GET /api/v1/user/name/{username}

Возвращает пользователя по точному логину.

**URL:** `GET /api/v1/user/name/{username}`

**Request:** path `username` — логин, например `ivanov`; спецсимволы необходимо кодировать для URL. Тела нет.

**Response:** `200 OK`, объект пользователя в `data` с полями `id`, `user_name`, `name_first`, `name_middle`, `name_last`, `acces_status`, `role_id`; [пример ответа](#get-apiv1userid).

Отсутствующий или удалённый пользователь возвращает `404`.

### GET /api/v1/user/

Возвращает всех сотрудников, кроме логически удалённых.

**Response:** `200 OK`, `data` — массив объектов пользователя того же формата, что в `GET /api/v1/user/{id}`. Сейчас нет query-фильтров и пагинации.

### PATCH /api/v1/user/{id}

Изменяет профиль сотрудника. Требуется employee JWT с правом `user.manage`. Можно передать любое непустое подмножество полей; отсутствующие поля сохраняют прежние значения.

```json
{
  "user_name": "ivanov",
  "name_first": "Иван",
  "name_middle": "",
  "name_last": "Иванов"
}
```

Пустая строка в `name_middle` удаляет отчество. `user_name`, `name_first` и `name_last` не могут быть пустыми или состоять из пробелов. Роль, пароль и доступ изменяются отдельными ручками. Удалённого пользователя обновить нельзя. Изменение и событие аудита сохраняются атомарно.

**Response:** `200 OK` с обновлённым объектом пользователя в `data`; `400` — неверный UUID или данные; `404` — пользователь не найден; `409` — логин уже занят.

### PATCH /api/v1/user/status/{id}

Изменяет доступ сотрудника к системе.

```json
{
  "acces_status": false
}
```

**Response:** `200 OK`, обновлённый объект пользователя в `data`.

Имя поля намеренно написано как `acces_status` — с одной буквой `s` в `acces`. Неверный UUID возвращает `400 Bad Request`, отсутствующий пользователь — `404 Not Found`.

### PATCH /api/v1/user/{id}/role

Изменяет роль сотрудника, не создавая новую учётную запись. Нужно право `user.manage`.

```json
{
  "role_id": "11111111-1111-4111-8111-111111111111"
}
```

**Response:** `200 OK`, обновлённый объект пользователя в `data`. Неверный UUID — `400 Bad Request`; несуществующие пользователь или роль — `404 Not Found`.

### POST /api/v1/user/{id}/password-reset

Администратор устанавливает новый пароль сотруднику. Требуется employee JWT с правом `user.manage`. Пароль должен содержать не менее 12 символов и не более 72 байт в UTF-8 (ограничение bcrypt).

```json
{"new_password":"new-long-password-123"}
```

**Response:** `204 No Content`. Пароль хранится только как bcrypt-хеш. Все refresh-сессии пользователя отзываются; событие сброса записывается в аудит без пароля и хеша. Уже выданные access-токены продолжают действовать до истечения их срока — сброс пароля не аннулирует их мгновенно.

Ошибки: `400` — неверный UUID или пароль; `404` — пользователь отсутствует или удалён; `401`/`403` — нет действительного токена/права.

### DELETE /api/v1/user/{id}

Административное логическое удаление пользователя. Требуется employee JWT с правом `user.manage`; `id` — UUID пользователя. Тело запроса отсутствует.

**Response:** `204 No Content`. Пользователь исключается из `/user/`, поиска по ID и логину, лишается доступа, все его refresh-сессии отзываются, назначения больниц снимаются. Сама запись пользователя и журнал аудита сохраняются для истории; занятый логин не освобождается.

Ошибки: `400` — неверный UUID; `404` — пользователь уже удалён или отсутствует; `409` — попытка удалить последнего активного администратора; `401`/`403` — отсутствие токена/права. Повторный DELETE возвращает `404`.

Операция атомарна вместе с аудитом. Уже выданный employee access token отклоняется на защищённых маршрутах, потому что middleware читает актуальный статус и роль пользователя из БД на каждом запросе.

## Роли

Источники: [DTO](../../internal/role/dto.go), [handler](../../internal/role/handler.go), [repository](../../internal/role/repository_sqlc.go), [миграция](../../db/migrations/002_role.up.sql).

### POST /api/v1/role/

Создаёт роль.

**URL:** `POST /api/v1/role/`

**Request:** JSON. `name` — обязательная непустая строка по DTO, `TEXT NOT NULL UNIQUE` в БД. Длина и строка из пробелов дополнительно не проверяются.

```json
{
  "name": "dispatcher"
}
```

**Response:** `201 Created`.

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "dispatcher"
  }
}
```

Ошибки: `400` при некорректном JSON/пустом имени; фактически `500` с `{"message":"internal server error"}` при повторном имени или другой ошибке БД. Ветка `409` есть в handler, но ошибка уникальности из БД не преобразуется в ожидаемую ошибку роли.

### GET /api/v1/role/

Возвращает все роли.

**URL:** `GET /api/v1/role/`

**Request:** параметров и тела нет.

**Response:** `200 OK`.

```json
{
  "data": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "dispatcher"
    }
  ]
}
```

Пустой результат: `{"data":[]}`. Порядок не задан. Ошибки БД фактически возвращаются как `500` с `{"message":"internal server error"}`.

## Разрешения

Источники: [DTO](../../internal/permission/dto.go), [handler](../../internal/permission/handler.go), [service](../../internal/permission/service.go), [repository](../../internal/permission/repository_sqlc.go), [миграция](../../db/migrations/003_permission.up.sql).

В ответах этого модуля `created_at` ошибочно заполняется значением `updated_at`. `description` всегда возвращается строкой: SQL `NULL` превращается в `""`. Nullable-столбец БД `updated_at` также преобразуется в строку даты без проверки `Valid`; при SQL `NULL` получится `0001-01-01T00:00:00Z`.

### POST /api/v1/permission/

Создаёт разрешение.

**URL:** `POST /api/v1/permission/`

**Request:** JSON.

```json
{
  "name": "checklist.read",
  "description": "Просмотр чек-листов"
}
```

`name` и `description` — строки без тегов валидации DTO. В БД `name` — `TEXT NOT NULL`, без `UNIQUE`; `description` допускает `NULL`, но через эту ручку отсутствие/пустое значение сохраняется как `""`. Непустое имя необходимо для успешного ответа, однако сервис проверяет его уже после INSERT.

**Response:** `201 Created`.

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "name": "checklist.read",
    "description": "Просмотр чек-листов",
    "updated_at": "2026-09-09T12:00:00Z",
    "created_at": "2026-09-09T12:00:00Z"
  }
}
```

Текущие особенности ошибок:

- Пустое имя приводит к `409` с `{"message":"name can't be empty"}`, хотя запись с пустым именем уже может быть создана. Повторяющиеся непустые имена допускаются.
- Ошибка INSERT также маскируется как `409` с тем же сообщением: сервис проверяет имя нулевого результата раньше ошибки repository.
- После ошибки декодирования handler записывает `400` с `{"message":"invalid json"}`, но не делает `return`. Обработка продолжается, может затронуть БД и дописать второй JSON-объект в ответ. Такое тело не является одним корректным JSON-документом.

### GET /api/v1/permission/

Возвращает все разрешения.

**URL:** `GET /api/v1/permission/`

**Request:** параметров и тела нет.

**Response:** `200 OK`.

```json
{
  "data": [
    {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "checklist.read",
      "description": "Просмотр чек-листов",
      "updated_at": "2026-09-09T12:00:00Z",
      "created_at": "2026-09-09T12:00:00Z"
    }
  ]
}
```

Пустой результат: `{"data":[]}`. Порядок не задан. Любая ошибка получения возвращается как `404` с текстом ошибки в `message`.

### GET /api/v1/permission/{id}

Возвращает разрешение по UUID.

**URL:** `GET /api/v1/permission/{id}`

**Request:** path `id` — UUID разрешения, например `44444444-4444-4444-8444-444444444444`. Тела нет.

**Response:** `200 OK`, объект разрешения в `data` с полями `id`, `name`, `description`, `updated_at`, `created_at`; [пример ответа](#post-apiv1permission).

Неверный UUID, отсутствие записи и другие ошибки сервиса возвращаются как `404` с текстом ошибки в `message`. При отсутствии записи: `{"message":"no rows in result set"}`.

### GET /api/v1/permission/name/{name}

Возвращает одно разрешение по точному имени.

**URL:** `GET /api/v1/permission/name/{name}`

**Request:** path `name` — имя, например `checklist.read`; спецсимволы необходимо кодировать для URL. Тела нет.

**Response:** `200 OK`, объект разрешения в `data` с полями `id`, `name`, `description`, `updated_at`, `created_at`; [пример ответа](#post-apiv1permission).

Имя не уникально в БД: при совпадениях возвращается одна запись, выбор не определён SQL-запросом. Отсутствие записи и остальные ошибки возвращаются как `404` с текстом ошибки в `message`; для отсутствующей записи — `{"message":"no rows in result set"}`.

### DELETE /api/v1/permission/{id}

Удаляет разрешение по UUID.

**URL:** `DELETE /api/v1/permission/{id}`

**Request:** path `id` — UUID разрешения. Тела нет.

**Response:** `200 OK`, тело пустое. JSON-объект не возвращается.

Ошибки: `400` с `{"message":"invalid id"}` при неверном UUID; `404` с `{"message":"permission not found"}` при отсутствии записи. Если разрешение связано с ролью, внешний ключ `permission_role.permission_id` с `ON DELETE RESTRICT` блокирует удаление: handler возвращает `400` с текстом ошибки БД в `message`. Остальные ошибки удаления также возвращаются как `400`.

## Связи ролей и разрешений

Источники: [DTO](../../internal/permission_role/dto.go), [handler](../../internal/permission_role/handler.go), [service](../../internal/permission_role/service.go), [repository](../../internal/permission_role/repository_sqlc.go), [SQL](../../db/query/permission_role.sql), [миграция](../../db/migrations/005_permission_role.up.sql).

`role_id` и `permission_id` в БД — обязательные UUID со ссылками на существующие записи и `ON DELETE RESTRICT`. Уникального ограничения на пару нет: повторные связи допускаются, списки могут содержать повторения. Временные поля возвращаются строками RFC 3339; nullable `updated_at` при SQL `NULL` преобразуется в `0001-01-01T00:00:00Z`.

### POST /api/v1/link/role/{role_id}/permission/{permission_id}

Назначает разрешение роли.

**URL:** `POST /api/v1/link/role/{role_id}/permission/{permission_id}`

**Request:** path `role_id` — UUID роли, `permission_id` — UUID разрешения. Тела нет; значения `CreateDTO` заполняются из URL.

**Response:** `201 Created`.

```json
{
  "data": {
    "role_id": "11111111-1111-4111-8111-111111111111",
    "permission_id": "44444444-4444-4444-8444-444444444444",
    "updated_at": "2026-09-09T12:00:00Z",
    "created_at": "2026-09-09T12:00:00Z"
  }
}
```

UUID самой записи связи существует в БД, но отсутствует в DTO ответа. Некорректные UUID, отсутствие роли/разрешения и другие ошибки repository фактически возвращают `500` с `{"message":"internal server error"}`. Повторное назначение той же пары создаёт ещё одну связь.

### DELETE /api/v1/link/role/{role_id}/permission/{permission_id}

Удаляет все связи указанной пары роли и разрешения.

**URL:** `DELETE /api/v1/link/role/{role_id}/permission/{permission_id}`

**Request:** path `role_id` — UUID роли, `permission_id` — UUID разрешения. Тела нет.

**Response:** `200 OK`, тело пустое. JSON-объект не возвращается. При отсутствии связи также `200`: количество удалённых строк не проверяется.

Неверный UUID и ошибки repository фактически возвращаются как `500` с `{"message":"internal server error"}`.

### GET /api/v1/link/role/{role_id}/permission

Возвращает разрешения роли.

**URL:** `GET /api/v1/link/role/{role_id}/permission`

**Request:** path `role_id` — UUID роли. Тела нет.

**Response:** `200 OK`.

```json
{
  "data": [
    {
      "id": "44444444-4444-4444-8444-444444444444",
      "name": "checklist.read",
      "description": "Просмотр чек-листов",
      "updated_at": "2026-09-09T12:00:00Z",
      "created_at": "2026-09-09T12:00:00Z"
    }
  ]
}
```

Даты относятся к разрешению, а не к связи. `description`, равный SQL `NULL`, возвращается как `""`. Пустой список, в том числе для несуществующей роли: `{"data":[]}`. Порядок не задан. Ошибки repository игнорируются сервисом и также могут выглядеть как `200` с пустым списком. Неверный UUID возвращает `500` с `{"message":"internal server error"}`.

### GET /api/v1/link/permission/{permission_id}/roles

Возвращает роли, которым назначено разрешение.

**URL:** `GET /api/v1/link/permission/{permission_id}/roles`

**Request:** path `permission_id` — UUID разрешения. Тела нет.

**Response:** `200 OK`.

```json
{
  "data": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "dispatcher",
      "updated_at": "2026-09-09T12:00:00Z",
      "created_at": "2026-09-09T12:00:00Z"
    }
  ]
}
```

Здесь роли содержат даты, в отличие от ответа `/role/`; даты относятся к роли. Пустой список, в том числе для несуществующего разрешения: `{"data":[]}`. Порядок не задан. Ошибки repository игнорируются сервисом и могут возвращаться как `200` с пустым списком. Неверный UUID возвращает `500` с `{"message":"internal server error"}`.
