# Чеклисты, версии, вопросы и варианты ответа

[К оглавлению API](../API_DOCUMENTATION.md)

URL приведены с префиксом `/api/v1`. Для JSON-запросов используйте `Content-Type: application/json`. UUID и даты в примерах условные; связанные записи должны существовать в БД.

## Чеклисты

Источники: [DTO](../../internal/checklist/dto.go), [обработчики](../../internal/checklist/handler.go), [сервис](../../internal/checklist/service.go), [миграция 010](../../db/migrations/010_checklist.up.sql).

| Поле запроса | Тип | Поведение |
| --- | --- | --- |
| `name` | string | Имя уникально в БД. Проверки непустой строки в DTO/сервисе нет. |
| `description` | string | Можно пропустить; записывается пустая строка. |
| `sickness_id` | string (UUID) | Нужен UUID существующего заболевания. |

`id`, `created_at`, `updated_at` формируются на сервере; даты возвращаются строками RFC3339. Удаление чеклиста каскадно удаляет его версии и зависимые записи согласно внешним ключам.

### POST /api/v1/checklist/

Создать чеклист.

**URL:** `POST /api/v1/checklist/`

**Request:** Тело JSON:

```json
{
  "name": "Первичный осмотр",
  "description": "Вопросы первичного осмотра",
  "sickness_id": "22222222-2222-4222-8222-222222222222"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Первичный осмотр",
    "description": "Вопросы первичного осмотра",
    "sickness_id": "22222222-2222-4222-8222-222222222222",
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

Ошибки UUID, внешнего ключа и уникальности сейчас попадают в `500`. Особенности ошибочного ответа POST/PATCH описаны ниже.

### GET /api/v1/checklist/{id}

Получить чеклист.

**URL:** `GET /api/v1/checklist/{id}`

**Request:** Path: `id` — UUID чеклиста. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Первичный осмотр",
    "description": "Вопросы первичного осмотра",
    "sickness_id": "22222222-2222-4222-8222-222222222222",
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

Ошибка UUID, отсутствие записи или ошибка БД — `404` с `{"message":"..."}`.

### GET /api/v1/checklist/

Получить все чеклисты.

**URL:** `GET /api/v1/checklist/`

**Request:** Тело отсутствует; query-параметры не обрабатываются.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Первичный осмотр",
      "description": "Вопросы первичного осмотра",
      "sickness_id": "22222222-2222-4222-8222-222222222222",
      "created_at": "2026-09-09T10:00:00Z",
      "updated_at": "2026-09-09T10:00:00Z"
    }
  ]
}
```

Пустой список: `{"data":[]}`. Ошибка чтения — `404`.

### GET /api/v1/checklist/sickness/{sickness_id}

Получить чеклисты заболевания.

**URL:** `GET /api/v1/checklist/sickness/{sickness_id}`

