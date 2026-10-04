# Технический отчёт: архитектура и план реализации Checklist в `vera-backend`

## 1. Общая цель системы

В проекте реализуется универсальная система медицинских чеклистов.

Основной сценарий:

```text
Администратор
    ↓
создаёт Checklist
    ↓
создаёт Version
    ↓
добавляет Questions
    ↓
для закрытых вопросов добавляет Options
    ↓
создаёт Results
    ↓
создаёт Rules
    ↓
для Rules задаёт Conditions
    ↓
для Result задаёт Routing
    ↓
публикует Version
```

После этого пользователь мобильного приложения:

```text
Пользователь
    ↓
открывает опубликованный Checklist
    ↓
начинает Attempt
    ↓
отвечает на Questions
    ↓
завершает Attempt
    ↓
Rule Engine анализирует ответы
    ↓
выбирается Result
    ↓
Routing Engine определяет медицинское учреждение
    ↓
возвращается итоговый результат
```

Архитектурно система разделена на несколько независимых частей:

```text
Checklist
    │
    ├── Version
    │      │
    │      ├── Questions
    │      │      └── Options
    │      │
    │      ├── Results
    │      │      └── Routing
    │      │
    │      └── Rules
    │             └── Conditions
    │
    └── Sickness
```

После публикации появляется пользовательская часть:

```text
User
 │
 └── ChecklistAttempt
        │
        └── ChecklistAnswer
                 ↓
             Rule Engine
                 ↓
               Result
                 ↓
           Routing Engine
                 ↓
              Facility
```

---

# 2. Принцип архитектуры backend

В проекте используется слоистая архитектура:

```text
HTTP Handler
     ↓
DTO
     ↓
Service
     ↓
Repository interface
     ↓
repository_sqlc
     ↓
SQLC
     ↓
PostgreSQL
```

При этом:

- Handler работает с HTTP;
- DTO представляет API-модель;
- Service содержит бизнес-логику;
- Repository содержит доступ к данным;
- SQLC генерирует типизированный DB-код;
- PostgreSQL обеспечивает часть инвариантов через FK, CHECK, UNIQUE и индексы.

ORM не используется.

Repository внутри работает с `pgtype`, а service/handler — с обычными Go DTO и `uuid.UUID`.

---

# 3. Почему Checklist отделён от Checklist Version

Главная идея системы — **не изменять опубликованный чеклист напрямую**.

Имеется:

```text
Checklist
    ↓
Version 1
Version 2
Version 3
...
```

Например:

```text
"Инсульт"

Version 1
    опубликована
    используется пользователями

Version 2
    draft
    редактируется администратором
```

Пока Version находится в `draft`, её можно изменять.

После публикации она становится исторической конфигурацией, по которой пользователи могли проходить диагностику.

Это позволяет избежать ситуации:

```text
Пользователь начал проходить Version 1
        ↓
администратор изменил вопрос
        ↓
пользователь фактически завершил уже другой чеклист
```

Поэтому версия является главным контейнером всей конфигурации.

---

# 4. Checklist

## 4.1. Таблица

Текущая модель:

```sql
CREATE TABLE IF NOT EXISTS checklist (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sickness_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT checklist_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_sickness_fkey
        FOREIGN KEY (sickness_id)
        REFERENCES sickness(id)
        ON DELETE RESTRICT,

    CONSTRAINT checklist_name_unique
        UNIQUE (name)
);
```

Checklist связан с `sickness`.

Например:

```text
sickness:
    Инсульт
       ↓
checklist:
    "Шкала оценки риска инсульта"
```

Сам Checklist ещё не содержит вопросов.

Он является контейнером и точкой входа в систему.

---

# 5. Checklist Version

Version содержит конкретный снимок конфигурации чеклиста.

Таблица:

```sql
CREATE TABLE IF NOT EXISTS checklist_version (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL,
    version INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,

    CONSTRAINT checklist_version_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_version_checklist_fkey
        FOREIGN KEY (checklist_id)
        REFERENCES checklist(id)
        ON DELETE CASCADE,

    CONSTRAINT checklist_version_unique
        UNIQUE (checklist_id, version),

    CONSTRAINT checklist_version_status_check
        CHECK (status IN ('draft', 'published', 'archived'))
);
```

Есть также ограничение:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS
idx_one_published_checklist_version
ON checklist_version(checklist_id)
WHERE status = 'published';
```

Это означает:

```text
у одного Checklist
может быть только одна published Version
```

Например:

```text
Checklist #1

Version 1 → archived
Version 2 → published
Version 3 → draft
```

Но:

```text
Version 2 → published
Version 3 → published
```

для одного Checklist недопустимо.

---

# 6. Жизненный цикл Version

Используются три состояния:

```text
draft
published
archived
```

Логика:

```text
draft
  ↓
published
  ↓
archived
```

Редактировать можно только:

```text
draft
```

Нельзя редактировать:

```text
published
archived
```

Это правило уже используется в сервисах вопросов, options, results, routing и rules.

Таким образом, каждый дочерний объект фактически проверяет:

```text
к какой Version относится объект?
        ↓
каков статус Version?
        ↓
draft?
  ↓       ↓
 yes      no
 ↓        ↓
edit      error
```

---

# 7. Получение номера следующей версии

Используется запрос:

```sql
-- name: GetNextChecklistVersion :one
SELECT COALESCE(MAX(version), 0) + 1 AS next_version
FROM checklist_version
WHERE checklist_id = $1;
```

Например:

```text
нет версий
→ 1

есть Version 1
→ 2

