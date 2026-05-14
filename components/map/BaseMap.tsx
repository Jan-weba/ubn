'use client';

/**
 * BaseMap — shared reusable map component (coordinate with Daniel)
 *
 * Uses Leaflet loaded dynamically (no SSR) via a useEffect CDN injection.
 * Both PharmacyOwnerMap and BranchManagerMap extend this component via props.
 *
 * Props:
 *   markers        – array of MapMarker objects to render
 *   triangulate    – if true, draws lines connecting all markers
 *   centerLat/Lng  – initial map center (defaults to first marker)
 *   zoom           – initial zoom level
 *   onMarkerClick  – callback when a marker pin is clicked
 *   height         – CSS height string (default '500px')
 *   className      – extra Tailwind classes on the wrapper
 */

import { useEffect, useRef, useState } from 'react';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type: 'own' | 'competitor' | 'hq' | 'sibling';
  status?: string;
  meta?: Record<string, any>;
}

interface BaseMapProps {
  markers: MapMarker[];
  triangulate?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
  className?: string;
}

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';
const AMBER = '#F59E0B';
const RED = '#EF4444';

const MARKER_COLORS: Record<MapMarker['type'], string> = {
  own:        TEAL,
  hq:         NAVY,
  sibling:    '#6366F1',
  competitor: RED,
};

declare global {
  interface Window {
    L: any;
    _leafletLoaded: boolean;
  }
}

function loadLeaflet(): Promise<void> {
  if (window._leafletLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    // CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      window._leafletLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

function createPinSvg(color: string, size = 36): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.3}" viewBox="0 0 36 47">
      <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/></filter>
      <ellipse cx="18" cy="44" rx="6" ry="3" fill="rgba(0,0,0,0.18)"/>
      <path d="M18 2C10.268 2 4 8.268 4 16c0 10 14 28 14 28S32 26 32 16C32 8.268 25.732 2 18 2z"
        fill="${color}" filter="url(#s)"/>
      <circle cx="18" cy="16" r="6" fill="white" fill-opacity="0.9"/>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export default function BaseMap({
  markers,
  triangulate = false,
  centerLat,
  centerLng,
  zoom = 13,
  onMarkerClick,
  height = '500px',
  className = '',
}: BaseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  // Load Leaflet + init map
  useEffect(() => {
    if (!containerRef.current) return;

    loadLeaflet()
      .then(() => {
        const L = window.L;
        if (mapRef.current) return; // already inited

        const lat = centerLat ?? markers[0]?.lat ?? -1.9441;
        const lng = centerLng ?? markers[0]?.lng ?? 30.0619;

        const map = L.map(containerRef.current!, {
          center: [lat, lng],
          zoom,
          zoomControl: false,
        });

        // Tile layer — CartoDB Positron (clean, no API key)
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 19,
          }
        ).addTo(map);

        // Custom zoom control (bottom-right)
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapRef.current = map;
        setReady(true);
      })
      .catch(() => setError(true));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers + triangulation lines when data or ready state changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;

    // Clear existing
    markersRef.current.forEach(m => m.remove());
    polylinesRef.current.forEach(p => p.remove());
    markersRef.current = [];
    polylinesRef.current = [];

    // Add markers
    markers.forEach((m) => {
      const color = MARKER_COLORS[m.type] ?? TEAL;
      const icon = L.icon({
        iconUrl: createPinSvg(color),
        iconSize: [36, 47],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44],
      });

      const leafletMarker = L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:160px">
            <p style="font-weight:700;color:${color};margin:0 0 2px">${m.label}</p>
            ${m.sublabel ? `<p style="font-size:12px;color:#6B7280;margin:0 0 4px">${m.sublabel}</p>` : ''}
            ${m.status ? `<span style="font-size:11px;background:${color}22;color:${color};padding:2px 8px;border-radius:99px;font-weight:600">${m.status}</span>` : ''}
          </div>`,
          { maxWidth: 220, className: 'evuze-popup' }
        );

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(m));
      }

      markersRef.current.push(leafletMarker);
    });

    // Triangulation lines
    if (triangulate && markers.length >= 2) {
      const latlngs = markers.map(m => [m.lat, m.lng]);
      // Draw line from each point to every other (triangulation mesh)
      for (let i = 0; i < latlngs.length; i++) {
        for (let j = i + 1; j < latlngs.length; j++) {
          const line = L.polyline([latlngs[i], latlngs[j]], {
            color: NAVY,
            weight: 1.5,
            opacity: 0.35,
            dashArray: '6 6',
          }).addTo(map);
          polylinesRef.current.push(line);
        }
      }
    }

    // Fit bounds to all markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], zoom);
    }
  }, [ready, markers, triangulate]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-gray-400">Map could not be loaded</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-100 ${className}`} style={{ height }}>
      {/* Leaflet container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: 'transparent' }} />
            <p className="text-xs text-gray-400 font-medium">Loading map…</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {ready && markers.length > 0 && (
        <div className="absolute bottom-10 left-3 z-1000 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm px-3 py-2 space-y-1.5">
          {Object.entries(MARKER_COLORS).map(([type, color]) => {
            const hasType = markers.some(m => m.type === type);
            if (!hasType) return null;
            const labels: Record<string, string> = { own: 'This branch', hq: 'HQ', sibling: 'Sibling branch', competitor: 'Competitor' };
            return (
              <div key={type} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600">{labels[type]}</span>
              </div>
            );
          })}
          {triangulate && (
            <div className="flex items-center gap-2 pt-0.5 border-t border-gray-100 mt-0.5">
              <span className="w-5 border-t border-dashed shrink-0" style={{ borderColor: NAVY, opacity: 0.5 }} />
              <span className="text-xs text-gray-500">Triangulation</span>
            </div>
          )}
        </div>
      )}

      {/* Popup styling injected globally */}
      <style>{`
        .evuze-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          border: 1px solid #F3F4F6 !important;
          padding: 0 !important;
        }
        .evuze-popup .leaflet-popup-content {
          margin: 12px 14px !important;
        }
        .evuze-popup .leaflet-popup-tip-container { display: none; }
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          border: 1px solid #E5E7EB !important;
          color: #374151 !important;
          font-weight: 600 !important;
        }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important; border-radius: 10px !important; overflow: hidden; }
      `}</style>
    </div>
  );
}
