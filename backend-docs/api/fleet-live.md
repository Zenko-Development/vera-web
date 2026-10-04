# Live fleet map

## `GET /api/v1/fleet/live`

Requires an employee access token and the `fleet_location.read` permission.
The endpoint returns active, unexpired device shifts for active, non-deleted
devices. Shifts without a received GPS location are included so the web map can
show that the vehicle is on shift but its position is unavailable.

```http
Authorization: Bearer <USER_ACCESS_TOKEN>
```

Example response:

```json
{
  "data": [
    {
      "vehicle_id": "f97c9300-85c9-4905-aa83-8bb8a48ab6e5",
      "car_number": "A123BC77",
      "device_id": "tablet-001",
      "session_id": "3c25ec38-2934-4872-9b65-4927fb67c21f",
      "latitude": 55.751244,
      "longitude": 37.618423,
      "accuracy_meters": 8.5,
      "captured_at": "2026-09-28T12:00:00Z",
      "received_at": "2026-09-28T12:00:02Z",
      "emergency_call_id": "1022cf0d-2334-4a18-af99-126e8a4141ca",
      "location_is_fresh": true,
      "location_age_seconds": 12
    }
  ]
}
```

`latitude`, `longitude`, `accuracy_meters`, timestamps, and `emergency_call_id`
are omitted when unavailable. `location_is_fresh` is false and
`location_age_seconds` is omitted if no location has been received. Freshness
uses the current `location_freshness_seconds` from the geo-tracking policy.
Clients should poll this endpoint to refresh the map; it does not use WebSocket
push.