есть Version 1,2,3
→ 4
```

---

# 8. Checklist Question

Каждая Version содержит набор вопросов.

Таблица:

```sql
CREATE TABLE IF NOT EXISTS checklist_question (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    checklist_version_id UUID NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL,
    position INT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT checklist_question_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_question_version_fkey
        FOREIGN KEY (checklist_version_id)
        REFERENCES checklist_version(id)
        ON DELETE CASCADE,

    CONSTRAINT checklist_question_type_check
        CHECK (type IN ('single','multiple','text','number','boolean')),

    CONSTRAINT checklist_question_position_check
        CHECK (position >= 0),

    CONSTRAINT checklist_question_version_position_unique
        UNIQUE (checklist_version_id, position)
);
```

Поддерживаются типы:

```text
single
multiple
text
number
boolean
```

### `single`

Выбор одного варианта:

```text
Курение?
    ○ Да
    ○ Нет
```

### `multiple`

Можно выбрать несколько:

```text
Какие симптомы?
    □ Головная боль
    □ Онемение
    □ Нарушение речи
```

### `text`

Произвольный текст.

### `number`

Числовой ответ.

Например:

```text
Давление: 180
```

### `boolean`

Да/нет.

---

# 9. Position Questions

У каждой Question есть:

```text
position
```

и действует:

```sql
UNIQUE(checklist_version_id, position)
```

Поэтому в одной Version нельзя иметь:

```text
Question A → position 1
Question B → position 1
```

Правильно:

```text
Question A → position 0
Question B → position 1
Question C → position 2
```

При получении:

```sql
ORDER BY position ASC
```

вопросы приходят в правильном порядке.

---

# 10. Checklist Option

Option нужен для вопросов:

```text
single
multiple
```

Таблица:

```sql
CREATE TABLE IF NOT EXISTS checklist_option (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    checklist_question_id UUID NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT checklist_option_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_option_question_fkey
        FOREIGN KEY (checklist_question_id)
        REFERENCES checklist_question(id)
        ON DELETE CASCADE,

    CONSTRAINT checklist_option_position_check
        CHECK (position >= 0),

    CONSTRAINT checklist_option_question_position_unique
        UNIQUE (checklist_question_id, position)
);
```

Например:

```text
Question:
"Есть ли нарушение речи?"

Options:

id=A
label="Да"
value="yes"
position=0

id=B
label="Нет"
value="no"
position=1
```

---

# 11. Почему Rule должен ссылаться на Option ID

Rules не должны сравнивать строку:

```text
value = "yes"
```

Вместо этого Rule Condition должен ссылаться на:

```text
option_id
```

То есть:

```text
Question
   ↓
Option
   ↓
Condition
```

Это важно, потому что `value` является техническим значением, а Option является конкретной сущностью конфигурации.

Например:

```text
Option ID:
550e8400...

label:
"Да"

value:
"yes"
```

Rule ссылается на:

```text
550e8400...
```

а не на `"yes"`.

---

# 12. Checklist Result

Result — это результат прохождения.

Таблица:

```sql
CREATE TABLE IF NOT EXISTS checklist_result (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    checklist_version_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT checklist_result_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_result_version_fkey
        FOREIGN KEY (checklist_version_id)
        REFERENCES checklist_version(id)
        ON DELETE CASCADE
);
```

Например:

```text
Result #1
title:
"Низкий риск"

message:
"Признаки острого состояния не выявлены"
```

или:

```text
Result #2
title:
"Высокий риск"

message:
"Необходимо срочно обратиться за медицинской помощью"
```

Result не отвечает за выбор больницы.

Это принципиально важно.

---

# 13. Разделение Result и Routing

Архитектура:

```text
Rule
  ↓
Result
  ↓
Routing
  ↓
Facility
```

Result отвечает:

```text
что сказать пользователю
```

Routing отвечает:

```text
куда пользователя направить
```

Поэтому не надо добавлять в `checklist_result`:

```text
hospital_id
facility_type_id
latitude
longitude
```

маршрутизация вынесена отдельно.

Это позволяет один и тот же Result использовать с разными сценариями направления.

---

# 14. Checklist Result Routing

Таблица:

```sql
CREATE TABLE IF NOT EXISTS checklist_result_routing (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL,
    routing_type TEXT NOT NULL,
    facility_type_id UUID,
    hospital_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT checklist_result_routing_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_result_routing_result_fkey
        FOREIGN KEY (result_id)
        REFERENCES checklist_result(id)
        ON DELETE CASCADE,

    CONSTRAINT checklist_result_routing_facility_type_fkey
        FOREIGN KEY (facility_type_id)
        REFERENCES facility_types(id)
        ON DELETE RESTRICT,

    CONSTRAINT checklist_result_routing_hospital_fkey
        FOREIGN KEY (hospital_id)
        REFERENCES hospitals(id)
        ON DELETE SET NULL,

    CONSTRAINT checklist_result_routing_type_check
        CHECK (routing_type IN ('fixed', 'nearest'))
);
```

Главное правило конфигурации:

```text
fixed
    hospital_id = required
    facility_type_id = NULL

nearest
    facility_type_id = required
    hospital_id = NULL
```

Это обеспечивается CHECK constraint.

---

# 15. Тип Routing: fixed

Пример:

```text
Result:
"Высокий риск инсульта"

Routing:
fixed

hospital_id:
Hospital A
```

Результат:

```text
пользователь
    ↓
Result
    ↓
fixed routing
    ↓
Hospital A
```

Координаты пользователя при таком сценарии вообще не нужны.

---

# 16. Тип Routing: nearest

Пример:

```text
Result:
"Высокий риск"

Routing:
nearest

