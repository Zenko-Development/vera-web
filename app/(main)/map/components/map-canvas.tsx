"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { LatLngBoundsExpression } from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import { useTheme } from "next-themes";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Popup,
  useMap,
} from "react-leaflet";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import type { Hospital } from "@/entities/hospital/model/types";
import { getArrivalCoordinates } from "./map-data";

const mapStyleUrl =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/positron";
const darkMapStyleUrl =
  process.env.NEXT_PUBLIC_MAP_DARK_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/dark";
const mapWorkerUrl =
  process.env.NEXT_PUBLIC_MAP_WORKER_URL ??
  "/maplibre/maplibre-gl-worker.mjs";
const mapAttribution =
  '<a href="https://openfreemap.org">OpenFreeMap</a> · <a href="https://www.openmaptiles.org/">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>';

export function MapCanvas({
  hospitals,
  arrivals,
}: {
  hospitals: Hospital[];
  arrivals: HospitalArrival[];
}) {
  const vehiclePoints = useMemo(
    () =>
      arrivals.flatMap((arrival) => {
        const coordinates = getArrivalCoordinates(arrival);
        return coordinates ? [{ arrival, coordinates }] : [];
      }),
    [arrivals],
  );
  const points = useMemo<[number, number][]>(
    () => [
      ...hospitals.map((hospital) => [hospital.latitude, hospital.longitude] as [number, number]),
      ...vehiclePoints.map((item) => item.coordinates),
    ],
    [hospitals, vehiclePoints],
  );

  return (
    <MapContainer
      center={[56.8389, 60.6057]}
      zoom={11}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      className="vera-map h-full w-full"
      preferCanvas
    >
      <AttributionControl position="bottomright" prefix={false} />
      <OpenFreeMapLayer />
      <FitPoints points={points} />

      {hospitals.map((hospital) => (
        <CircleMarker
          key={hospital.id}
          center={[hospital.latitude, hospital.longitude]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#33BBFF",
            fillOpacity: 1,
          }}
        >
          <Popup closeButton={false}>
            <div className="min-w-48 space-y-1">
              <p className="font-semibold">{hospital.name}</p>
              <p className="text-xs text-muted-foreground">{hospital.address}</p>
              <Link href={`/hospitals/${hospital.id}`} className="inline-block pt-1 text-sm text-primary hover:underline">
                Открыть центр
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {vehiclePoints.map(({ arrival, coordinates }) => (
        <CircleMarker
          key={arrival.emergency_call_id}
          center={coordinates}
          radius={8}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: arrival.location_is_fresh ? "#10b981" : "#f59e0b",
            fillOpacity: 1,
          }}
        >
          <Popup closeButton={false}>
            <div className="min-w-44 space-y-1">
              <p className="font-semibold">Машина {arrival.car_number}</p>
              <p className="text-xs text-muted-foreground">Направляется в {arrival.hospital_name}</p>
              <p className="text-xs text-muted-foreground">
                Геопозиция {arrival.location_is_fresh ? "актуальна" : "устарела"}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

function OpenFreeMapLayer() {
  const map = useMap();
  const { resolvedTheme } = useTheme();
  const styleUrl = resolvedTheme === "dark" ? darkMapStyleUrl : mapStyleUrl;

  useEffect(() => {
    setWorkerUrl(mapWorkerUrl);

    const layer = maplibreGL({
      style: styleUrl,
      attributionControl: false,
      interactive: false,
    }).addTo(map);

    map.attributionControl.addAttribution(mapAttribution);

    return () => {
      map.attributionControl.removeAttribution(mapAttribution);
      map.removeLayer(layer);
    };
  }, [map, styleUrl]);

  return null;
}

function FitPoints({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(points as LatLngBoundsExpression, {
      padding: [48, 48],
      maxZoom: 14,
    });
  }, [map, points]);

  return null;
}
