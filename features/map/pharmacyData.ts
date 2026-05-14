// src/features/map/pharmacyData.ts
// Mock pharmacy data for triangulation feature
// TODO: Replace with API call to /api/pharmacies/locations when backend is ready

export interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  status: 'OPEN' | 'CLOSED';
  distance?: number; // km from user – populated at runtime
  isActive: boolean;
  rating?: number;
  hours: string;
  region: string;
}

export const MOCK_PHARMACIES: PharmacyLocation[] = [
  {
    id: 'ph-001',
    name: 'Kigali Central Pharmacy',
    address: 'KN 5 Rd, Kigali City Tower, Nyarugenge',
    latitude: -1.9441,
    longitude: 30.0619,
    phone: '+250 788 100 001',
    status: 'OPEN',
    isActive: true,
    rating: 4.8,
    hours: '08:00 – 22:00',
    region: 'Kigali',
  },
  {
    id: 'ph-002',
    name: 'Remera HealthPlus Pharmacy',
    address: 'KG 11 Ave, Remera, Gasabo',
    latitude: -1.9558,
    longitude: 30.1127,
    phone: '+250 788 100 002',
    status: 'OPEN',
    isActive: true,
    rating: 4.5,
    hours: '07:30 – 21:00',
    region: 'Kigali',
  },
  {
    id: 'ph-003',
    name: 'Kimironko MedPlus',
    address: 'KG 15 Ave, Kimironko, Gasabo',
    latitude: -1.9364,
    longitude: 30.1163,
    phone: '+250 788 100 003',
    status: 'CLOSED',
    isActive: true,
    rating: 4.2,
    hours: '08:00 – 20:00',
    region: 'Kigali',
  },
  {
    id: 'ph-004',
    name: 'Nyamirambo Family Pharmacy',
    address: 'KN 48 St, Nyamirambo, Nyarugenge',
    latitude: -1.9786,
    longitude: 30.0388,
    phone: '+250 788 100 004',
    status: 'OPEN',
    isActive: true,
    rating: 4.6,
    hours: '08:00 – 22:00',
    region: 'Kigali',
  },
  {
    id: 'ph-005',
    name: 'Gikondo Express Pharmacy',
    address: 'KK 15 Rd, Gikondo, Kicukiro',
    latitude: -1.9897,
    longitude: 30.0703,
    phone: '+250 788 100 005',
    status: 'OPEN',
    isActive: true,
    rating: 4.3,
    hours: '07:00 – 23:00',
    region: 'Kigali',
  },
  {
    id: 'ph-006',
    name: 'Butare City Pharmacy',
    address: 'NB 3 Ave, Huye District',
    latitude: -2.5976,
    longitude: 29.7395,
    phone: '+250 788 100 006',
    status: 'OPEN',
    isActive: true,
    rating: 4.1,
    hours: '08:00 – 20:00',
    region: 'Southern Province',
  },
  {
    id: 'ph-007',
    name: 'Musanze Northern Pharma',
    address: 'MZ 7 Rd, Musanze District',
    latitude: -1.4993,
    longitude: 29.6345,
    phone: '+250 788 100 007',
    status: 'CLOSED',
    isActive: false,
    rating: 3.9,
    hours: '08:00 – 19:00',
    region: 'Northern Province',
  },
  {
    id: 'ph-008',
    name: 'Rubavu Lake View Pharmacy',
    address: 'RB 2 Ave, Rubavu District, Gisenyi',
    latitude: -1.7006,
    longitude: 29.2568,
    phone: '+250 788 100 008',
    status: 'OPEN',
    isActive: true,
    rating: 4.4,
    hours: '08:00 – 21:00',
    region: 'Western Province',
  },
  {
    id: 'ph-009',
    name: 'Kacyiru Premium Pharmacy',
    address: 'KG 3 Ave, Kacyiru, Gasabo',
    latitude: -1.9312,
    longitude: 30.0886,
    phone: '+250 788 100 009',
    status: 'OPEN',
    isActive: true,
    rating: 4.9,
    hours: '24 Hours',
    region: 'Kigali',
  },
  {
    id: 'ph-010',
    name: 'Kibagabaga Health Pharmacy',
    address: 'KG 32 Ave, Kibagabaga, Gasabo',
    latitude: -1.9185,
    longitude: 30.1023,
    phone: '+250 788 100 010',
    status: 'OPEN',
    isActive: true,
    rating: 4.7,
    hours: '07:00 – 22:00',
    region: 'Kigali',
  },
];

export const DEFAULT_CENTER: [number, number] = [-1.9441, 30.0619]; // Kigali
export const DEFAULT_ZOOM = 13;
export const ADMIN_DEFAULT_ZOOM = 8;
