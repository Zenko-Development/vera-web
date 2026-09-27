import type { NextRequest } from "next/server";

type NominatimPlace = {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: NominatimAddress;
};

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
  url.searchParams.set("limit", "5");
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
      { message: "Сервис поиска адресов временно недоступен." },
      { status: 502 },
    );
  }
}