**Request:** Path: `sickness_id` — UUID заболевания. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Первичный осмотр",
      "description": "Вопросы первичного осмотра",
      "sickness_id": "22222222-2222-4222-8222-222222222222",
      "created_at": "2026-09-09T10:00:00Z",
      "updated_at": "2026-09-09T10:00:00Z"
    }
  ]
}
```

При отсутствии чеклистов — `{"data":[]}`. Ошибка UUID или чтения — `404`.

### PATCH /api/v1/checklist/{id}

Обновить чеклист.

**URL:** `PATCH /api/v1/checklist/{id}`

**Request:** Path: `id` — UUID чеклиста. Передавайте полный набор полей: пропущенные `name`/`description` заменяются пустыми строками, `sickness_id` снова разбирается как UUID.

```json
{
  "name": "Первичный осмотр",
  "description": "Обновлённое описание",
  "sickness_id": "22222222-2222-4222-8222-222222222222"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Первичный осмотр",
    "description": "Обновлённое описание",
    "sickness_id": "22222222-2222-4222-8222-222222222222",
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T11:00:00Z"
  }
}
```

Успешный PATCH действительно возвращает `201`. Ошибки UUID, отсутствующей записи, внешнего ключа и уникальности сейчас попадают в `500`.

### DELETE /api/v1/checklist/{id}

Удалить чеклист.

**URL:** `DELETE /api/v1/checklist/{id}`

**Request:** Path: `id` — UUID чеклиста. Тело отсутствует.

**Response:** `200 OK` — без тела.

Некорректный UUID и отсутствие записи сейчас возвращают `400` с `{"message":"..."}`.

### Особенность ошибок создания и обновления чеклиста

В POST/PATCH обработчик не завершает выполнение после ошибки декодирования JSON или ошибки сервиса. HTTP-статус остаётся статусом первой ошибки (`400` при некорректном JSON, обычно `500` при ошибке БД), а в тело могут последовательно записаться несколько JSON-объектов: ошибка и затем `data`. Такое тело нельзя считать одним корректным JSON-документом. Примеры выше описывают успешные операции.

## Версии чеклистов

Источники: [DTO](../../internal/checklist_version/dto.go), [обработчики](../../internal/checklist_version/handler.go), [сервис](../../internal/checklist_version/service.go), [миграция 011](../../db/migrations/011_checklist_version.up.sql).

БД допускает `status`: `draft`, `published`, `archived`; пара `checklist_id + version` уникальна, опубликованная версия у чеклиста может быть только одна. Создание всегда устанавливает `draft`, а номер вычисляется как `MAX(version) + 1` (первая версия — `1`). `published_at` до публикации возвращается пустой строкой `""`.

### POST /api/v1/checklist/{checklist_id}/versions/

Создать следующую черновую версию.

**URL:** `POST /api/v1/checklist/{checklist_id}/versions/`

**Request:** Path: `checklist_id` — UUID чеклиста. В корректном клиенте достаточно пустого JSON-объекта `{}`: обработчик подставляет ID из URL. Если передать `checklist_id` в теле, он должен совпадать с URL.

**Response:** `201 Created`

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "checklist_id": "11111111-1111-4111-8111-111111111111",
    "version": 1,
    "status": "draft",
    "created_at": "2026-09-09T10:00:00Z",
    "published_at": ""
  }
}
```

DTO также содержит `version` (int32) и `status` (string), но сервис игнорирует переданные значения. Номер назначает сервер, статус новой версии всегда `draft`. Некорректный JSON или несовпадение ID — `400`.

### GET /api/v1/checklist/{checklist_id}/versions/

Получить все версии чеклиста.

**URL:** `GET /api/v1/checklist/{checklist_id}/versions/`

**Request:** Path: `checklist_id` — UUID чеклиста. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "checklist_id": "11111111-1111-4111-8111-111111111111",
      "version": 1,
      "status": "draft",
      "created_at": "2026-09-09T10:00:00Z",
      "published_at": ""
    }
  ]
}
```

Версии сортируются по номеру по убыванию. Пустой список: `{"data":[]}`. Невалидный UUID или ошибка БД — `500`.

### GET /api/v1/checklist/{checklist_id}/versions/published

Получить опубликованную версию.

**URL:** `GET /api/v1/checklist/{checklist_id}/versions/published`

**Request:** Path: `checklist_id` — UUID чеклиста. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "checklist_id": "11111111-1111-4111-8111-111111111111",
    "version": 1,
    "status": "published",
    "created_at": "2026-09-09T10:00:00Z",
    "published_at": "2026-09-09T11:00:00Z"
  }
}
```

Невалидный UUID, отсутствие опубликованной версии или ошибка БД сейчас дают `500`. В обработчике предусмотрен `404`, но SQL-репозиторий не преобразует отсутствие строки в соответствующую доменную ошибку.

### GET /api/v1/checklist/{checklist_id}/versions/latest

Получить версию с максимальным номером, независимо от статуса.

**URL:** `GET /api/v1/checklist/{checklist_id}/versions/latest`

