# Ресурсы больниц

Базовый URL: `/api/v1`. Все ручки требуют employee access token:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Модель данных

- `equipment` — общий справочник типов оборудования;
- `operating-types` — общий справочник типов или профилей операционных;
- `hospital_equipment` — конкретная физическая единица оборудования больницы;
- `hospital_operating` — конкретная операционная больницы;
- `hospital_staff` — назначение сотрудника в одну или несколько больниц.

Допустимые состояния физического ресурса: `available`, `busy`, `unavailable`.
Новый ресурс создаётся в состоянии `available`.

## Права

| Permission | Возможности |
| --- | --- |
| `hospital_resource.read` | Просмотр справочников и ресурсов больниц |
| `hospital_resource.manage` | CRUD справочников и физических ресурсов; изменение статуса любого ресурса |
| `hospital_resource.change_status` | Изменение статуса ресурса только в назначенной сотруднику больнице |
| `hospital_staff.manage` | Назначение сотрудников в больницы и просмотр назначений |

Администратор после запуска `seed-rbac` получает все четыре права. Для роли
сотрудника больницы обычно нужны `hospital_resource.read` и
`hospital_resource.change_status`; затем администратор создаёт связь
`hospital_staff`.

## Справочник оборудования

| Метод и URL | Permission | Результат |
| --- | --- | --- |
| `POST /equipment/` | `hospital_resource.manage` | Создать тип, `201` |
| `GET /equipment/` | `hospital_resource.read` | Получить список, `200` |
| `GET /equipment/{id}` | `hospital_resource.read` | Получить тип, `200` |
| `PUT /equipment/{id}` | `hospital_resource.manage` | Полностью обновить тип, `200` |
| `DELETE /equipment/{id}` | `hospital_resource.manage` | Удалить неиспользуемый тип, `204` |

Тело создания и обновления:

```json
{
  "name": "Аппарат ИВЛ",
  "description": "Мобильный аппарат искусственной вентиляции лёгких"
}
```

## Справочник операционных

| Метод и URL | Permission | Результат |
| --- | --- | --- |
| `POST /operating-types/` | `hospital_resource.manage` | Создать тип, `201` |
| `GET /operating-types/` | `hospital_resource.read` | Получить список, `200` |
| `GET /operating-types/{id}` | `hospital_resource.read` | Получить тип, `200` |
| `PUT /operating-types/{id}` | `hospital_resource.manage` | Полностью обновить тип, `200` |
| `DELETE /operating-types/{id}` | `hospital_resource.manage` | Удалить неиспользуемый тип, `204` |

Используется такое же тело, как у справочника оборудования.

## Физические ресурсы больницы

Добавление единицы оборудования:

```http
POST /hospitals/{hospital_id}/equipment
```

```json
{
  "equipment_id": "11111111-1111-4111-8111-111111111111",
  "label": "ИВЛ-01"
}
```

Добавление операционной:

```http
POST /hospitals/{hospital_id}/operating-rooms
```

```json
{
  "operating_id": "22222222-2222-4222-8222-222222222222",
  "label": "Операционная №1"
}
```

Создание требует `hospital_resource.manage`. Просмотр списков:

```http
GET /hospitals/{hospital_id}/equipment
GET /hospitals/{hospital_id}/operating-rooms
```

Получение и удаление конкретной записи:

```http
GET    /hospital-equipment/{id}
DELETE /hospital-equipment/{id}
GET    /hospital-operating-rooms/{id}
DELETE /hospital-operating-rooms/{id}
```

GET требует `hospital_resource.read`, DELETE — `hospital_resource.manage`.
Ответ физического ресурса содержит идентификаторы больницы и типа, имя типа,
`label`, `status`, `status_changed_at`, `created_at` и `updated_at`.

## Изменение состояния сотрудником

```http
PATCH /hospital-equipment/{id}/status
PATCH /hospital-operating-rooms/{id}/status
```

```json
{
  "status": "busy"
}
```

Ручка допускает роль с `hospital_resource.manage` или
`hospital_resource.change_status`. Во втором случае сервер дополнительно
проверяет, что текущий `user_id` назначен в больницу ресурса. Нельзя передать
`hospital_id` в теле и таким образом изменить чужую больницу: сервер получает
его из самой записи ресурса.

## Назначения сотрудников

Все ручки требуют `hospital_staff.manage`.

Создать назначение:

```http
POST /hospital-staff/
```

```json
{
  "user_id": "33333333-3333-4333-8333-333333333333",
  "hospital_id": "44444444-4444-4444-8444-444444444444"
}
```

Остальные операции:

```http
DELETE /hospital-staff/users/{user_id}/hospitals/{hospital_id}
GET    /hospital-staff/users/{user_id}/hospitals
GET    /hospital-staff/hospitals/{hospital_id}/users
```

Списки возвращаются в виде `{ "data": { "ids": ["..."] } }`.

## Основные ошибки

- `400` — неверный UUID, JSON, пустое имя/label или неизвестный статус;
- `403` — нет permission либо сотрудник не назначен в больницу;
- `404` — тип, физический ресурс, больница, пользователь или назначение не найдены;
- `409` — дубликат имени/label/назначения либо попытка удалить используемый тип;
- `500` — внутренняя ошибка БД или сервера.
