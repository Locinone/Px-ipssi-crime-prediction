// src/components/MapView.jsx
import React, { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/* ------------------------------------------------------------------
   Correctif “Marker” : enregistre les vraies URLs des icônes.
   Sinon, Leaflet ne trouve pas les PNG dans un bundle React et affiche
   le texte alternatif « Marker ».
------------------------------------------------------------------- */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

/* ─── Informe le parent du bbox actuel ─────────────────────────── */
function BoundsReporter({ onBoundsChanged }) {
  const map = useMap();
  useEffect(() => {
    if (!onBoundsChanged) return;
    const report = () => {
      const b = map.getBounds();
      onBoundsChanged([
        b.getWest(), b.getSouth(),
        b.getEast(), b.getNorth(),
      ]);
    };
    report();                       // premier report
    map.on("moveend zoomend", report);
    return () => map.off("moveend zoomend", report);
  }, [map, onBoundsChanged]);
  return null;
}

/* ─── Centre la carte quand `center` change ─────────────────────── */
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center?.length === 2) {
      map.flyTo(center, 16, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function MapView({
  geojson,
  mode,
  onBoundsChanged,
  searchCenter,
}) {
  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsReporter onBoundsChanged={onBoundsChanged} />
      <MapUpdater center={searchCenter} />

      {mode === "Clusters" ? (
        <MarkerClusterGroup
          chunkedLoading
          chunkDelay={100}
          removeOutsideVisibleBounds
          showCoverageOnHover
          singleMarkerMode            /* bulle “1” lorsqu’un seul point */
        >
          <GeoJSON data={geojson} />
        </MarkerClusterGroup>
      ) : (
        <GeoJSON data={geojson} />
      )}
    </MapContainer>
  );
}
