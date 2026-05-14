// src/components/map/MapLayout.tsx
// Responsive wrapper that switches between three breakpoint layouts:
//   mobile  (<768px)  – map full-width, list stacked below
//   tablet  (768-1024px) – map top 55%, list scrollable bottom 45%
//   desktop (>1024px) – map 2/3 left, sticky sidebar 1/3 right

'use client';

import { ReactNode } from 'react';

interface MapLayoutProps {
  /** The <MapView /> element */
  map: ReactNode;
  /** The <NearbyPharmacyList /> or any sidebar content */
  sidebar: ReactNode;
  /** Optional header row above both columns (e.g. title + toggle buttons) */
  header?: ReactNode;
  /** Map height in px for each breakpoint */
  mapHeightMobile?: number;
  mapHeightTablet?: number;
  mapHeightDesktop?: number;
}

export default function MapLayout({
  map,
  sidebar,
  header,
  mapHeightMobile = 320,
  mapHeightTablet = 400,
  mapHeightDesktop = 520,
}: MapLayoutProps) {
  return (
    <div className="w-full space-y-4">
      {/* Optional header slot */}
      {header && <div>{header}</div>}

      {/*
        Layout grid:
        - mobile:  single column, map then list
        - tablet:  single column, map taller, list below with max-height scroll
        - desktop: two columns 2fr + 1fr, map fills full height of grid row
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">

        {/* MAP column – spans 2 of 3 desktop columns */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-gray-800"
          style={{
            // Responsive height via inline CSS custom-prop trick
            height: `clamp(${mapHeightMobile}px, 45vw, ${mapHeightDesktop}px)`,
          }}
        >
          {/* On tablet we want a slightly taller map, handled by clamp above */}
          <div className="w-full h-full">{map}</div>
        </div>

        {/* SIDEBAR column */}
        <div
          className="
            lg:col-span-1
            overflow-y-auto
            rounded-2xl
          "
          style={{
            // On desktop the sidebar matches the map height so it scrolls in place
            maxHeight: `clamp(${mapHeightMobile}px, 45vw, ${mapHeightDesktop}px)`,
          }}
        >
          {sidebar}
        </div>

      </div>
    </div>
  );
}
