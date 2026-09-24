# Аналитика завершённых вызовов

[К общей документации API](../API_DOCUMENTATION.md)

Маршруты доступны только сотруднику с employee JWT и разрешением
`analytics.read` (например, роли `analyst`). Они не предназначены для
планшета скорой и не меняют данные.

```http
Authorization: Bearer <ACCESS_TOKEN>
```

## GET /api/v1/analytics/emergency-calls

Возвращает завершённые вызовы от новых к старым. Это компактный список: для
каждого вызова возвращается completed run, связанный с решением о направлении,
а если направления нет — последний завершённый run. Список кандидатов в этом
запросе не выдаётся, чтобы не перегружать список; он доступен в детальном
маршруте.

Параметры строки запроса необязательны:

- `limit` — от `1` до `100`, по умолчанию `50`;
- `offset` — число пропускаемых записей, от `0`, по умолчанию `0`.

Пример: `GET /api/v1/analytics/emergency-calls?limit=25&offset=0`.

Ответ: `200 OK`.

```json
{
  "data": [
    {
      "id": "6dfd97e0-621a-48f8-b89c-4231f4be76b0",
      "status": "completed",
      "started_at": "2026-09-22T10:00:00Z",
      "completed_at": "2026-09-22T10:41:00Z",
      "device_access_session_id": "5132fd25-4501-4295-a9ec-243180a7c4dc",
      "device_identifier": "tablet-42",
      "vehicle": {
        "id": "f7476027-2534-4e21-9632-a5a1884e25cb",
        "car_number": "A123AA77"
      },
      "checklist_run": {
        "id": "a987a16f-4cb1-4dc8-a1bc-413fe1683c3e",
        "checklist_version_id": "1a1a1afc-aa1c-4bda-8df3-81bb5e56bafd",
        "checklist_version": 2,
        "status": "completed",
        "started_at": "2026-09-22T10:05:00Z",
        "completed_at": "2026-09-22T10:17:00Z",
        "result": {
          "id": "a4694ddb-c137-49d9-b747-f21fab0c0852",
          "checklist_rule_id": "719569bd-4be0-47b2-9ceb-2c8b7caec43e",
          "checklist_result_id": "9d3d11dc-ce5f-4dd6-97ec-120c67649f24",
          "title": "Инсульт",
          "message": "Направить в сосудистый центр",
          "calculated_at": "2026-09-22T10:17:00Z"
        }
      },
      "destination": {
        "id": "a47dfdab-2f0d-4531-815e-7ed4bf2e45c0",
        "checklist_run_result_id": "a4694ddb-c137-49d9-b747-f21fab0c0852",
        "routing_type": "by_tag",
        "status": "selected",
        "selected_hospital": {
          "hospital_id": "fa734939-811b-4579-aa9e-8d37d3d6a6e1",
          "name": "Городская больница №1",
          "address": "ул. Главная, 1"
        },
        "resolved_at": "2026-09-22T10:18:00Z",
        "selected_at": "2026-09-22T10:20:00Z"
      }
    }
  ]
}
```

## GET /api/v1/analytics/emergency-calls/{id}

Возвращает одну завершённую запись в том же формате, но поле
`destination.candidates` содержит сохранённый снимок кандидатов на момент
расчёта направления. Значения `name` и `address` в нём не меняются при
последующем редактировании больницы — это исторические данные выбора.

Ответы: `200 OK`; `400` — `id` не UUID; `404` — вызов не существует или не
имеет статус `completed`; `401` — нет employee JWT; `403` — нет
`analytics.read`.
