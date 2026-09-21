# Результаты, правила и маршрутизация чеклистов

[К общей документации API](../API_DOCUMENTATION.md)

Маршруты взяты из [`cmd/api/main.go`](../../cmd/api/main.go). Поля запросов и ответов сверены с DTO, ограничения — с миграциями `015`–`018`; статусы, преобразование `NULL` и обработка ошибок — с текущими handler/service/repository. Здесь описаны результаты, правила, условия правил и маршрутизация. HTTP-ручки условий `checklist_rule_condition` и подсчёт правил уже подключены.

Все ID в URL — UUID. Тело запросов передаётся как JSON с `Content-Type: application/json`. Даты в ответах — строки RFC3339. Успешные ответы с телом используют обёртку `data`; ошибки — `message`. Для этих маршрутов в `main.go` не подключена проверка авторизации.

## Общие формы ответов

<a id="result-response"></a>

Объект результата (`ResponseDTO` из `internal/checklist_result/dto.go`):

```json
{
  "data": {
    "id": "10000000-0000-4000-8000-000000000001",
    "checklist_version_id": "20000000-0000-4000-8000-000000000001",
    "title": "Направление в стационар",
    "message": "Показана госпитализация",
    "created_at": "2026-09-09T12:00:00Z",
    "updated_at": "2026-09-09T12:00:00Z"
  }
}
```

В БД `title` — `TEXT NOT NULL`, `message` — nullable `TEXT`. В API оба поля — строки: `NULL` в `message` читается как `""`. Проверок непустого `title` и длины строк сейчас нет; ограничение `NOT NULL` не запрещает пустую строку.

<a id="rule-response"></a>

Объект правила (`ResponseDTO` из `internal/checklist_rule/dto.go`):

```json
{
  "data": {
    "id": "30000000-0000-4000-8000-000000000001",
    "checklist_version_id": "20000000-0000-4000-8000-000000000001",
    "result_id": "10000000-0000-4000-8000-000000000001",
    "name": "Правило госпитализации",
    "priority": 10,
    "created_at": "2026-09-09T12:00:00Z",
    "updated_at": "2026-09-09T12:00:00Z"
  }
}
```

В БД `checklist_version_id`, `result_id`, `name`, `priority` обязательны, `priority >= 0`. Сервис дополнительно проверяет непустое `name` и принадлежность результата той же версии. Пробельное имя не отклоняется. `priority` — целое число `int32`, допустимый диапазон API: `0`–`2147483647`, при отсутствии — `0`. Условия правила в этот объект не входят: их нужно получать отдельной ручкой.

## Семантика Rule Engine

После завершения `checklist_run` сервер берёт правила его зафиксированной версии в порядке `priority DESC`, проверяет условия одного правила через `AND` и сохраняет результат первого совпадения. Для «или» нужно создать несколько правил, которые ссылаются на один результат. Условие с `option_id` проверяет наличие/отсутствие выбранного варианта; числовые операторы сравнивают сохранённое числовое значение. Неотвеченный необязательный вопрос не удовлетворяет даже `not_equals`.

Перед публикацией версия обязана иметь ровно одно правило без условий — fallback. Его `priority` обязан быть строго меньше priority каждого правила с условиями. Такое правило срабатывает последним и гарантирует, что завершённый чеклист всегда имеет результат.

<a id="routing-response"></a>

Объект маршрутизации (`ResponseDTO` из `internal/checklist_result_routing/dto.go`), пример чтения существующей записи `fixed`:

```json
{
  "data": {
    "id": "40000000-0000-4000-8000-000000000001",
    "result_id": "10000000-0000-4000-8000-000000000001",
    "routing_type": "fixed",
    "facility_type_id": "00000000-0000-0000-0000-000000000000",
    "hospital_id": "50000000-0000-4000-8000-000000000001",
    "created_at": "2026-09-09T12:00:00Z",
    "updated_at": "2026-09-09T12:00:00Z"
  }
}
```

В БД неиспользуемый `facility_type_id` или `hospital_id` равен `NULL`, но текущий DTO возвращает его строкой с нулевым UUID. Для `by_tag` и `by_service_area` таким будет `hospital_id`. Это текущее преобразование ответа; передавать нулевой UUID вместо отсутствующего поля в запросах нельзя: проверка конфигурации требует пустое/отсутствующее неиспользуемое поле.

