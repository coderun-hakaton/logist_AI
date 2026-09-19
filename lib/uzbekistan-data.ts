// Major cities and waypoints in Uzbekistan with coordinates
export interface CityLocation {
  name: string;
  nameUz: string;
  lat: number;
  lng: number;
  region: string;
  population: number;
  isMajor: boolean;
}

export const uzbekistanCities: CityLocation[] = [
  { name: 'Tashkent', nameUz: 'Toshkent', lat: 41.2995, lng: 69.2401, region: 'Tashkent', population: 2500000, isMajor: true },
  { name: 'Samarkand', nameUz: 'Samarqand', lat: 39.6542, lng: 66.9597, region: 'Samarkand', population: 500000, isMajor: true },
  { name: 'Bukhara', nameUz: 'Buxoro', lat: 39.7747, lng: 64.4286, region: 'Bukhara', population: 280000, isMajor: true },
  { name: 'Andijan', nameUz: 'Andijon', lat: 40.7821, lng: 72.3442, region: 'Andijan', population: 450000, isMajor: true },
  { name: 'Namangan', nameUz: 'Namangan', lat: 40.9983, lng: 71.6726, region: 'Namangan', population: 500000, isMajor: true },
  { name: 'Nukus', nameUz: "Nukus", lat: 42.4531, lng: 59.6103, region: 'Karakalpakstan', population: 280000, isMajor: true },
  { name: 'Fergana', nameUz: "Farg'ona", lat: 40.3864, lng: 71.7844, region: 'Fergana', population: 350000, isMajor: true },
  { name: 'Karshi', nameUz: 'Qarshi', lat: 38.8617, lng: 65.7892, region: 'Kashkadarya', population: 250000, isMajor: false },
  { name: 'Kokand', nameUz: 'Qo\'qon', lat: 40.5286, lng: 70.9481, region: 'Fergana', population: 230000, isMajor: false },
  { name: 'Termez', nameUz: 'Termiz', lat: 37.2242, lng: 67.2783, region: 'Surkhandarya', population: 140000, isMajor: false },
  { name: 'Urgench', nameUz: 'Urganch', lat: 41.5533, lng: 60.6346, region: 'Khorezm', population: 140000, isMajor: false },
  { name: 'Navoi', nameUz: 'Navoiy', lat: 40.0844, lng: 65.3792, region: 'Navoi', population: 140000, isMajor: false },
  { name: 'Jizzakh', nameUz: 'Jizzax', lat: 40.1233, lng: 67.8422, region: 'Jizzakh', population: 180000, isMajor: false },
  { name: 'Gulistan', nameUz: 'Guliston', lat: 40.5, lng: 68.7833, region: 'Syrdarya', population: 80000, isMajor: false },
  { name: 'Chirchik', nameUz: 'Chirchiq', lat: 41.4833, lng: 69.5833, region: 'Tashkent', population: 150000, isMajor: false },
  { name: 'Angren', nameUz: 'Angren', lat: 41.0167, lng: 70.0667, region: 'Tashkent', population: 120000, isMajor: false },
  { name: 'Margilan', nameUz: 'Marg\'ilon', lat: 40.4994, lng: 71.7189, region: 'Fergana', population: 200000, isMajor: false },
  { name: 'Almaty', nameUz: 'Almaty', lat: 43.2220, lng: 76.8512, region: 'Kazakhstan', population: 2000000, isMajor: false },
  { name: 'Dushanbe', nameUz: 'Dushanbe', lat: 38.5598, lng: 68.7870, region: 'Tajikistan', population: 800000, isMajor: false },
  { name: 'Moscow', nameUz: 'Moskva', lat: 55.7558, lng: 37.6173, region: 'Russia', population: 12000000, isMajor: false },
];

// Major highways with their characteristics
export interface Highway {
  id: string;
  name: string;
  nameUz: string;
  from: string;
  to: string;
  quality: number; // 0-10
  safety: number; // 0-10
  avgSpeed: number; // km/h
  tollCost: number; // soums
  hasRestStops: boolean;
}

