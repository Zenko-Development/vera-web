"use client";

import { useEffect, useMemo } from "react";
import type { LatLngBoundsExpression } from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import { useTheme } from "next-themes";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Polygon,
  useMap,
} from "react-leaflet";

import type {
  HospitalServiceArea,
  ServiceAreaPoint,
} from "@/entities/hospital-service-area/model/types";

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

export function ServiceAreaMap({
  boundary,
  hospitalPoint,
}: {
  boundary: ServiceAreaPoint[];
  hospitalPoint: ServiceAreaPoint | null;
}) {
  const areas = useMemo<MapArea[]>(
    () => [{ id: "preview", boundary, active: true }],
    [boundary],
  );

  return (
    <ServiceAreasMap
      areas={areas}
      hospitalPoint={hospitalPoint}
      highlightedAreaId="preview"
    />
  );
}

export function ServiceAreasOverviewMap({
  areas,
  hospitalPoint,
  highlightedAreaId,
}: {
  areas: HospitalServiceArea[];
  hospitalPoint: ServiceAreaPoint | null;
  highlightedAreaId: string | null;
}) {
  return (
    <ServiceAreasMap
      areas={areas}
      hospitalPoint={hospitalPoint}
      highlightedAreaId={highlightedAreaId}
    />
  );
}

type MapArea = Pick<HospitalServiceArea, "id" | "boundary" | "active">;

function ServiceAreasMap({
  areas,
  hospitalPoint,
  highlightedAreaId,
}: {
  areas: MapArea[];
  hospitalPoint: ServiceAreaPoint | null;
  highlightedAreaId: string | null;
}) {
  const highlightedArea = areas.find((area) => area.id === highlightedAreaId);
  const points = useMemo(() => {
    if (highlightedArea) return highlightedArea.boundary;
    const areaPoints = areas.flatMap((area) => area.boundary);
    return areaPoints.length > 0
      ? areaPoints
      : hospitalPoint
        ? [hospitalPoint]
        : [];
  }, [areas, highlightedArea, hospitalPoint]);
  const center = points[0] ?? [56.8389, 60.6057];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      className="vera-map isolate z-0 h-full w-full"
      preferCanvas
    >
      <AttributionControl position="bottomright" prefix={false} />
      <OpenFreeMapLayer />
      <FitBoundary points={points} />

      {areas.map((area) => {
        if (area.boundary.length < 4) return null;
        const highlighted = area.id === highlightedAreaId;
        const muted = Boolean(highlightedAreaId) && !highlighted;

        return (
          <Polygon
            key={area.id}
            positions={area.boundary}
            pathOptions={{
              color: highlighted ? "#009fe8" : "#33bbff",
              weight: highlighted ? 3 : 1.5,
              fillColor: "#33bbff",
              fillOpacity: highlighted ? 0.3 : muted ? 0.04 : 0.14,
              opacity: muted ? 0.25 : 1,
              dashArray: area.active ? undefined : "6 5",
            }}
          />
        );
      })}

      {hospitalPoint && (
        <CircleMarker
          center={hospitalPoint}
          radius={7}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#33bbff",
            fillOpacity: 1,
          }}
        />
      )}
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

function FitBoundary({ points }: { points: ServiceAreaPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      map.invalidateSize();
      if (points.length === 0) return;
      if (points.length === 1) {
        map.setView(points[0], 12);
        return;
      }
      map.fitBounds(points as LatLngBoundsExpression, {
        padding: [28, 28],
        maxZoom: 14,
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [map, points]);

  return null;
}