**Request:** Path: `checklist_id` — UUID чеклиста. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "checklist_id": "11111111-1111-4111-8111-111111111111",
    "version": 1,
    "status": "draft",
    "created_at": "2026-09-09T10:00:00Z",
    "published_at": ""
  }
}
```

Невалидный UUID, отсутствие версий или ошибка БД сейчас дают `500`.

### POST /api/v1/checklist-versions/{id}/publish

Публикует черновую версию. В одной транзакции сервер архивирует все ранее опубликованные версии того же чеклиста, затем переводит указанную версию в `published` и устанавливает `published_at`.

**Request:** path `id` — UUID версии. Тело отсутствует.

**Response:** `200 OK`, объект опубликованной версии в `data`.

Ошибки: `400` — некорректный UUID; `404` — версия не найдена; `409` — версия не в статусе `draft`.

### POST /api/v1/checklist-versions/{id}/archive

Архивирует опубликованную версию.

**Request:** path `id` — UUID версии. Тело отсутствует.

**Response:** `200 OK`, объект версии со статусом `archived` в `data`.

Ошибки: `400` — некорректный UUID; `404` — версия не найдена; `409` — версия не в статусе `published`.

## Вопросы чеклистов

Источники: [DTO](../../internal/checklist_question/dto.go), [обработчики](../../internal/checklist_question/handler.go), [сервис](../../internal/checklist_question/service.go), [миграция 012](../../db/migrations/012_checklist_question.up.sql).

| Поле запроса | Тип | Поведение |
| --- | --- | --- |
| `checklist_version_id` | string (UUID v4) | Обязательно при создании, проверяется DTO. В PATCH отсутствует. |
| `question` | string | Обязательная непустая строка. |
| `type` | string | Обязательная непустая строка; БД допускает `single`, `multiple`, `text`, `number`, `boolean`. |
| `position` | int32 | По умолчанию `0`; БД требует `>= 0` и уникальность позиции в версии. |
| `required` | boolean | Если пропустить, сервис запишет `false`, несмотря на DEFAULT true в БД. |

Создание, изменение и удаление разрешены только для версии `draft`. Нарушение даёт `409` с `{"message":"Version Not Editable"}`. Нарушение CHECK/UNIQUE БД или отсутствие записи даёт `500`, ошибка разбора UUID — `400`. Пустые обязательные поля и некорректный JSON при POST/PATCH дают `400`.

### POST /api/v1/checklist-questions/{version_id}/checklist-versions

Создать вопрос в черновой версии.

**URL:** `POST /api/v1/checklist-questions/{version_id}/checklist-versions`

**Request:** Path: `version_id` присутствует в URL, но обработчик его не читает. UUID v4 версии обязательно передаётся в теле как `checklist_version_id`; используйте одинаковые значения.

```json
{
  "checklist_version_id": "33333333-3333-4333-8333-333333333333",
  "question": "Есть ли жалобы?",
  "type": "single",
  "position": 0,
  "required": true
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "checklist_version_id": "33333333-3333-4333-8333-333333333333",
    "question": "Есть ли жалобы?",
    "type": "single",
    "position": 0,
    "required": true,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

### GET /api/v1/checklist-questions/{id}

Получить вопрос по ID.

**URL:** `GET /api/v1/checklist-questions/{id}`

**Request:** Path: `id` — UUID вопроса. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "checklist_version_id": "33333333-3333-4333-8333-333333333333",
    "question": "Есть ли жалобы?",
    "type": "single",
    "position": 0,
    "required": true,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

### GET /api/v1/checklist-questions/checklist-versions/{id}

Дополнительный маршрут получения одного вопроса.

**URL:** `GET /api/v1/checklist-questions/checklist-versions/{id}`

**Request:** Path: `id` — UUID вопроса. Несмотря на `checklist-versions` в URL, это тот же `GetChecklistQuestionByID`. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "checklist_version_id": "33333333-3333-4333-8333-333333333333",
    "question": "Есть ли жалобы?",
    "type": "single",
    "position": 0,
    "required": true,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

Маршрут не возвращает список вопросов версии. Обработчик `ListChecklistQuestions` существует, но не подключён в `main.go`.

### PATCH /api/v1/checklist-questions/{id}

Обновить вопрос черновой версии.

**URL:** `PATCH /api/v1/checklist-questions/{id}`

**Request:** Path: `id` — UUID вопроса. Тело JSON; `question` и `type` обязательны. Пропущенные `position` и `required` станут `0` и `false`.

```json
{
  "question": "Есть ли жалобы сейчас?",
  "type": "single",
  "position": 0,
  "required": true
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "checklist_version_id": "33333333-3333-4333-8333-333333333333",
    "question": "Есть ли жалобы сейчас?",
    "type": "single",
    "position": 0,
    "required": true,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T11:00:00Z"
  }
}
```

### DELETE /api/v1/checklist-questions/{id}

Удалить вопрос черновой версии.

**URL:** `DELETE /api/v1/checklist-questions/{id}`

**Request:** Path: `id` — UUID вопроса. Тело отсутствует.

**Response:** `204 No Content` — без тела.

Связанные варианты ответа удаляются каскадно.

## Варианты ответа

Источники: [DTO](../../internal/checklist_option/dto.go), [обработчики](../../internal/checklist_option/handler.go), [сервис](../../internal/checklist_option/service.go), [миграция 013](../../db/migrations/013_checklist_option.up.sql).

| Поле запроса | Тип | Поведение |
| --- | --- | --- |
| `label` | string | Обязательная непустая строка. |
| `value` | string | Обязательная непустая строка, в том числе для числового по смыслу значения. |
| `position` | int32 | По умолчанию `0`; БД требует `>= 0` и уникальность позиции в вопросе. |

Создание разрешено только для вопросов `single` и `multiple`, иначе `409` с `{"message":"Options not allowed"}`. Создание, изменение и удаление требуют версии `draft`, иначе `409` с `{"message":"version is not editable"}`. Невалидный UUID, некорректный JSON и пустые обязательные поля дают `400`; отсутствие записи и нарушения ограничений БД — `500`.

### POST /api/v1/checklist-questions/{question_id}/options

Создать вариант ответа.

**URL:** `POST /api/v1/checklist-questions/{question_id}/options`

**Request:** Path: `question_id` — UUID вопроса; в JSON ID вопроса передавать не нужно.

```json
{
  "label": "Да",
  "value": "yes",
  "position": 0
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "checklist_question_id": "44444444-4444-4444-8444-444444444444",
    "label": "Да",
    "value": "yes",
    "position": 0,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

### GET /api/v1/checklist-questions/{question_id}/options

Получить варианты ответа вопроса.

**URL:** `GET /api/v1/checklist-questions/{question_id}/options`

**Request:** Path: `question_id` — UUID вопроса. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "55555555-5555-4555-8555-555555555555",
      "checklist_question_id": "44444444-4444-4444-8444-444444444444",
      "label": "Да",
      "value": "yes",
      "position": 0,
      "created_at": "2026-09-09T10:00:00Z",
      "updated_at": "2026-09-09T10:00:00Z"
    }
  ]
}
```

Варианты сортируются по `position ASC`. При отсутствии вариантов, в том числе для несуществующего UUID вопроса, — `{"data":[]}`.

### GET /api/v1/checklist-options/{id}

Получить вариант ответа.

**URL:** `GET /api/v1/checklist-options/{id}`

**Request:** Path: `id` — UUID варианта. Тело отсутствует.

**Response:** `200 OK`

```json
{
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "checklist_question_id": "44444444-4444-4444-8444-444444444444",
    "label": "Да",
    "value": "yes",
    "position": 0,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T10:00:00Z"
  }
}
```

### PATCH /api/v1/checklist-options/{id}

Обновить вариант ответа.

**URL:** `PATCH /api/v1/checklist-options/{id}`

**Request:** Path: `id` — UUID варианта. `label` и `value` обязательны; пропущенная `position` станет `0`.

```json
{
  "label": "Нет",
  "value": "no",
  "position": 0
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "55555555-5555-4555-8555-555555555555",
    "checklist_question_id": "44444444-4444-4444-8444-444444444444",
    "label": "Нет",
    "value": "no",
    "position": 0,
    "created_at": "2026-09-09T10:00:00Z",
    "updated_at": "2026-09-09T11:00:00Z"
  }
}
```

### DELETE /api/v1/checklist-options/{id}

Удалить вариант ответа.

**URL:** `DELETE /api/v1/checklist-options/{id}`

**Request:** Path: `id` — UUID варианта. Тело отсутствует.

**Response:** `204 No Content` — без тела.
