'use client';

/**
 * LocationPicker — reusable Leaflet/OpenStreetMap map component.
 *
 * Renders an interactive map centred on Kigali. The user can:
 *   1. Click anywhere on the map to drop a pin.
 *   2. Drag the existing pin to a new position.
 *   3. Press "Use My Location" to capture live GPS coordinates.
 *
 * Props:
 *   latitude / longitude — controlled values (can be undefined while unset)
 *   onChange(lat, lng)   — called whenever the pin moves
 *   required             — if true the outer label shows a red asterisk
 *   label                — section heading (defaults to "Pin Your Location")
 */

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
  required?: boolean;
  label?: string;
  /** Height of the map container. Defaults to "300px". */
  height?: string;
}

// Kigali city centre as the default map centre
const DEFAULT_CENTER: [number, number] = [-1.9706, 30.1044];
const DEFAULT_ZOOM = 13;

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  required = false,
  label = 'Pin Your Location',
  height = '300px',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Store Leaflet map + marker instances in refs so React doesn't re-create them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // ── Bootstrap Leaflet (client-side only) ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (leafletMapRef.current) return; // already initialised

    // Dynamic import keeps Leaflet out of the SSR bundle
    import('leaflet').then((L) => {
      // Fix default marker icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapRef.current) return;

      const initialCenter: [number, number] =
        latitude !== undefined && longitude !== undefined
          ? [latitude, longitude]
          : DEFAULT_CENTER;

      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: latitude !== undefined ? 16 : DEFAULT_ZOOM,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Place initial marker if coordinates already exist
      if (latitude !== undefined && longitude !== undefined) {
        const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
        });
        markerRef.current = marker;
      }

      // Click to place / move pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const marker = L.marker([roundedLat, roundedLng], { draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
          });
          markerRef.current = marker;
        }
        onChange(roundedLat, roundedLng);
      });

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync external lat/lng changes into the map ───────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (latitude === undefined || longitude === undefined) return;

    import('leaflet').then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
        });
        markerRef.current = marker;
      }
      map.setView([latitude, longitude], 16);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  // ── GPS handler ──────────────────────────────────────────────────────────
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange(lat, lng);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('Could not get location: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const hasPinned = latitude !== undefined && longitude !== undefined;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 disabled:opacity-50 transition-all"
        >
          {gpsLoading
            ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
            : <MapPinIcon className="w-3.5 h-3.5" />}
          {gpsLoading ? 'Getting location…' : 'Use My Location'}
        </button>
      </div>

      {/* Instruction */}
      <p className="text-xs text-gray-400">
        Click on the map to pin your exact location, or drag the pin to adjust.
      </p>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height, width: '100%', borderRadius: '0.75rem', border: hasPinned ? '2px solid #2D9B8A' : '2px solid #E5E7EB', overflow: 'hidden' }}
      />

      {/* Coordinate display */}
      {hasPinned ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
          <MapPinIcon className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-xs text-teal-700 font-medium">
            Lat: {latitude?.toFixed(6)} &nbsp;|&nbsp; Lng: {longitude?.toFixed(6)}
          </span>
          <span className="ml-auto text-xs text-teal-500">✓ Location pinned</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <MapPinIcon className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700">No location pinned yet — click the map above</span>
        </div>
      )}

      {/* GPS error */}
      {gpsError && (
        <p className="text-xs text-red-500">{gpsError}</p>
      )}
    </div>
  );
}