facility_type:
vascular_center
```

Тогда Routing Engine должен:

```text
1. получить координаты пользователя
2. взять facilities нужного типа
3. отфильтровать подходящие учреждения
4. учесть связь sickness ↔ hospital
5. посчитать расстояние
6. выбрать ближайшее
```

То есть:

```text
patient coordinates
       ↓
facility_type
       ↓
candidate facilities
       ↓
sickness relation
       ↓
distance
       ↓
nearest facility
```

Географическая логика не должна находиться внутри Rule Engine.

---

# 17. Facility Types

Первоначально предполагалось ограничивать тип учреждения CHECK constraint'ом вроде:

```text
hospital
vascular_center
```

Но в текущей архитектуре это было правильно вынесено в отдельную таблицу:

```sql
facility_types
```

Сущность содержит:

```text
id
name
code
description
created_at
updated_at
```

Таким образом, администратор может создавать новые типы.

Например:

```text
hospital
vascular_center
trauma_center
rehabilitation_center
clinic
```

Вместо изменения структуры базы.

---

# 18. Hospitals

Текущая модель включает:

```text
id
name
description
address
facility_type_id
latitude
longitude
phone
created_at
updated_at
```

Связь:

```text
hospital
    ↓
facility_type
```

Также есть:

```text
sickness_hospital
```

которая определяет применимость учреждения к конкретному заболеванию.

Получается:

```text
Sickness
   ↕
SicknessHospital
   ↕
Hospital
   ↓
FacilityType
```

Это важно для будущего nearest routing.

---

# 19. Rule

Rule связывает набор условий с Result.

Текущая таблица:

```sql
CREATE TABLE IF NOT EXISTS checklist_rule (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    checklist_version_id UUID NOT NULL,
    result_id UUID NOT NULL,
    name TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT checklist_rule_pkey PRIMARY KEY (id),

    CONSTRAINT checklist_rule_version_fkey
        FOREIGN KEY (checklist_version_id)
        REFERENCES checklist_version(id)
        ON DELETE CASCADE,

    CONSTRAINT checklist_rule_result_fkey
        FOREIGN KEY (result_id)
        REFERENCES checklist_result(id)
        ON DELETE CASCADE,

    CONSTRAINT checklist_rule_priority_check
        CHECK (priority >= 0)
);
```

Rule выглядит концептуально так:

```text
Rule
 ├── Version
 ├── Result
 ├── Name
 └── Priority
```

Condition появится следующим уровнем:

```text
Rule
 └── Conditions
```

---

# 20. Зачем нужен Priority

Может существовать несколько подходящих правил.

Например:

```text
Rule 1
priority = 10

Rule 2
priority = 100
```

Оба потенциально могут совпасть.

Тогда Rule Engine сможет выбрать более приоритетное правило.

Текущая сортировка:

```sql
ORDER BY priority DESC, created_at ASC
```

То есть:

```text
priority 100
priority 50
priority 10
```

При одинаковом priority первым будет более старое правило.

Это даёт детерминированный порядок.

---

# 21. Важный текущий инвариант Rule

SQL FK гарантирует:

```text
result_id существует
```

и:

```text
checklist_version_id существует
```

Но БД сейчас **не гарантирует**, что:

```text
Rule.version_id
```

и:

```text
Rule.result_id → Result.version_id
```

относятся к одной Version.

Например, на уровне FK теоретически можно попытаться создать:

```text
Rule
    version = V1
    result  = Result(V2)
```

Обе записи существуют, поэтому обычный FK это пропустит.

Следовательно:

```text
Service обязан проверить:
Result.version_id == Rule.version_id
```

Это уже заложено в текущую архитектуру.

---

# 22. Rule Repository

Для Rule были предусмотрены следующие операции:

```text
CreateChecklistRule
GetChecklistRuleByID
ListChecklistRules
UpdateChecklistRule
DeleteChecklistRule

GetChecklistRuleVersionID
GetChecklistRuleVersionStatusByRuleID
GetChecklistRuleResultID
CountChecklistRules
```

Особенно важны:

```text
GetChecklistRuleVersionID
```

чтобы определить Version конкретного Rule.

И:

```text
GetChecklistRuleVersionStatusByRuleID
```

чтобы при Update/Delete определить, можно ли изменять правило.

---

# 23. Rule Service — Create

Логика создания:

```text
POST /checklist-versions/{version_id}/rules
```

Service должен:

### Шаг 1

Проверить DTO:

```text
dto != nil
```

### Шаг 2

Проверить:

```text
name != nil
name != ""
```

### Шаг 3

Проверить:

```text
priority != nil
priority >= 0
```

### Шаг 4

Проверить:

```text
result_id != nil
```

### Шаг 5

Parse UUID:

```text
version_id
result_id
```

### Шаг 6

Получить статус Version.

Здесь Rule ещё не существует, поэтому нельзя использовать:

```text
GetChecklistRuleVersionStatusByRuleID
```

Нужно обращаться непосредственно к Version repository:

```text
GetChecklistVersionStatus(versionID)
```

### Шаг 7

Проверить:

```text
status == draft
```

### Шаг 8

Получить Version Result:

```text
GetChecklistResultVersionID(resultID)
```

### Шаг 9

Проверить:

```text
resultVersionID == versionID
```

### Шаг 10

Создать Rule.

Итого:

```text
Create Rule

version exists
    ↓
version draft
    ↓
result exists
    ↓
result belongs to same version
    ↓
create
```

---

# 24. Rule Service — Get

Для:

```text
GET /checklist-rules/{id}
```

логика простая:

```text
parse UUID
    ↓
repository.GetByID
    ↓
