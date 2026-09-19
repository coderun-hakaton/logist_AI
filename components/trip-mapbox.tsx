'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface TripPoint {
  lng: number;
  lat: number;
  label: string;
}

interface TripMapboxProps {
  origin: TripPoint;
  destination: TripPoint;
  className?: string;
}

function esc(value: string) {
  return value.replace(/[&<>'"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] as string)
  );
}

/** Bitta reys marshrutini (jo'nash → yetkazish) Mapbox'da ko'rsatadi. */
export default function TripMapbox({ origin, destination, className }: TripMapboxProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const m = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [(origin.lng + destination.lng) / 2, (origin.lat + destination.lat) / 2],
      zoom: 5,
    });
    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.current = m;

    m.on('load', () => {
      m.addSource('trip-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [origin.lng, origin.lat],
              [destination.lng, destination.lat],
            ],
          },
        },
      });

      m.addLayer({
        id: 'trip-line-layer',
        type: 'line',
        source: 'trip-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-dasharray': [2, 1.5],
        },
      });

      new mapboxgl.Marker({ color: '#16a34a' })
        .setLngLat([origin.lng, origin.lat])
        .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(
          `<strong>Jo'nash</strong><br/>${esc(origin.label)}`
        ))
        .addTo(m);

      new mapboxgl.Marker({ color: '#dc2626' })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(
          `<strong>Yetkazish</strong><br/>${esc(destination.label)}`
        ))
        .addTo(m);

      const bounds = new mapboxgl.LngLatBounds(
        [origin.lng, origin.lat],
        [origin.lng, origin.lat]
      ).extend([destination.lng, destination.lat]);
      m.fitBounds(bounds, { padding: 60, maxZoom: 9, duration: 600 });
    });

    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lng, origin.lat, destination.lng, destination.lat]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">Mapbox tokeni sozlanmagan.</p>
      </div>
    );
  }

  return (
    <div
      ref={container}
      className={className ?? 'h-full w-full overflow-hidden rounded-lg'}
      aria-label="Reys marshruti xaritasi"
      data-testid="trip-mapbox-container"
    />
  );
}
