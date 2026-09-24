# API веб-клиента

[Общие правила API](API_DOCUMENTATION.md) · [API приложения скорой](API_MOBILE_AMBULANCE.md)

Документ предназначен разработчику интерфейсов администратора, сотрудника
больницы и аналитика. Пути ниже указаны относительно `/api/v1`.
Точные тела запросов, ответы и ошибки находятся в связанных разделах.

## Вход и доступ

Используйте `POST /auth/login`, `POST /auth/refresh` и `POST /auth/logout`.
Контракт: [авторизация сотрудников](api/auth-users-access.md).
Защищённые запросы требуют `Authorization: Bearer <USER_ACCESS_TOKEN>`.
Сервер проверяет права роли; `401` означает проблему аутентификации,
`403` — отсутствие разрешения. Device-токены для этих маршрутов не подходят.

## Разделы веб-приложения

| Экран / задача | Маршруты | Подробный контракт |
| --- | --- | --- |
| Пользователи, роли, назначение прав | `/user`, `/role`, `/permission`, `/link/role/…`, `/link/permission/…` | [Пользователи и права](api/auth-users-access.md), [RBAC](RBAC.md) |
| Регистрация планшета, просмотр, сброс секрета | `/device/`, `/device/{device_id}`, `/device/{device_id}/auth-secret` | [Provisioning](api/device-ambulance-access.md#provisioning-устройства) |
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
`active_call_interval_seconds` задаёт частоту отправки GPS планшетом.
Закрытые вызовы исчезают из активных прибытий и доступны через аналитику.

## Граница с мобильным приложением

Веб-администратор создаёт машину и выдаёт планшету `device_id` и `auth_secret`.
Секрет возвращается при выдаче/сбросе; его необходимо передать в защищённое
хранилище планшета. Дальше сменой, вызовом, GPS и ответами на чеклист управляет
[мобильное приложение](API_MOBILE_AMBULANCE.md) со своим device-токеном.
Маршруты `/device-access/*` и `/checklist-runs/*` не являются API сотрудника.
