// src/components/map/PharmacyMarker.tsx
// Standalone marker component — generates Leaflet DivIcon HTML strings
// Used by MapView to render per-pharmacy pins with E-Vuze branding

'use client';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';
const GRAY = '#9ca3af';

export type MarkerVariant = 'default' | 'selected' | 'inactive';

interface MarkerOptions {
  status: 'OPEN' | 'CLOSED';
  selected?: boolean;
  isActive?: boolean;
}

/**
 * Returns the HTML string used inside a Leaflet DivIcon.
 * Keeps all marker styling in one place so it's easy to update branding.
 */
export function buildMarkerHtml({ status, selected = false, isActive = true }: MarkerOptions): string {
  const isOpen = status === 'OPEN' && isActive;
  const size = selected ? 44 : 32;
  const fillColor = isOpen ? TEAL : GRAY;
  const borderColor = selected ? '#ffffff' : isOpen ? NAVY : '#6b7280';
  const shadow = selected
    ? `0 0 0 4px ${NAVY}55, 0 4px 16px rgba(0,0,0,0.4)`
    : '0 2px 8px rgba(0,0,0,0.25)';

  return `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
    ">
      <!-- Teardrop pin shape via border-radius trick -->
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${fillColor};
        border: 3px solid ${borderColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadow};
        transition: all 0.25s ease;
      "></div>
      <!-- Inner icon dot -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%) rotate(0deg);
        width: ${size * 0.35}px;
        height: ${size * 0.35}px;
        background: white;
        border-radius: 50%;
        opacity: 0.9;
      "></div>
      ${selected ? `
      <!-- Pulse ring for selected state -->
      <div style="
        position: absolute;
        inset: -6px;
        border-radius: 50% 50% 50% 0;
        border: 2px solid ${TEAL};
        transform: rotate(-45deg);
        animation: markerPulse 1.2s ease-in-out infinite;
        opacity: 0.5;
      "></div>` : ''}
    </div>
  `;
}

/**
 * Marker size tuple [width, height] in pixels.
 * Export so MapView can pass correct iconSize/iconAnchor to Leaflet.
 */
export function getMarkerSize(selected = false): [number, number] {
  const size = selected ? 44 : 32;
  return [size, size];
}

/**
 * Icon anchor — bottom-center of the teardrop tip.
 */
export function getMarkerAnchor(selected = false): [number, number] {
  const size = selected ? 44 : 32;
  return [size / 2, size];
}

// CSS to inject once for the pulse animation
export const MARKER_CSS = `
  @keyframes markerPulse {
    0%, 100% { transform: rotate(-45deg) scale(1); opacity: 0.5; }
    50%       { transform: rotate(-45deg) scale(1.4); opacity: 0; }
  }
`;