map Response → ResponseDTO
```

Get не требует проверки draft, потому что чтение разрешено независимо от статуса Version.

---

# 25. Rule Service — List

Для:

```text
GET /checklist-versions/{version_id}/rules
```

логика:

```text
parse version UUID
    ↓
repository.ListChecklistRules
    ↓
map every Response → DTO
```

Сортировка выполняется на SQL-уровне:

```sql
ORDER BY priority DESC, created_at ASC
```

---

# 26. Rule Service — Count

Для:

```text
GET /checklist-versions/{version_id}/rules/count
```

логика:

```text
parse UUID
    ↓
CountChecklistRules
    ↓
int64
```

Count нужен прежде всего для administrative UI и проверки полноты конфигурации.

---

# 27. Rule Service — Update

Для:

```text
PATCH /checklist-rules/{id}
```

порядок:

```text
1. parse rule ID
2. получить Rule version ID
3. получить status Version
4. проверить draft
5. проверить DTO
6. parse result ID
7. проверить result принадлежит этой же Version
8. Update
```

Особенно важно:

```text
Rule нельзя перенести в другую Version
```

В Update не передаётся `checklist_version_id`.

То есть Version является неизменяемой принадлежностью Rule.

Можно менять:

```text
name
priority
result_id
```

но нельзя:

```text
checklist_version_id
```

---

# 28. Rule Service — Delete

Для:

```text
DELETE /checklist-rules/{id}
```

логика:

```text
Rule ID
    ↓
получить Version ID
    ↓
получить Version status
    ↓
draft?
    ↓
delete
```

Если Version:

```text
published
archived
```

удаление запрещается.

---

# 29. DTO Rule

Текущий Create DTO:

```go
type CreateDTO struct {
    ChecklistVersionID *string `json:"checklist_version_id"`
    ResultID           *string `json:"result_id"`
    Name               *string `json:"name"`
    Priority           *int32  `json:"priority"`
}
```

Update:

```go
type UpdateDTO struct {
    Name     *string `json:"name"`
    Priority *int32  `json:"priority"`
    ResultID *string `json:"result_id"`
}
```

Pointer-поля позволяют различать:

```text
поле не передано
```

и:

```text
поле передано с zero-value
```

Но для Create это создаёт архитектурный нюанс: `checklist_version_id` одновременно известен из URL:

```text
/checklist-versions/{version_id}/rules
```

и присутствует в DTO.

Более чистый API:

```text
version_id
```

берётся только из URL.

Но пока текущий DTO содержит это поле, сервис должен не допускать рассогласования:

```text
URL version_id != DTO checklist_version_id
```

---

# 30. Handler Rule

Предусмотрены endpoint'ы:

```http
POST   /checklist-versions/{version_id}/rules
GET    /checklist-versions/{version_id}/rules
GET    /checklist-versions/{version_id}/rules/count

GET    /checklist-rules/{id}
PATCH  /checklist-rules/{id}
DELETE /checklist-rules/{id}
```

В текущем router это должно быть расположено примерно так:

```go
r.Route("/checklist-versions", func(r chi.Router) {
    r.Post("/{version_id}/results", handlerChecklistResult.CreateChecklistResult)
    r.Get("/{version_id}/results", handlerChecklistResult.ListChecklistResults)

    r.Post("/{version_id}/rules", handlerChecklistRule.CreateChecklistRuleHandler)
    r.Get("/{version_id}/rules/count", handlerChecklistRule.CountChecklistRulesHandler)
    r.Get("/{version_id}/rules", handlerChecklistRule.ListChecklistRulesHandler)
})

r.Route("/checklist-rules", func(r chi.Router) {
    r.Get("/{id}", handlerChecklistRule.GetChecklistRuleByIDHandler)
    r.Patch("/{id}", handlerChecklistRule.UpdateChecklistRuleHandler)
    r.Delete("/{id}", handlerChecklistRule.DeleteChecklistRuleHandler)
})
```

---

# 31. Важные исправления, которые уже были выявлены в Handler

### Ошибка Create

Неправильно:

```go
var resp *ResponseDTO

resp, err := service.CreateChecklistRule(
    ctx,
    versionID,
    &CreateDTO{
        ChecklistVersionID: resp.ChecklistVersionID,
        ...
    },
)
```

`resp` здесь ещё не существует.

Правильный поток:

```text
decode JSON
    ↓
CreateDTO
    ↓
service
    ↓
ResponseDTO
    ↓
encode JSON
```

То есть:

```go
var dto CreateDTO

if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
    ...
    return
}

resp, err := h.service.CreateChecklistRule(
    r.Context(),
    versionID,
    &dto,
)
```

---

# 32. Ещё один важный Handler-инвариант

После ошибки нельзя продолжать выполнение.

Неправильно:

```go
if err != nil {
    writeError(...)
}

writeSuccess(...)
```

Нужно:

```go
if err != nil {
    writeError(...)
    return
}
```

Иначе Handler может сначала отдать ошибку, а затем попытаться сформировать:

```text
200 OK
```

---

# 33. Статусы ошибок

Для administrative CRUD уже выработан смысл:

```text
400 Bad Request
```

для:

- неправильного UUID;
- неправильного DTO;
- отрицательного priority;
- пустого обязательного поля;
- неправильной конфигурации.

И:

```text
409 Conflict
```

для ситуации:

```text
Version не находится в draft
```

то есть объект существует, запрос структурно правильный, но текущее состояние Version не позволяет выполнить операцию.

---

# 34. Что сейчас отсутствует — Checklist Rule Condition

Это следующий основной модуль.

Сейчас Rule означает:

```text
Rule → Result
```

но не содержит ответа на вопрос:

```text
при каких ответах пользователя Rule подходит?
```

Для этого нужен:

```text
checklist_rule_condition
```

Концептуально:

```text
Rule
 │
 ├── Condition 1
 ├── Condition 2
 ├── Condition 3
 └── ...