<a id="errors"></a>

Общая форма ошибки:

```json
{
  "message": "invalid request"
}
```

У результатов и правил непредусмотренные ошибки БД, включая отсутствие записи, возвращаются как `500 Internal Server Error`:

```json
{
  "message": "internal server error"
}
```

У маршрутизации `500` содержит исходный текст ошибки. Например, отсутствие записи:

```json
{
  "message": "no rows in result set"
}
```

Обработки отсутствия записи как `404` в этих трёх модулях сейчас нет. Удаление с успешным статусом `204` не содержит тела; JSON для него читать не нужно.

## Результаты чеклистов

### POST /api/v1/checklist-versions/{version_id}/results

Создать результат для существующей версии со статусом `draft`.

**URL:** `POST /api/v1/checklist-versions/{version_id}/results`

**Request:** `version_id` — UUID версии в URL. JSON:

```json
{
  "title": "Направление в стационар",
  "message": "Показана госпитализация"
}
```

`title` и `message` — строки. DTO не содержит тегов обязательности, сервис не проверяет непустые значения: пропущенные поля сохраняются как `""`. Поле `checklist_version_id` есть в `CreateDTO`, но игнорируется: версия берётся из URL.

**Response:** `201 Created`, JSON [объекта результата](#result-response).

Ошибки: `400` при некорректном UUID (`"invalid request"`) или JSON (`"invalid json"`); `409` с `{"message":"version not editable"}`, если статус версии не `draft`; `500` с `{"message":"internal server error"}` при отсутствии версии или другой ошибке БД.

### GET /api/v1/checklist-versions/{version_id}/results

Получить результаты версии, отсортированные по `created_at ASC`.

**URL:** `GET /api/v1/checklist-versions/{version_id}/results`

**Request:** `version_id` — UUID версии. Тела и query-параметров нет.

**Response:** `200 OK`, массив объектов результатов:

```json
{
  "data": [
    {
      "id": "10000000-0000-4000-8000-000000000001",
      "checklist_version_id": "20000000-0000-4000-8000-000000000001",
      "title": "Направление в стационар",
      "message": "Показана госпитализация",
      "created_at": "2026-09-09T12:00:00Z",
      "updated_at": "2026-09-09T12:00:00Z"
    }
  ]
}
```

При отсутствии результатов, в том числе для несуществующей версии, ответ `{"data":[]}`. Ошибки: `400` при некорректном UUID; `500` при ошибке БД. Формы ошибок — [выше](#errors).

### GET /api/v1/checklist-results/{id}

Получить один результат.

**URL:** `GET /api/v1/checklist-results/{id}`

**Request:** `id` — UUID результата. Тела и query-параметров нет.

**Response:** `200 OK`, JSON [объекта результата](#result-response).

Ошибки: `400` при некорректном UUID; `500` при отсутствии результата или ошибке БД. Формы ошибок — [выше](#errors).

### PATCH /api/v1/checklist-results/{id}

Изменить результат версии со статусом `draft`.

**URL:** `PATCH /api/v1/checklist-results/{id}`

**Request:** `id` — UUID результата. JSON:

```json
{
  "title": "Повторная оценка",
  "message": "Проведите повторный осмотр"
}
```

Текущая ручка перезаписывает оба строковых поля. Пропущенное поле или JSON `null` превращается в `""`, поэтому для сохранения старого значения нужно передать его явно. Пустой объект `{}` очищает оба поля. Изменять `checklist_version_id` нельзя.

**Response:** `200 OK`, объект с обновлёнными полями:

```json
{
  "data": {
    "id": "10000000-0000-4000-8000-000000000001",
    "checklist_version_id": "20000000-0000-4000-8000-000000000001",
    "title": "Повторная оценка",
    "message": "Проведите повторный осмотр",
    "created_at": "2026-09-09T12:00:00Z",
    "updated_at": "2026-09-09T12:30:00Z"
  }
}
```

Ошибки: `400` при некорректном UUID/JSON; `409` с `{"message":"version not editable"}` для версии не в `draft`; `500` при отсутствии результата или ошибке БД.

### DELETE /api/v1/checklist-results/{id}

Удалить результат версии со статусом `draft`. Внешние ключи БД каскадно удаляют связанные правила и маршрутизации; вместе с правилами удаляются их условия.

**URL:** `DELETE /api/v1/checklist-results/{id}`

**Request:** `id` — UUID результата. Тела и query-параметров нет.

**Response:** `204 No Content`, без тела.

Ошибки: `400` при некорректном UUID; `409` с `{"message":"version not editable"}` для версии не в `draft`; `500` при отсутствии результата или ошибке БД.

## Правила чеклистов

### POST /api/v1/checklist-versions/{version_id}/rules

Создать правило для версии со статусом `draft` и связать с результатом той же версии.

**URL:** `POST /api/v1/checklist-versions/{version_id}/rules`

**Request:** `version_id` — UUID версии в URL. JSON:

```json
{
  "result_id": "10000000-0000-4000-8000-000000000001",
  "name": "Правило госпитализации",
  "priority": 10
}
```

`result_id` — обязательный UUID существующего результата этой версии; `name` — обязательная непустая строка; `priority` — необязательное целое от `0` до `2147483647`, по умолчанию `0`. Поле `checklist_version_id` из `CreateDTO` игнорируется, версия берётся из URL.

**Response:** `201 Created`, JSON [объекта правила](#rule-response).

Ошибки: `400` с `{"message":"invalid request"}` при некорректном UUID/JSON, пустом имени, отрицательном приоритете или результате из другой версии; `409` с `{"message":"version not editable"}` для версии не в `draft`; `500` при отсутствии версии/результата или ошибке БД.

### GET /api/v1/checklist-versions/{version_id}/rules

Получить правила версии. Сортировка: `priority DESC`, затем `created_at ASC`.

**URL:** `GET /api/v1/checklist-versions/{version_id}/rules`

**Request:** `version_id` — UUID версии. Тела и query-параметров нет.

**Response:** `200 OK`, массив объектов правил:

```json
{
  "data": [
    {
      "id": "30000000-0000-4000-8000-000000000001",
      "checklist_version_id": "20000000-0000-4000-8000-000000000001",
      "result_id": "10000000-0000-4000-8000-000000000001",
      "name": "Правило госпитализации",
      "priority": 10,
      "created_at": "2026-09-09T12:00:00Z",
      "updated_at": "2026-09-09T12:00:00Z"
    }
  ]
}
```

Пустой список, в том числе для несуществующей версии: `{"data":[]}`. Ошибки: `400` при некорректном UUID; `500` при ошибке БД.

### GET /api/v1/checklist-versions/{version_id}/rules/count

Посчитать правила версии.

**URL:** `GET /api/v1/checklist-versions/{version_id}/rules/count`

**Request:** `version_id` — UUID версии. Тела и query-параметров нет.

**Response:** `200 OK`. `data` — целое число (`int64`), без вложенного поля `count`:

```json
{
  "data": 3
}
```

Для версии без правил или несуществующего UUID версии — `{"data":0}`. Ошибки: `400` при некорректном UUID; `500` при ошибке БД.

### GET /api/v1/checklist-rules/{id}

Получить одно правило.

**URL:** `GET /api/v1/checklist-rules/{id}`

**Request:** `id` — UUID правила. Тела и query-параметров нет.

**Response:** `200 OK`, JSON [объекта правила](#rule-response).

Ошибки: `400` при некорректном UUID; `500` при отсутствии правила или ошибке БД.

### PATCH /api/v1/checklist-rules/{id}

Изменить правило версии со статусом `draft`.

**URL:** `PATCH /api/v1/checklist-rules/{id}`

**Request:** `id` — UUID правила. JSON:

```json
{
  "result_id": "10000000-0000-4000-8000-000000000001",
  "name": "Правило повторной оценки",
  "priority": 20
}
```

Нужно передать непустое `name` и UUID `result_id` существующего результата той же версии. `priority` — целое от `0` до `2147483647`; пропуск сбрасывает его в `0`. Все три поля заменяются; `{}` не проходит валидацию. Версия правила не изменяется.

**Response:** `200 OK`:

```json
{
  "data": {
    "id": "30000000-0000-4000-8000-000000000001",
    "checklist_version_id": "20000000-0000-4000-8000-000000000001",
    "result_id": "10000000-0000-4000-8000-000000000001",
    "name": "Правило повторной оценки",
    "priority": 20,
    "created_at": "2026-09-09T12:00:00Z",
    "updated_at": "2026-09-09T12:30:00Z"
  }
}
```

Ошибки: `400` при некорректном UUID/JSON, пустом имени, отрицательном приоритете или результате из другой версии; `409` с `{"message":"version not editable"}` для версии не в `draft`; `500` при отсутствии правила/результата или ошибке БД.

### DELETE /api/v1/checklist-rules/{id}

Удалить правило версии со статусом `draft`. Связанные `checklist_rule_condition` удаляются каскадно по миграции `018`.

**URL:** `DELETE /api/v1/checklist-rules/{id}`

**Request:** `id` — UUID правила. Тела и query-параметров нет.

**Response:** `204 No Content`, без тела.

Ошибки: `400` при некорректном UUID; `500` с `{"message":"internal server error"}` при отсутствии правила, ошибке БД **и при статусе версии не `draft`**. Последнее — текущее несоответствие обработки ошибок: сервис запрещает удаление, но handler не переводит `ErrVersionNotEditable` в `409`.

## Условия правил

Условие — одна проверка, входящая в правило. Все изменения доступны только пока версия правила имеет статус `draft`; после публикации фронтенд должен показывать их только для чтения.

Объект условия:

```json
{
  "data": {
    "id": "9ef7349e-5e2f-42a5-bc85-3da8fba677fc",
    "rule_id": "30000000-0000-4000-8000-000000000001",
    "question_id": "811f81c5-8974-4ea2-871f-85730f75f173",
    "option_id": "166df52d-ea46-4fab-8cf7-b3ab3833aa87",
    "operator": "equals",
    "value": null,
    "position": 0,
    "created_at": "2026-09-18T11:00:00Z",
    "updated_at": "2026-09-18T11:00:00Z"
  }
}
```

Разрешённые `operator`: `equals`, `not_equals`, `greater_than`, `less_than`, `greater_or_equal`, `less_or_equal`.

| Тип вопроса | Допустимые поля условия |
| --- | --- |
| `single`, `multiple` | Только `option_id` существующего варианта этого вопроса; оператор только `equals` или `not_equals`; `value` не передавать. |
| `text` | `option_id` не передавать; непустой `value`; оператор `equals` или `not_equals`. |
| `boolean` | `option_id` не передавать; `value` строго строка `"true"` или `"false"`; оператор `equals` или `not_equals`. |
| `number` | `option_id` не передавать; `value` — непустая строка с конечным числом; любой разрешённый оператор. |

Вопрос обязан принадлежать той же версии, что и правило; вариант обязан принадлежать указанному вопросу. `position` — целое число `>= 0`.

### POST /api/v1/checklist-rules/{rule_id}/conditions

Создаёт условие для правила.

```json
{
  "question_id": "811f81c5-8974-4ea2-871f-85730f75f173",
  "option_id": "166df52d-ea46-4fab-8cf7-b3ab3833aa87",
  "operator": "equals",
  "position": 0
}
```

Пример числового условия:

```json
{
  "question_id": "811f81c5-8974-4ea2-871f-85730f75f173",
  "operator": "greater_or_equal",
  "value": "38.5",
  "position": 1
}
```

Ответ: `201 Created`, объект условия в `data`.

Ошибки: `400` — некорректный UUID, оператор, тип/значение условия или связь вопроса/варианта; `404` — правило, вопрос или вариант не найден; `409` — версия опубликована либо архивирована.

### GET /api/v1/checklist-rules/{rule_id}/conditions

Возвращает массив условий правила. Пустой результат: `{"data":[]}`.

Ответ: `200 OK`. Ошибки: `400` — некорректный UUID; `404` — правило не найдено.

### GET /api/v1/checklist-rule-conditions/{id}

Возвращает одно условие по UUID.

Ответ: `200 OK`, объект условия в `data`. Ошибки: `400` — некорректный UUID; `404` — условие не найдено.

### PATCH /api/v1/checklist-rule-conditions/{id}

Полностью заменяет изменяемую часть условия: передайте `question_id`, `operator`, `position` и ровно одно из `option_id` либо `value` в соответствии с таблицей выше.

```json
{
  "question_id": "811f81c5-8974-4ea2-871f-85730f75f173",
  "operator": "equals",
  "value": "true",
  "position": 0
}
```

Ответ: `200 OK`, обновлённое условие в `data`. Ошибки соответствуют POST.

### DELETE /api/v1/checklist-rule-conditions/{id}

Удаляет условие черновой версии.

Ответ: `204 No Content`. Ошибки: `400` — некорректный UUID; `404` — условие не найдено; `409` — версия не `draft`.

## Маршрутизация результатов

<a id="routing-request"></a>

Допустимые конфигурации по сервису и миграции `017`:

| `routing_type` | `hospital_id` в запросе | `facility_type_id` в запросе |
| --- | --- | --- |
| `fixed` | Обязательный UUID существующей больницы | Не передавать либо `""` |
| `by_tag` | Не передавать либо `""` | Обязательный UUID существующего типа учреждения; возвращает список кандидатов |
| `by_service_area` | Не передавать либо `""` | Не передавать либо `""`; больница определяется по свежей GPS-точке и полигону зоны |

Сервис проверяет тип, сочетание полей и формат заполненного UUID. Существование больницы/типа учреждения проверяет внешний ключ БД. DTO использует строки, поэтому JSON `null` для неиспользуемого поля также декодируется как пустая строка. Это не означает, что текущий репозиторий корректно сохраняет его как SQL `NULL`.

<a id="routing-write-bug"></a>

**Текущая ошибка POST/PATCH:** репозиторий передаёт оба поля `facility_type_id` и `hospital_id` в БД как ненулевые SQL-значения (`pgtype.UUID{Valid: true}`). Неиспользуемое поле превращается в `00000000-0000-0000-0000-000000000000`, хотя CHECK требует SQL `NULL`. Поэтому при схеме из миграции `017` запрос, прошедший валидацию сервиса и проверку `draft`, завершается `500`, а запись не создаётся/не обновляется. Пример ответа PostgreSQL:

```json
{
  "message": "ERROR: new row for relation \"checklist_result_routing\" violates check constraint \"checklist_result_routing_configuration_check\" (SQLSTATE 23514)"
}
```

Текст `message` передаётся напрямую из БД и может зависеть от её настроек. Заявленные в handler успешные статусы и DTO ниже приведены отдельно от этого фактического ограничения.

### POST /api/v1/checklist-result-routing/{result_id}

Создать маршрутизацию существующего результата версии `draft`.

**URL:** `POST /api/v1/checklist-result-routing/{result_id}`

**Request:** `result_id` — UUID результата в URL. JSON для фиксированной больницы:

```json
{
  "routing_type": "fixed",
  "hospital_id": "50000000-0000-4000-8000-000000000001"
}
```

Альтернатива для ближайшего учреждения нужного типа:

```json
{
  "routing_type": "by_tag",
  "facility_type_id": "60000000-0000-4000-8000-000000000001"
}
```

Требования к полям — в [таблице конфигураций](#routing-request). Поле `result_id` есть в `CreateDTO`, но значение из тела игнорируется: используется URL.

**Response:** сейчас для валидного запроса к результату в `draft` — `500` с JSON [ошибки ограничения БД](#routing-write-bug). В handler предусмотрен `201 Created` с JSON [объекта маршрутизации](#routing-response), но при текущем репозитории и миграции `017` успешная запись недостижима.

Ошибки валидации: `400` при некорректном UUID/JSON, неизвестном `routing_type` или неверной конфигурации. Для результата версии не в `draft` сервис сейчас тоже возвращает `400` с `{"message":"invalid request"}`. При отсутствии результата, нарушении внешнего ключа или другой ошибке БД — `500` с исходным текстом ошибки.

Сообщения ошибок конфигурации: `"hospital id required "`, `"facility type required "`, `"facility type not allowed "`, `"hospital id not allowed "`, `"invalid routing type "` — с пробелом в конце строки, как в `errs.go`.

### GET /api/v1/checklist-result-routing/{id}

Получить маршрутизацию по её ID.

**URL:** `GET /api/v1/checklist-result-routing/{id}`

**Request:** `id` — UUID маршрутизации. Тела и query-параметров нет.

**Response:** `200 OK`, JSON [объекта маршрутизации](#routing-response). Неиспользуемый внешний ключ возвращается нулевым UUID, а не JSON `null`.

Ошибки: при отсутствии записи — `500` с `{"message":"no rows in result set"}`; при некорректном UUID тоже `500`, поскольку сервис возвращает ошибку `uuid.Parse` без преобразования в `ErrInvalidRequest`. Например, для `/api/v1/checklist-result-routing/bad`:

```json
{
  "message": "invalid UUID length: 3"
}
```

Прочие ошибки БД — `500` с исходным текстом ошибки.

### GET /api/v1/checklist-result-routing/checklist-results/{result_id}

Получить одну маршрутизацию по ID результата.

**URL:** `GET /api/v1/checklist-result-routing/checklist-results/{result_id}`

**Request:** `result_id` — UUID результата. Тела и query-параметров нет.

**Response:** `200 OK`, JSON одного [объекта маршрутизации](#routing-response), не массива.

В БД нет уникальности `result_id`, а SQL выполняет выборку `:one` без сортировки. Если для результата уже есть несколько маршрутизаций, ручка вернёт одну из них; порядок не определён.

Ошибки: `500` с `{"message":"no rows in result set"}` при отсутствии маршрутизации; `500` с исходным текстом `uuid.Parse` при некорректном UUID, например `{"message":"invalid UUID length: 3"}` для значения `bad`; `500` с текстом ошибки БД в остальных случаях.

### PATCH /api/v1/checklist-result-routing/{id}

Заменить конфигурацию маршрутизации результата версии `draft`.

**URL:** `PATCH /api/v1/checklist-result-routing/{id}`

**Request:** `id` — UUID маршрутизации. JSON:

```json
{
  "routing_type": "by_tag",
  "facility_type_id": "60000000-0000-4000-8000-000000000001"
}
```

Нужно передать полную допустимую [конфигурацию](#routing-request): `routing_type` и соответствующий UUID. Поля не объединяются с прежними значениями; `{}` невалиден. `result_id` не изменяется.

**Response:** сейчас для валидного запроса к существующей записи в `draft` — `500` с JSON [ошибки ограничения БД](#routing-write-bug). В handler предусмотрен `200 OK` с JSON [объекта маршрутизации](#routing-response), отражающим новые значения и `updated_at`, но текущая передача отсутствующего FK препятствует обновлению при схеме из миграции `017`.

Ошибки: `400` при некорректном UUID/JSON или конфигурации; `409` с `{"message":"version not editable"}` для версии не в `draft`; `500` при отсутствии маршрутизации, нарушении ограничений или другой ошибке БД, с исходным текстом ошибки.

### DELETE /api/v1/checklist-result-routing/{id}

Удалить маршрутизацию. Текущий сервис не проверяет статус версии: удаление доступно и для версии не в `draft`.

**URL:** `DELETE /api/v1/checklist-result-routing/{id}`

**Request:** `id` — UUID маршрутизации. Тела и query-параметров нет.

**Response:** `204 No Content`, без тела.

Ошибки: `400` с `{"message":"invalid request"}` при некорректном UUID; `500` с `{"message":"no rows in result set"}` при отсутствии маршрутизации; прочие ошибки БД — `500` с исходным текстом ошибки.

## Источники

- Маршруты: [`cmd/api/main.go`](../../cmd/api/main.go).
- Результаты: [`dto.go`](../../internal/checklist_result/dto.go), [`handler.go`](../../internal/checklist_result/handler.go), [`service.go`](../../internal/checklist_result/service.go), [`sqlc_repository.go`](../../internal/checklist_result/sqlc_repository.go), [`015_checklist_result.up.sql`](../../db/migrations/015_checklist_result.up.sql).
- Правила: [`dto.go`](../../internal/checklist_rule/dto.go), [`handler.go`](../../internal/checklist_rule/handler.go), [`service.go`](../../internal/checklist_rule/service.go), [`sqlc_repository.go`](../../internal/checklist_rule/sqlc_repository.go), [`016_checklist_rule.up.sql`](../../db/migrations/016_checklist_rule.up.sql), [`018_checklist_rule_condition.up.sql`](../../db/migrations/018_checklist_rule_condition.up.sql).
- Маршрутизация: [`dto.go`](../../internal/checklist_result_routing/dto.go), [`handler.go`](../../internal/checklist_result_routing/handler.go), [`service.go`](../../internal/checklist_result_routing/service.go), [`sqlc_repository.go`](../../internal/checklist_result_routing/sqlc_repository.go), [`017_checklist_result_routing.up.sql`](../../db/migrations/017_checklist_result_routing.up.sql).
- Запросы к БД: [`checlist_result.sql`](../../db/query/checlist_result.sql), [`checklist_rule.sql`](../../db/query/checklist_rule.sql), [`checklist_result_routing.sql`](../../db/query/checklist_result_routing.sql).