export const uzbekistanHighways: Highway[] = [
  { id: 'm39', name: 'M-39', nameUz: 'M-39', from: 'Tashkent', to: 'Samarkand', quality: 8.5, safety: 8.0, avgSpeed: 80, tollCost: 0, hasRestStops: true },
  { id: 'm37', name: 'M-37', nameUz: 'M-37', from: 'Samarkand', to: 'Bukhara', quality: 7.5, safety: 7.5, avgSpeed: 75, tollCost: 0, hasRestStops: true },
  { id: 'a380', name: 'A-380', nameUz: 'A-380', from: 'Bukhara', to: 'Nukus', quality: 6.0, safety: 6.5, avgSpeed: 65, tollCost: 0, hasRestStops: false },
  { id: 'a373', name: 'A-373', nameUz: 'A-373', from: 'Tashkent', to: 'Andijan', quality: 7.0, safety: 7.0, avgSpeed: 70, tollCost: 0, hasRestStops: true },
  { id: 'm34', name: 'M-34', nameUz: 'M-34', from: 'Tashkent', to: 'Gulistan', quality: 8.0, safety: 8.5, avgSpeed: 85, tollCost: 0, hasRestStops: true },
  { id: 'm41', name: 'M-41', nameUz: 'M-41', from: 'Samarkand', to: 'Termez', quality: 5.5, safety: 6.0, avgSpeed: 60, tollCost: 0, hasRestStops: false },
  { id: 'p119', name: 'P-119', nameUz: 'P-119', from: 'Angren', to: 'Kokand', quality: 5.0, safety: 5.5, avgSpeed: 55, tollCost: 0, hasRestStops: false },
];

// Uzbekistan bounding box for map projections
export const UZBEKISTAN_BOUNDS = {
  minLat: 37.0,
  maxLat: 45.5,
  minLng: 56.0,
  maxLng: 73.0,
  center: { lat: 41.0, lng: 64.5 },
};

// SVG path data for Uzbekistan outline (simplified for map rendering)
export const UZBEKISTAN_SVG_PATH = "M 200 80 L 280 70 L 350 75 L 400 90 L 420 110 L 440 105 L 460 120 L 480 115 L 500 130 L 520 125 L 530 140 L 510 155 L 490 170 L 470 175 L 450 190 L 430 200 L 400 210 L 380 225 L 360 240 L 340 250 L 320 245 L 300 255 L 280 260 L 260 255 L 240 265 L 220 260 L 200 255 L 180 245 L 160 235 L 140 225 L 120 215 L 100 200 L 80 185 L 70 165 L 80 145 L 100 130 L 120 120 L 140 110 L 160 100 L 180 90 Z";

// Known accident-prone zones
export const accidentZones = [
  { lat: 40.5, lng: 68.8, name: 'Gulistan Junction', risk: 7 },
  { lat: 41.0, lng: 70.0, name: 'Angren Pass', risk: 8 },
  { lat: 39.6, lng: 66.9, name: 'Samarkand Interchange', risk: 5 },
  { lat: 40.1, lng: 67.8, name: 'Jizzakh Crossroads', risk: 6 },
  { lat: 40.8, lng: 72.3, name: 'Andijan Approach', risk: 6 },
];

// Fuel prices (soums per liter)
export const FUEL_PRICES = {
  diesel: 18500,
  petrol: 16000,
  gas: 12000,
  electric: 8000,
};

// Driver wage per hour (soums)
export const DRIVER_WAGE_PER_HOUR = 50000;

// Haversine distance calculation
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest city to a coordinate
export function findNearestCity(lat: number, lng: number): CityLocation {
  let nearest = uzbekistanCities[0];
  let minDist = Infinity;
  for (const city of uzbekistanCities) {
    const dist = calculateDistance(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  return nearest;
}

// Convert lat/lng to SVG coordinates for map rendering
export function latLngToSvg(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
  const x = ((lng - UZBEKISTAN_BOUNDS.minLng) / (UZBEKISTAN_BOUNDS.maxLng - UZBEKISTAN_BOUNDS.minLng)) * width;
  const y = ((UZBEKISTAN_BOUNDS.maxLat - lat) / (UZBEKISTAN_BOUNDS.maxLat - UZBEKISTAN_BOUNDS.minLat)) * height;
  return { x, y };
}
