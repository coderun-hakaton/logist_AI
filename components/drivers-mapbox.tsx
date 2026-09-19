'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface DriverMapPoint {
  id: string;
  name: string;
  phone: string | null;
  licensePlate: string | null;
  vehicleBrand: string | null;
  /** 'active' — tasdiqlangan haydovchi, 'pending' — ariza kutilmoqda */
  kind: 'active' | 'pending';
  city: string | null;
  lng: number;
  lat: number;
}

interface DriversMapboxProps {
  drivers: DriverMapPoint[];
  className?: string;
}

// O'zbekiston markazi
const CENTER: [number, number] = [64.5853, 41.3775];

const MARKER_COLORS: Record<DriverMapPoint['kind'], string> = {
  active: '#16a34a',
  pending: '#f59e0b',
};

const KIND_LABELS: Record<DriverMapPoint['kind'], string> = {
  active: 'Faol haydovchi',
  pending: 'Ariza kutilmoqda',
};

function esc(value: string) {
  return value.replace(/[&<>'"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] as string)
  );
}

export default function DriversMapbox({ drivers, className }: DriversMapboxProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef(new Map<string, mapboxgl.Marker>());

  // Xaritani bir marta yaratish (Strict Mode uchun tozalash bilan)
  useEffect(() => {
    if (!container.current || map.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const m = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: CENTER,
      zoom: 5,
      attributionControl: true,
    });
    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    m.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current = m;

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      m.remove();
      map.current = null;
    };
  }, []);

  // Markerlarni ID bo'yicha solishtirib yangilash
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const incoming = new Set(drivers.map((d) => d.id));
    markers.current.forEach((marker, id) => {
      if (!incoming.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    drivers.forEach((d) => {
      const rows = [
        `<strong style="font-size:13px">${esc(d.name)}</strong>`,
        `<span style="color:#64748b;font-size:11px">${KIND_LABELS[d.kind]}</span>`,
        d.phone ? `Telefon: ${esc(d.phone)}` : null,
        d.licensePlate ? `Davlat raqami: ${esc(d.licensePlate)}` : null,
        d.vehicleBrand ? `Transport: ${esc(d.vehicleBrand)}` : null,
        d.city ? `Hudud: ${esc(d.city)}` : null,
      ].filter(Boolean);

      const html = `<div style="font-family:inherit;font-size:12px;line-height:1.6">${rows.join('<br/>')}</div>`;

      let marker = markers.current.get(d.id);
      if (!marker) {
        marker = new mapboxgl.Marker({ color: MARKER_COLORS[d.kind] })
          .setLngLat([d.lng, d.lat])
          .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(html))
          .addTo(m);
        markers.current.set(d.id, marker);
      } else {
        marker.setLngLat([d.lng, d.lat]);
        marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(html));
      }
    });
  }, [drivers]);

  // Barcha markerlarni ko'rinishga sig'dirish
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    if (drivers.length === 0) {
      m.flyTo({ center: CENTER, zoom: 5, duration: 600 });
      return;
    }

    const points = drivers.map((d) => [d.lng, d.lat] as [number, number]);
    const bounds = points
      .slice(1)
      .reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds(points[0], points[0]));
    m.fitBounds(bounds, { padding: 70, maxZoom: 9, duration: 700 });
  }, [drivers]);

  const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (tokenMissing) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Mapbox tokeni sozlanmagan. <code className="text-xs">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> ni qo&apos;shing.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={container}
      className={className ?? 'h-full w-full overflow-hidden rounded-lg'}
      aria-label="O'zbekiston haydovchilari xaritasi"
      data-testid="drivers-mapbox-container"
    />
  );
}
