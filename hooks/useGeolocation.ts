// src/hooks/useGeolocation.ts
// Hook to request and track the browser's Geolocation API

'use client';

import { useState, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error' | 'unsupported';

export interface GeolocationState {
  status: GeolocationStatus;
  coords: [number, number] | null; // [latitude, longitude]
  error: string | null;
  requestLocation: () => void;
}

export function useGeolocation(): GeolocationState {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setStatus('unsupported');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.latitude, position.coords.longitude]);
        setStatus('success');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setError('Location access was denied. Please enable it in browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('error');
          setError('Location information is unavailable.');
        } else if (err.code === err.TIMEOUT) {
          setStatus('error');
          setError('Location request timed out. Please try again.');
        } else {
          setStatus('error');
          setError('An unknown error occurred getting your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  return { status, coords, error, requestLocation };
}
