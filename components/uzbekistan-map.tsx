'use client';

import { useMemo } from 'react';
import { latLngToSvg, uzbekistanCities, UZBEKISTAN_SVG_PATH, accidentZones } from '@/lib/uzbekistan-data';
import { Waypoint, RouteData } from '@/types/database';
import { cn } from '@/lib/utils';

interface UzbekistanMapProps {
  waypoints?: Waypoint[];
  routes?: RouteData[];
  showCities?: boolean;
  showAccidentZones?: boolean;
  highlightRoute?: boolean;
  className?: string;
  interactive?: boolean;
  onWaypointClick?: (wp: Waypoint) => void;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;

export function UzbekistanMap({
  waypoints = [],
  routes = [],
  showCities = true,
  showAccidentZones = false,
  highlightRoute = false,
  className,
  interactive = false,
  onWaypointClick,
}: UzbekistanMapProps) {
  const cityPoints = useMemo(
    () => uzbekistanCities.map((c) => ({ ...c, ...latLngToSvg(c.lat, c.lng, MAP_WIDTH, MAP_HEIGHT) })),
    []
  );

  const waypointPoints = useMemo(
    () => waypoints.map((wp) => ({ ...wp, ...latLngToSvg(wp.lat, wp.lng, MAP_WIDTH, MAP_HEIGHT) })),
    [waypoints]
  );

  const accidentPoints = useMemo(
    () => accidentZones.map((z) => ({ ...z, ...latLngToSvg(z.lat, z.lng, MAP_WIDTH, MAP_HEIGHT) })),
    []
  );

  const routePaths = useMemo(() => {
    return routes.map((route, idx) => {
      const pts = route.waypoints.map((wp) => latLngToSvg(wp.lat, wp.lng, MAP_WIDTH, MAP_HEIGHT));
      const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const color = idx === 0 ? 'hsl(var(--primary))' : `hsl(var(--muted-foreground))`;
      return { path, color, route, opacity: idx === 0 ? 1 : 0.4 };
    });
  }, [routes]);

  const waypointPath = useMemo(() => {
    if (waypoints.length < 2) return '';
    return waypointPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [waypointPoints]);

  return (
    <div className={cn('relative w-full h-full bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-secondary/20 dark:to-background rounded-lg overflow-hidden', className)}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid)" />

        {/* Uzbekistan outline */}
        <path
          d={UZBEKISTAN_SVG_PATH}
          fill="hsl(var(--accent) / 0.15)"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Route paths */}
        {routePaths.map((rp, idx) => (
          <g key={idx}>
            <path
              d={rp.path}
              fill="none"
              stroke={rp.color}
              strokeWidth={idx === 0 ? 4 : 2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={rp.opacity}
              strokeDasharray={idx === 0 ? '0' : '8 4'}
            />
            {idx === 0 && (
              <path
                d={rp.path}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}
          </g>
        ))}

        {/* Direct waypoint path */}
        {waypointPath && routePaths.length === 0 && (
          <path
            d={waypointPath}
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
        )}

        {/* City markers */}
        {showCities && cityPoints.map((city) => (
          <g key={city.name}>
            <circle
              cx={city.x}
              cy={city.y}
              r={city.isMajor ? 5 : 3}
              fill="hsl(var(--muted-foreground) / 0.4)"
              stroke="hsl(var(--background))"
              strokeWidth="1.5"
            />
            <text
              x={city.x}
              y={city.y - (city.isMajor ? 10 : 8)}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: city.isMajor ? '11px' : '9px', fontWeight: city.isMajor ? 600 : 400 }}
            >
              {city.name}
            </text>
          </g>
        ))}

        {/* Accident zones */}
        {showAccidentZones && accidentPoints.map((zone, idx) => (
          <g key={idx}>
            <circle
              cx={zone.x}
              cy={zone.y}
              r={zone.risk * 2}
              fill="hsl(var(--destructive) / 0.15)"
              stroke="hsl(var(--destructive) / 0.4)"
              strokeWidth="1"
            />
            <circle cx={zone.x} cy={zone.y} r="3" fill="hsl(var(--destructive))" />
          </g>
        ))}

        {/* Waypoint markers */}
        {waypointPoints.map((wp, idx) => {
          const isOrigin = wp.type === 'origin';
          const isDest = wp.type === 'destination';
          const isRestStop = wp.type === 'rest_stop';
          const color = isOrigin ? 'hsl(var(--chart-2))' : isDest ? 'hsl(var(--primary))' : isRestStop ? 'hsl(var(--warning))' : 'hsl(var(--chart-3))';
          return (
            <g
              key={idx}
              className={interactive ? 'cursor-pointer' : ''}
              onClick={() => interactive && onWaypointClick?.(wp)}
            >
              {(isOrigin || isDest) && (
                <circle cx={wp.x} cy={wp.y} r="10" fill={color} opacity="0.2" className="animate-pulse-slow" />
              )}
              <circle
                cx={wp.x}
                cy={wp.y}
                r={isOrigin || isDest ? 7 : 5}
                fill={color}
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />
              {isOrigin && <circle cx={wp.x} cy={wp.y} r="3" fill="white" />}
              <text
                x={wp.x}
                y={wp.y + (isOrigin || isDest ? 20 : 16)}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: '11px', fontWeight: 600 }}
              >
                {wp.name || wp.address}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