```

Пример:

```text
Rule: "Высокий риск инсульта"

Condition 1:
question = "Есть нарушение речи?"
option = "Да"

Condition 2:
question = "Есть слабость конечности?"
option = "Да"
```

Логически:

```text
Condition 1
    AND
Condition 2
    ↓
Rule matches
```

---

# 35. Модель Condition

Для закрытых вопросов наиболее естественная схема:

```text
checklist_rule_condition
    rule_id
    question_id
    option_id
```

При этом Condition должна ссылаться не просто на произвольный Option.

Необходимы проверки:

```text
question принадлежит той же Version, что и Rule
```

и:

```text
option принадлежит этому question
```

Получается цепочка:

```text
Rule
 ↓
Version
 ↓
Question
 ↓
Option
```

---

# 36. Почему эти проверки обязательны

Иначе можно получить логически некорректную конфигурацию:

```text
Rule V1
   ↓
Question V2
```

или:

```text
Question V1
   ↓
Option другого Question
```

База через простые FK может пропустить такую структуру.

Поэтому Service Condition должен гарантировать:

```text
rule.version_id
    ==
question.version_id
```

и:

```text
option.question_id
    ==
condition.question_id
```

---

# 37. Вопрос, который нужно окончательно определить при реализации Condition

Для типов:

```text
single
multiple
```

можно естественно использовать `option_id`.

Но для:

```text
text
number
boolean
```

одного `option_id` недостаточно.

Следовательно, Condition-модель должна заранее учитывать сравнение значений.

Например:

```text
number > 180
boolean == true
text == "..."
```

Поэтому Rule Condition лучше проектировать не только как:

```text
question + option
```

а как более универсальную модель.

Концептуально:

```text
question_id
operator
option_id
value
```

где разные типы используют разные поля.

Например:

```text
single:
option_id = X

multiple:
option_id = X

boolean:
operator = equals
value = true

number:
operator = greater_than
value = 180

text:
operator = equals
value = "..."
```

Это решение надо принять до начала Rule Engine.

---

# 38. Правильная семантика Rule

После появления Condition:

```text
Rule
 ├── Condition 1
 ├── Condition 2
 ├── Condition 3
 └── Result
```

по умолчанию разумная логика:

```text
Condition 1
AND
Condition 2
AND
Condition 3
```

То есть Rule срабатывает только тогда, когда **все** его условия выполнены.

Пример:

```text
Q1 = Да
AND
Q2 = Да
AND
Q3 > 180
```

→ Result = "Высокий риск".

Это существенно проще и предсказуемее, чем сразу вводить произвольные AND/OR-группы.

---

# 39. Rule Priority как следующий уровень принятия решения

Если несколько Rules удовлетворяют ответам:

```text
Rule A → match
Rule B → match
Rule C → match
```

используется:

```text
priority
```

Например:

```text
Rule C priority 100
Rule A priority 50
Rule B priority 10
```

будет выбран:

```text
Rule C
```

Таким образом, Rule Engine должен:

```text
1. получить все Rules Version
2. получить их Conditions
3. проверить Rules
4. оставить только matching
5. отсортировать по priority
6. взять первое
7. получить Result
```

---

# 40. Что делать, если ни одно Rule не подошло

Это обязательно нужно решить до финального Rule Engine.

Есть два варианта.

### Вариант A

Иметь специальный fallback Result.

Например:

```text
Rule без Conditions
```

который фактически означает:

```text
default result
```

### Вариант B

Сервис возвращает:

```text
no matching rule
```

и вызывающая логика решает, что делать.

Для медицинского сценария наиболее предсказуемо иметь явно настроенный fallback, а не скрытое поведение.

---

# 41. Пользовательская часть: Checklist Attempt

После завершения административной конфигурации нужен объект:

```text
checklist_attempt
```

Он представляет конкретное прохождение пользователем определённой Version.

Пример:

```text
User #100
    ↓
Checklist "Инсульт"
    ↓
Version 3
    ↓
Attempt #ABC
```

Attempt должен хранить минимум:

```text
id
user_id
checklist_version_id
status
started_at
completed_at
```

Статусы могут быть, например:

```text
in_progress
completed
cancelled
```

Главная идея:

```text
Attempt всегда связан с конкретной Version
```

---

# 42. Почему Attempt должен хранить Version, а не только Checklist

Нельзя строить прохождение так:

```text
Attempt
   ↓
Checklist
   ↓
latest version
```

Потому что Version может измениться.

Правильно:

```text
Attempt
   ↓
Version 3
```

Тогда даже если Version 4 позже станет published:

```text
старый Attempt → Version 3
новый Attempt   → Version 4
```

История остаётся корректной.

---

# 43. Checklist Answer

Следующая сущность:

```text
checklist_answer
```

Она хранит ответ пользователя на конкретный Question.

Концептуально:

```text
Attempt
   ↓
Answer
   ├── question_id
   ├── option_id
   └── value
```

Но поскольку существуют разные типы вопросов, поле `value` должно быть спроектировано аккуратно.

---

# 44. Ответы разных типов

## Single

```text
question_id
option_id = X
```

## Multiple

Есть несколько выбранных options:

```text
question_id
option_id = X

