import type { NextRequest } from "next/server";

type NominatimPlace = {
  place_id: number | string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  category?: string;
  address?: NominatimAddress;
  geojson?: NominatimGeometry;
};

type NominatimGeometry =
  | { type: "Polygon"; coordinates: unknown }
  | { type: "MultiPolygon"; coordinates: unknown }
  | { type: string; coordinates: unknown };

type BoundaryPoint = [latitude: number, longitude: number];

type NominatimAddress = Partial<{
  city: string;
  town: string;
  village: string;
  municipality: string;
  hamlet: string;
  settlement: string;
  city_district: string;
  district: string;
  borough: string;
  suburb: string;
  county: string;
  state_district: string;
  state: string;
  road: string;
  pedestrian: string;
  residential: string;
  living_street: string;
  footway: string;
  path: string;
  square: string;
  house_number: string;
  house_name: string;
}>;

function isLonLat(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

function normalizeRing(value: unknown): BoundaryPoint[] | null {
  if (!Array.isArray(value)) return null;

  const points = value.flatMap((point) =>
    isLonLat(point)
      ? [[Number(point[1].toFixed(6)), Number(point[0].toFixed(6))] as BoundaryPoint]
      : [],
  );
  if (points.length < 3) return null;

  const first = points[0];
  const last = points.at(-1);
  if (!last || first[0] !== last[0] || first[1] !== last[1]) {
    points.push([...first]);
  }

  return points.length >= 4 ? points : null;
}

function ringArea(ring: BoundaryPoint[]): number {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [latitude, longitude] = ring[index];
    const [nextLatitude, nextLongitude] = ring[index + 1];
    area += longitude * nextLatitude - nextLongitude * latitude;
  }
  return Math.abs(area / 2);
}

function getBoundary(geometry?: NominatimGeometry): BoundaryPoint[] | null {
  if (!geometry || !Array.isArray(geometry.coordinates)) return null;

  if (geometry.type === "Polygon") {
    return normalizeRing(geometry.coordinates[0]);
  }

  if (geometry.type === "MultiPolygon") {
    const rings = geometry.coordinates.flatMap((polygon) => {
      if (!Array.isArray(polygon)) return [];
      const ring = normalizeRing(polygon[0]);
      return ring ? [ring] : [];
    });
    return rings.sort((left, right) => ringArea(right) - ringArea(left))[0] ?? null;
  }

  return null;
}

function getAreaName(place: NominatimPlace): string {
  return (
    place.name ??
    place.address?.city_district ??
    place.address?.district ??
    place.address?.borough ??
    place.address?.suburb ??
    place.address?.county ??
    place.display_name.split(",")[0]
  ).trim();
}

function formatAddress(place: NominatimPlace): string {
  const address = place.address;
  if (!address) return place.display_name;

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet ??
    address.settlement;
  const district =
    address.city_district ??
    address.district ??
    address.borough ??
    address.suburb;
  const street =
    address.road ??
    address.pedestrian ??
    address.residential ??
    address.living_street ??
    address.footway ??
    address.path ??
    address.square;
  const house = address.house_number ?? address.house_name;

  const parts = [city, district, street, house].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  const uniqueParts = parts.filter(
    (part, index) =>
      parts.findIndex(
        (candidate) => candidate.trim().toLocaleLowerCase("ru-RU") === part.trim().toLocaleLowerCase("ru-RU"),
      ) === index,
  );

  return uniqueParts.length > 0
    ? uniqueParts.map((part) => part.trim()).join(", ")
    : place.display_name;
}

let lastRequestAt = 0;
let requestQueue: Promise<unknown> = Promise.resolve();

function scheduleNominatimRequest<T>(request: () => Promise<T>): Promise<T> {
  const queued = requestQueue.then(async () => {
    const delay = Math.max(0, 1_000 - (Date.now() - lastRequestAt));
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    try {
      return await request();
    } finally {
      lastRequestAt = Date.now();
    }
  });
  requestQueue = queued.catch(() => undefined);
  return queued;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const kind = request.nextUrl.searchParams.get("kind") === "area" ? "area" : "address";
  if (query.length < 3 || query.length > 200) {
    return Response.json(
      { message: "Введите адрес длиной от 3 до 200 символов." },
      { status: 400 },
    );
  }

  const baseUrl = (
    process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org"
  ).replace(/\/$/, "");
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", kind === "area" ? "8" : "5");
  if (kind === "area") {
    url.searchParams.set("polygon_geojson", "1");
    url.searchParams.set(
      "polygon_threshold",
      process.env.NOMINATIM_POLYGON_THRESHOLD ?? "0.0005",
    );
  }
  const countryCodes = process.env.NOMINATIM_COUNTRY_CODES ?? "ru";
  if (countryCodes) url.searchParams.set("countrycodes", countryCodes);

  try {
    const places = await scheduleNominatimRequest(async () => {
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "ru",
          "User-Agent":
            process.env.NOMINATIM_USER_AGENT ??
            "VeraWeb/1.0 (hospital address search)",
        },
        next: { revalidate: 86_400 },
      });
      if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);
      return (await response.json()) as NominatimPlace[];
    });

    const data = places.flatMap((place) => {
      const latitude = Number(place.lat);
      const longitude = Number(place.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

      if (kind === "area") {
        const boundary = getBoundary(place.geojson);
        if (!boundary) return [];
        return [
          {
            id: String(place.place_id),
            name: getAreaName(place),
            label: place.display_name,
            latitude,
            longitude,
            type: place.type ?? null,
            category: place.category ?? null,
            boundary,
            pointCount: boundary.length,
            source: "OpenStreetMap",
          },
        ];
      }

      return [
        {
          id: String(place.place_id),
          label: formatAddress(place),
          latitude,
          longitude,
          type: place.type ?? null,
        },
      ];
    });

    return Response.json(
      { data },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json(
      {
        message:
          kind === "area"
            ? "Сервис поиска территорий временно недоступен."
            : "Сервис поиска адресов временно недоступен.",
      },
      { status: 502 },
    );
  }
}
