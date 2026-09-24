# GPS-политика и прогноз прибытия

[К общей документации API](../API_DOCUMENTATION.md)

[Мобильный клиент: GPS и ETA](../API_MOBILE_AMBULANCE.md) ·
[Веб-клиент: настройки и ожидаемые машины](../API_WEB_CLIENT.md).
Транспорт — HTTP/JSON. Передача координат — POST, получение ETA — GET;
для обновления экрана клиент повторяет GET. WebSocket отсутствует.

Во время активного вызова мобильное приложение запускает фоновую задачу и
отправляет GPS-точки. Сервер не может сам включить фоновое выполнение на
планшете: приложение должно получить разрешение ОС на геолокацию и соблюдать
политику, которую читает из API.

Для MVP ETA — **приблизительный** прогноз, а не навигационный маршрут:

```text
расстояние по сфере (Haversine)
    × коэффициент дорожного пути
    ÷ средняя скорость скорой
    = estimated_travel_seconds / estimated_arrival_at
```

Значения по умолчанию: интервал `15` секунд, допустимая точность `100` м,
свежесть точки `90` секунд, средняя скорость `80` км/ч, коэффициент дорожного
пути `1.30`. Пробки, перекрытия и фактический маршрут пока не учитываются.
Не используйте ETA как основание для медицинского или диспетчерского решения.

## GET /api/v1/device/geo-tracking-policy

Требует device access token. Возвращает политику для планшета до запуска
фоновой отправки GPS и после её изменения.

```http
Authorization: Bearer <DEVICE_ACCESS_TOKEN>
```

Ответ: `200 OK`.

```json
{
  "data": {
    "active_call_interval_seconds": 15,
    "max_accuracy_meters": 100,
    "location_freshness_seconds": 90,
    "eta_average_speed_kmh": 80,
    "eta_road_distance_factor": 1.3,
    "updated_at": "2026-09-22T12:00:00Z"
  }
}
```

Приложение не должно отправлять точки чаще `active_call_interval_seconds` и
должно предупредить бригаду, когда GPS даёт точность хуже
`max_accuracy_meters`.

## POST /api/v1/emergency-calls/{id}/locations

Описание тела и базовых проверок есть в [emergency-calls.md](emergency-calls.md).
Дополнительно сервер отклоняет:

- точку с `accuracy_meters`, превышающей `max_accuracy_meters` — `400`;
- точку, отправленную раньше установленного интервала от предыдущей принятой
  точки этого вызова — `429 Too Many Requests`.

Каждая принятая точка обновляет ETA, если уже выбрана больница и у неё есть
координаты. История GPS не перезаписывается.

## GET /api/v1/emergency-calls/{id}/arrival-estimate

Требует device access token. Возвращает прогноз для активного вызова только
его собственной device-сессии.

Ответ: `200 OK`.

```json
{
  "data": {
    "emergency_call_id": "1022cf0d-2334-4a18-af99-126e8a4141ca",
    "emergency_call_destination_id": "b87419f5-b2a5-407f-9a4f-bf7ec90eae91",
    "hospital_id": "c3c0098d-5e69-40fe-bd9e-5a0af87a68d0",
    "hospital_name": "Городская клиническая больница №1",
    "hospital_address": "ул. Пример, 10",
    "vehicle_id": "f97c9300-85c9-4905-aa83-8bb8a48ab6e5",
    "car_number": "A123BC77",
    "location_captured_at": "2026-09-22T12:04:55Z",
    "location_accuracy_meters": 8.5,
    "location_is_fresh": true,
    "location_age_seconds": 12,
    "distance_meters": 12500.4,
    "estimated_travel_seconds": 730,
    "estimated_arrival_at": "2026-09-22T12:17:05Z",
    "calculation_method": "haversine_adjusted",
    "calculated_at": "2026-09-22T12:04:56Z",
    "updated_at": "2026-09-22T12:04:56Z"
  }
}
```

`location_is_fresh: false` означает, что прогноз построен по устаревшей
позиции: интерфейс обязан явно это показать, а не выдавать время за актуальное.
`404` означает, что нет выбранной больницы, GPS-точки, координат больницы или
сам вызов не принадлежит текущей активной сессии.

## GET /api/v1/hospital-arrivals

Требует employee JWT и право `hospital_arrival.read`. Возвращает активные
прибытия только в больницы, к которым сотрудник привязан через
`hospital_staff`. Каждый элемент имеет тот же формат, что и прогноз для
устройства, включая `car_number`, ETA и свежесть GPS.

Ответ: `200 OK`, `data` — массив. Пустой массив означает, что сейчас нет
активных машин с выбранной этой больницей.

## Управление политикой GPS

Маршруты требуют employee JWT и `geo_tracking_policy.manage`.

### GET /api/v1/geo-tracking-policy/

Возвращает текущую политику в том же формате, что device-маршрут.

### PATCH /api/v1/geo-tracking-policy/

Меняет только переданные поля. После успешного изменения сервер пересчитывает
сохранённые ETA активных вызовов и пишет аудит-событие
`geo_tracking_policy.updated`.

```json
{
  "active_call_interval_seconds": 20,
  "max_accuracy_meters": 50,
  "location_freshness_seconds": 120,
  "eta_average_speed_kmh": 80,
  "eta_road_distance_factor": 1.35
}
```

Ограничения:

- интервал: от `5` до `300` секунд;
- допустимая точность: больше `0` и не более `10000` метров;
- свежесть: от `15` до `3600` секунд;
- средняя скорость: от `10` до `180` км/ч;
- коэффициент дорожного пути: от `1` до `3`.

Ответ: `200 OK`; некорректное поле — `400`; токен отсутствует — `401`; право
отсутствует — `403`.