question_id
option_id = Y
```

Либо отдельная модель ответа со списком options.

## Boolean

```text
question_id
value = true
```

## Number

```text
question_id
value = 180
```

## Text

```text
question_id
value = "..."
```

Самое важное — Rule Engine должен получать ответы в едином внутреннем представлении, а не самостоятельно разбирать HTTP JSON.

---

# 45. Жизненный цикл Attempt

Пользовательский поток:

```text
POST /checklists/{checklist_id}/attempts
```

Создаётся Attempt.

Система должна:

```text
1. найти published Version
2. создать Attempt
3. привязать его к этой Version
```

Дальше:

```text
POST /checklist-attempts/{attempt_id}/answers
```

передаются ответы.

После этого:

```text
POST /checklist-attempts/{attempt_id}/complete
```

и происходит вычисление результата.

---

# 46. Проверки при сохранении Answer

Нужно гарантировать:

```text
Attempt существует
```

и:

```text
Attempt не завершён
```

Также:

```text
Question принадлежит Version Attempt
```

Если используется Option:

```text
Option принадлежит Question
```

То есть снова действует тот же принцип целостности:

```text
Attempt
 ↓
Version
 ↓
Question
 ↓
Option
```

Нельзя принять:

```text
Attempt V3
+
Question V4
```

---

# 47. Проверка Required Questions

При завершении Attempt необходимо проверить:

```text
required == true
```

Для всех обязательных вопросов.

Например:

```text
Q1 required=true → ответ есть
Q2 required=true → ответа нет
Q3 required=false → ответа нет
```

Attempt нельзя корректно завершить, пока Q2 не заполнен.

Это логика Service, а не фронтенда.

---

# 48. Главная часть системы — Rule Engine

После того как пользователь ответил на вопросы:

```text
Answers
    ↓
Rule Engine
```

Rule Engine должен быть самостоятельным компонентом.

Он не должен зависеть от:

```text
HTTP request
http.ResponseWriter
chi
DTO
```

Лучше дать ему чистый вход:

```go
answers
rules
```

и чистый результат:

```go
matched rule
result
```

---

# 49. Алгоритм Rule Engine

Примерный алгоритм:

```text
1. Получить Attempt Version.
2. Получить все Rules этой Version.
3. Получить Conditions Rules.
4. Получить ответы пользователя.
5. Для каждого Rule:
       проверить все Conditions.
6. Оставить matching Rules.
7. Отсортировать по Priority.
8. Выбрать первый.
9. Вернуть Result.
```

В виде схемы:

```text
Answers
   ↓
Load Rules
   ↓
Evaluate Conditions
   ↓
Matching Rules
   ↓
Priority
   ↓
Selected Rule
   ↓
Result
```

---

# 50. Rule Engine не должен заниматься Routing

Это принципиальное архитектурное разделение.

Rule Engine:

```text
ответы
 ↓
Rule
 ↓
Result
```

Routing Engine:

```text
Result
 ↓
Routing configuration
 ↓
Facility
```

Rule Engine не должен знать:

```text
hospital
latitude
longitude
facility type
distance
```

И наоборот, Routing Engine не должен понимать медицинскую логику вопросов.

---

# 51. Routing Engine

После получения Result:

```text
result_id
```

загружается:

```text
checklist_result_routing
```

Далее:

### fixed

```text
routing_type = fixed
    ↓
hospital_id
    ↓
Hospital
```

### nearest

```text
routing_type = nearest
    ↓
facility_type_id
    ↓
patient coordinates
    ↓
candidate hospitals
    ↓
sickness filter
    ↓
distance calculation
    ↓
nearest Hospital
```

---

# 52. География

Для nearest routing уже предусмотрено хранение:

```text
latitude
longitude
```

у Hospital.

У пользователя в будущем должны быть координаты местоположения пациента.

Алгоритм:

```text
Patient:
lat = X
lng = Y

Facilities:
    A → lat/lng
    B → lat/lng
    C → lat/lng
```

Рассчитать расстояние:

```text
distance(patient, A)
distance(patient, B)
distance(patient, C)
```

и выбрать:

```text
MIN(distance)
```

При этом сначала применяется фильтрация по бизнес-правилам:

```text
facility_type
+
sickness relation
+
coordinates
```

а уже потом расстояние.

---

# 53. SicknessHospital и Routing

Связь:

```text
sickness_hospital
```

нужна не только для административного CRUD.

Она позволяет сделать:

```text
sickness
    ↓
подходящие hospitals
```

Поэтому nearest routing может работать так:

```text
Result
    ↓
routing.facility_type
    ↓
sickness
    ↓
sickness_hospital
    ↓
candidate hospitals
    ↓
nearest
```

Таким образом ближайшая больница должна быть не просто географически ближайшей, а подходить по требованиям сценария.

---

# 54. Финальный пользовательский ответ

В идеальном варианте API после завершения Attempt возвращает единый объект:

```json
{
  "result": {
    "id": "...",
    "title": "Высокий риск",
    "message": "Необходимо срочно обратиться за медицинской помощью"
  },
  "routing": {
    "type": "nearest"
  },
  "facility": {
    "id": "...",
    "name": "...",
    "address": "...",
    "phone": "...",
    "latitude": 55.0,
    "longitude": 37.0
  }
}
```

Для `fixed`:

```text
Result
 ↓
fixed routing
 ↓
конкретный Hospital
```

Для `nearest`:

```text
Result
 ↓
nearest routing
 ↓
FacilityType
 ↓
Patient coordinates
 ↓
Nearest Hospital
```

---

# 55. Полная модель данных

Итоговая структура:

```text
sickness
    │
    └── checklist
           │
           ├── checklist_version
           │       │
           │       ├── checklist_question
           │       │       │
           │       │       └── checklist_option
           │       │
           │       ├── checklist_result
           │       │       │
           │       │       └── checklist_result_routing
           │       │
           │       └── checklist_rule
           │               │
           │               └── checklist_rule_condition
           │
           └── ...

