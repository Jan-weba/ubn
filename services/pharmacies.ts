// src/services/pharmacies.ts
// Placeholder API service for pharmacy location data
// TODO: Replace mock data with real API calls when backend /api/pharmacies/locations is ready

import { MOCK_PHARMACIES, PharmacyLocation } from '@/features/map/pharmacyData';
import { api } from '@/lib/api';

export interface PharmacyLocationResponse {
  pharmacies: PharmacyLocation[];
  total: number;
}

/**
 * Fetch all pharmacy locations for the map
 * TODO: Uncomment real API call and remove mock return
 */
export async function fetchPharmacyLocations(): Promise<PharmacyLocation[]> {
  try {
    const res = await api.get<PharmacyLocationResponse>('/pharmacies/locations');
    return res.data.pharmacies;
  } catch (error) {
    console.error('Error fetching global locations:', error);
    return []; // No more mock data
  }
}

/**
 * Fetch pharmacies near a given lat/lng within radiusKm
 * TODO: Backend should accept ?lat=&lng=&radius= query params
 * e.g. GET /pharmacies/nearby?lat=-1.9441&lng=30.0619&radius=5
 */
export async function fetchNearbyPharmacies(
  lat: number,
  lng: number,
  radiusKm = 5
): Promise<PharmacyLocation[]> {
  if (!lat || !lng) {
    return [];
  }
  try {
    const res = await api.get(`/pharmacies/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
    // Backend returns data in data array when successful
    return res.data?.data ?? res.data ?? [];
  } catch (error) {
    console.error('Error fetching nearby locations:', error);
    return []; // Return empty array instead of mock data so the UI doesn't show fake pharmacies
  }
}

/**
 * Fetch a single pharmacy by ID
 * TODO: Backend endpoint GET /pharmacies/:id
 */
export async function fetchPharmacyById(id: string): Promise<PharmacyLocation | null> {
  try {
    const res = await api.get(`/pharmacies/${id}`);
    return res.data?.data ?? res.data ?? null;
  } catch (error) {
    console.error('Error fetching pharmacy by ID:', error);
    return null; // Don't fall back to mock data
  }
}
