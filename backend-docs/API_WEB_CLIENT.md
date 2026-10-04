# API веб-клиента

[Общие правила API](API_DOCUMENTATION.md) · [API приложения скорой](API_MOBILE_AMBULANCE.md)

Документ предназначен разработчику интерфейсов администратора, сотрудника
больницы и аналитика. Пути ниже указаны относительно `/api/v1`.
Точные тела запросов, ответы и ошибки находятся в связанных разделах.

## Вход и доступ

Используйте `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` и
`GET /auth/me`. После входа запрашивайте `/auth/me` для меню по текущим правам
и получения назначенных сотруднику `hospital_ids`.
Контракт: [авторизация сотрудников](api/auth-users-access.md).
Защищённые запросы требуют `Authorization: Bearer <USER_ACCESS_TOKEN>`.
Сервер проверяет права роли; `401` означает проблему аутентификации,
`403` — отсутствие разрешения. Device-токены для этих маршрутов не подходят.

## Разделы веб-приложения

| Экран / задача | Маршруты | Подробный контракт |
| --- | --- | --- |
| Пользователи, роли, назначение прав | `/user`, `/role`, `/permission`, `/link/role/…`, `/link/permission/…` | [Пользователи и права](api/auth-users-access.md), [RBAC](RBAC.md) |
| Регистрация планшета, просмотр, сброс секрета, отключение и удаление | `/device/`, `/device/{device_id}`, `/device/{device_id}/auth-secret`, `PATCH /device/{device_id}/status`, `DELETE /device/{device_id}` | [Provisioning](api/device-ambulance-access.md#provisioning-устройства) |
| Парк автомобилей | `/ambulance-vehicles/`, `/ambulance-vehicles/{id}` | [Машины](api/device-ambulance-access.md#машины-скорой) |
| Больницы, заболевания, типы учреждений и связи | `/hospital`, `/sickness`, `/facility-type`, `/link/hospital/…`, `/link/sickness/…` | [Справочники](api/catalogs.md) |
| Конструктор чеклистов, версии, вопросы, варианты | `/checklist`, `/checklist-versions`, `/checklist-questions`, `/checklist-options` | [Чеклисты](api/checklists.md) |
| Результаты, правила, условия, требования ресурсов и routing | `/checklist-results`, `/checklist-rules`, `/checklist-rule-conditions`, `/checklist-result-routing`, `/checklist-result-equipment-requirements`, `/checklist-result-operating-requirements` | [Правила и результаты](api/results-rules-routing.md) |
| Зоны ответственности больниц | `/hospital-service-areas` | [Зоны обслуживания](api/hospital-routing.md) |
| Оборудование, операционные, назначения сотрудников | `/equipment`, `/operating-types`, `/hospitals/{hospital_id}/…`, `/hospital-equipment`, `/hospital-operating-rooms`, `/hospital-staff` | [Ресурсы больниц](api/hospital-resources.md) |
| Ожидаемые машины и ETA | `GET /hospital-arrivals` | [Прибытия](api/geo-tracking.md#get-apiv1hospital-arrivals) |
| Настройки GPS и ETA | `GET /geo-tracking-policy/`, `PATCH /geo-tracking-policy/` | [GPS-политика](api/geo-tracking.md#управление-политикой-gps) |
| Журнал аудита | `GET /audit/events` | [Аудит](api/audit.md) |
| Завершённые вызовы, результаты и направления | `GET /analytics/emergency-calls`, `GET /analytics/emergency-calls/{id}` | [Аналитика](api/analytics.md) |

Пути в таблице обозначают группы; используйте точный метод и завершающий `/`
из подробного контракта. Не все операции CRUD доступны у каждой группы.

## Экран сотрудника больницы

Администратор назначает сотрудника через `/hospital-staff/` и выдаёт его роли
нужные права. Для изменения состояния ресурсов используется
`hospital_resource.change_status`, для прибытий — `hospital_arrival.read`.

1. Загрузить оборудование и операционные назначенной больницы.
2. Изменять состояние конкретного ресурса через
   `PATCH /hospital-equipment/{id}/status` или
   `PATCH /hospital-operating-rooms/{id}/status`.
3. Периодически выполнять `GET /hospital-arrivals` для обновления списка
   ожидаемых машин. Сервер ограничивает его назначениями `hospital_staff`.
4. Показывать `car_number`, `hospital_name`, `estimated_arrival_at` и
   `location_is_fresh`. При устаревшей точке помечать прогноз как устаревший.

Список прибытий обновляется HTTP-опросом (polling). WebSocket и серверные
push-события сейчас не реализованы. Интервал опроса интерфейса выбирает клиент;
`device_location_interval_seconds` задаёт частоту общей GPS-позиции на смене;
`active_call_interval_seconds` — частоту точек для расчёта ETA при вызове.
Закрытые вызовы исчезают из активных прибытий и доступны через аналитику.

## Граница с мобильным приложением

Веб-администратор создаёт машину и вызывает `POST /device/`. Ответ содержит
`data.qr_payload`: это готовая строка для QR-кодирования, внутри которой есть
`device_id` и исходный `auth_secret`. Показывайте QR только на экране выдачи;
не храните его в браузере и не логируйте. Секрет возвращается лишь при выдаче
или `POST /device/{device_id}/auth-secret`; при потере нужен сброс.
`auth_secret_hash` в QR и API не передаётся. Планшет сохраняет реквизиты в
защищённом хранилище. Дальше сменой, вызовом, GPS и ответами на чеклист управляет
[мобильное приложение](API_MOBILE_AMBULANCE.md) со своим device-токеном.
Маршруты `/device-access/*` и `/checklist-runs/*` не являются API сотрудника.