user
 │
 └── checklist_attempt
         │
         └── checklist_answer
```

Инфраструктурные связи:

```text
hospital
   ↓
facility_types

sickness
   ↕
sickness_hospital
   ↕
hospital
```

---

# 56. Полный runtime-поток

Вся система в конечном итоге должна работать так:

```text
                    ADMIN
                      │
                      ▼
                 Checklist
                      │
                      ▼
                   Version
                      │
          ┌───────────┼─────────────┐
          ▼           ▼             ▼
       Questions    Results       Rules
          │           │             │
          ▼           ▼             ▼
       Options      Routing      Conditions
                      │
                      ▼
                  PUBLISH
                      │
                      ▼
                 USER CLIENT
                      │
                      ▼
             Start Checklist Attempt
                      │
                      ▼
                  Answers
                      │
                      ▼
                 Complete Attempt
                      │
                      ▼
                 Rule Engine
                      │
                      ▼
                    Result
                      │
                      ▼
                Routing Engine
                      │
             ┌────────┴────────┐
             ▼                 ▼
           fixed            nearest
             │                 │
             ▼                 ▼
         Hospital       Facility Type
                               │
                               ▼
                       Candidate Hospitals
                               │
                               ▼
                         Distance Search
                               │
                               ▼
                       Nearest Hospital
                               │
                               ▼
                         FINAL RESPONSE
```

---

# 57. Что уже сделано

На текущий момент архитектурно и по CRUD уже проработаны/реализованы:

### Checklist

```text
checklist
```

Создание, получение, список, обновление, удаление.

### Version

```text
checklist_version
```

Создание, получение/списки, latest/published, изменение статуса, version numbering.

### Question

```text
checklist_question
```

CRUD, position, required, type, проверка Version status.

### Option

```text
checklist_option
```

CRUD, position, связь с Question, проверка Version status.

### Result

```text
checklist_result
```

CRUD, связь с Version, проверка Version status.

### Result Routing

```text
checklist_result_routing
```

CRUD, `fixed`/`nearest`, проверка конфигурации и Version status.

### Rule

```text
checklist_rule
```

CRUD, priority, привязка к Result, проверка Version status, проверка Result принадлежности Version, Count.

### Facility Type

```text
facility_types
```

CRUD.

### Hospital

```text
hospitals
```

CRUD, facility type, coordinates.

### Sickness-Hospital

```text
sickness_hospital
```

Связь заболевания с медицинскими учреждениями.

---

# 58. Что ещё предстоит сделать

Приоритет я бы зафиксировал следующим образом.

## Этап 1 — Rule Conditions

```text
checklist_rule_condition
```

Нужно реализовать:

```text
migration
SQLC
repository
DTO
service
handler
routes
```

и определить поддерживаемые операторы.

Это следующий непосредственный этап.

---

## Этап 2 — строгая проверка целостности Conditions

Необходимо гарантировать:

```text
Rule
  ↓
Version

Question
  ↓
same Version

Option
  ↓
same Question
```

---

## Этап 3 — финализировать модель операторов

Нужно определить поддержку:

```text
equals
not_equals
greater_than
greater_or_equal
less_than
less_or_equal
contains
```

и решить, какие операторы разрешены для каждого Question type.

Например:

```text
single:
equals / not_equals

multiple:
contains / not_contains

boolean:
equals / not_equals

number:
> >= < <= = !=

text:
equals / contains / ...
```

---

# 59. Этап 4 — Checklist Attempt

Создать:

```text
checklist_attempt
```

с привязкой:

```text
user_id
checklist_version_id
status
started_at
completed_at
```

При старте брать только:

```text
published Version
```

---

# 60. Этап 5 — Checklist Answer

Создать:

```text
checklist_answer
```

и определить окончательную стратегию хранения:

```text
option_id
+
typed value
```

или другой нормализованный вариант.

Особенно важно корректно поддержать:

```text
single
multiple
text
number
boolean
```

---

# 61. Этап 6 — Validation Answers

Перед завершением Attempt:

```text
required questions
```

должны быть заполнены.

Кроме того:

```text
answer.question
```

должен принадлежать:

```text
attempt.version
```

а:

```text
answer.option
```

должен принадлежать:

```text
answer.question
```

---

# 62. Этап 7 — Rule Engine

Реализовать отдельный сервис/пакет, который:

```text
получает Version + Rules + Answers
```

и возвращает:

```text
matched Rule
+
Result
```

Логика:

```text
ALL Conditions of Rule must match
```

и затем:

```text
highest priority wins
```

---

# 63. Этап 8 — Fallback Result

Нужно явно определить поведение:

```text
если ни одно Rule не совпало
```

Рекомендуемый вариант:

```text
явно настроенный default/fallback rule/result
```

а не скрытый магический результат.

---

# 64. Этап 9 — Routing Engine

После Rule Engine:

```text
Result
    ↓
Routing
```

реализовать:

```text
fixed
nearest
```

`fixed`:

```text
routing.hospital_id
```

`nearest`:

```text
routing.facility_type_id
+
patient coordinates
+
sickness
```

---

# 65. Этап 10 — Distance Algorithm

Для nearest необходимо определить алгоритм расстояния.

Минимально:

```text
Haversine
```

по:

```text
latitude
longitude
```

При небольшом количестве учреждений можно начать с вычисления после выборки кандидатов.

При росте количества учреждений имеет смысл перейти к геопространственному решению, например PostGIS.

Но на текущем этапе это необязательно.

---

# 66. Этап 11 — Completion Endpoint

Финальный endpoint:

```text
POST /checklist-attempts/{attempt_id}/complete
```

должен выполнять:

```text
1. проверить Attempt
2. проверить статус
3. проверить required answers
4. загрузить Version
5. загрузить Rules
6. загрузить Conditions
7. загрузить Answers
8. запустить Rule Engine
9. определить Result
10. загрузить Routing
11. определить Facility
12. сохранить завершение Attempt
13. вернуть итог
```

---

# 67. Транзакционные границы

Очень важно не сделать Completion набором независимых операций.

В идеале операция завершения должна быть согласованной:

```text
Attempt
    ↓
validate
    ↓
evaluate
    ↓
persist completed
```

Особенно это важно, если в будущем появятся:

```text
audit
statistics
result history
notifications
```

---

# 68. История результатов

На перспективу желательно рассмотреть сохранение не только текущего Attempt, но и фактического результата:

```text
attempt
    ↓
matched_rule_id
    ↓
result_id
    ↓
facility_id
```

Это позволит потом ответить на вопросы:

```text
какое правило сработало?
какая Version использовалась?
какой Result был выдан?
какое учреждение было выбрано?
```

Это особенно полезно для аудита медицинской логики.

---

# 69. Почему нельзя вычислять Result заново по текущей конфигурации

Пусть:

```text
2026-09-01
Version 1 published
```

Пользователь прошёл checklist.

Потом:

```text
2026-09-15
Version 2 published
```

Если потом просто взять текущие Rules:

```text
current published Version
```

старый результат может перестать воспроизводиться.

Поэтому Attempt всегда должен сохранять:

```text
checklist_version_id
```

а желательно дополнительно:

```text
matched_rule_id
result_id
```

---

# 70. Административный workflow

Администратор в идеале работает так:

```text
1. Create Sickness

2. Create Checklist
      ↓

3. Create Draft Version
      ↓

4. Create Questions
      ↓

5. Create Options
      ↓

6. Create Results
      ↓

7. Create Rules
      ↓

8. Create Rule Conditions
      ↓

9. Configure Result Routing
      ↓

10. Проверить конфигурацию
      ↓

11. Publish Version
```

После:

```text
Publish
```

изменение запрещено.

Для изменений:

```text
создаётся новая Version
```

а не редактируется старая.

---

# 71. Что особенно важно не смешать в коде

Архитектура должна сохранить четыре разные ответственности.

## Checklist configuration

```text
Questions
Options
Results
Rules
Conditions
```

## Rule Engine

```text
Answers → Rule → Result
```

## Routing Engine

```text
Result → Facility
```

## Attempt

```text
User → конкретная Version → Answers → Final Result
```

Нельзя превращать всё это в один огромный `ChecklistService`.

---

# 72. Итоговая архитектура

Конечная система должна выглядеть примерно так:

```text
                  CHECKLIST CONFIGURATION
                           │
                           ▼
                      Checklist
                           │
                           ▼
                        Version
                           │
          ┌────────────────┼──────────────────┐
          │                │                  │
          ▼                ▼                  ▼
      Questions          Results             Rules
          │                │                  │
          ▼                ▼                  ▼
       Options          Routing          Conditions


                    USER EXECUTION
                           │
                           ▼
                         User
                           │
                           ▼
                    ChecklistAttempt
                           │
                           ▼
                       Answers
                           │
                           ▼
                     Rule Engine
                           │
                           ▼
                         Result
                           │
                           ▼
                   Routing Engine
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
                fixed            nearest
                  │                 │
                  ▼                 ▼
              Hospital        Facility Type
                                    │
                                    ▼
                              Coordinates
                                    │
                                    ▼
                               Hospital
```

---

# 73. Практический порядок дальнейшей разработки

Именно для текущего проекта оптимальная последовательность следующая:

```text
[ГОТОВО]
Checklist
    ↓
Checklist Version
    ↓
Checklist Question
    ↓
Checklist Option
    ↓
Checklist Result
    ↓
Checklist Result Routing
    ↓
Checklist Rule

[СЛЕДУЮЩЕЕ]
Checklist Rule Condition

[ПОСЛЕ]
Condition evaluation model
    ↓
Checklist Attempt
    ↓
Checklist Answer
    ↓
Answer validation
    ↓
Rule Engine
    ↓
Fallback Result
    ↓
Routing Engine
    ↓
Nearest Facility
    ↓
Complete Attempt API
    ↓
Result history / audit
```

---

# 74. Ключевой результат текущего этапа

На данный момент уже построен практически весь **административный конструктор Checklist**:

```text
Checklist
 → Version
 → Question
 → Option
 → Result
 → Routing
 → Rule
```

То есть администратор уже концептуально может собрать конфигурацию вида:

```text
"Инсульт"

Version 1

Q1:
"Есть нарушение речи?"

Options:
    Да
    Нет

Q2:
"Есть слабость конечности?"

Options:
    Да
    Нет

Result:
"Высокий риск"

Routing:
nearest
facility_type = vascular_center

Rule:
priority = 100
→ пока без Conditions
```

Следующим шагом необходимо дать Rule реальную логику:

```text
IF
    Q1 = Да
    AND
    Q2 = Да
THEN
    Result = "Высокий риск"
```

Именно поэтому `checklist_rule_condition` является ближайшим и наиболее важным продолжением текущей реализации.

После завершения Conditions система перейдёт от **конструктора конфигурации** к **движку выполнения**, то есть от хранения правил к реальному вычислению результата по ответам пользователя.