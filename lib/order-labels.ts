import { OrderStatus, CargoType, VehicleType, FuelType } from '@/types/database';

export const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Kutilmoqda', color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  assigned: { label: 'Biriktirildi', color: 'text-blue-800 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  in_transit: { label: "Yo'lda", color: 'text-indigo-800 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  delivered: { label: 'Yetkazildi', color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  cancelled: { label: 'Bekor qilindi', color: 'text-rose-800 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  delayed: { label: 'Kechikkan', color: 'text-orange-800 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

export const cargoTypeLabels: Record<CargoType, string> = {
  general: 'Oddiy yuk',
  perishable: 'Tez buziluvchi',
  fragile: "Mo'rt yuk",
  hazardous: 'Xavfli yuk (ADR)',
};

export const vehicleTypeLabels: Record<VehicleType, string> = {
  truck: 'Yuk mashinasi',
  van: 'Furgon',
  refrigerated: 'Refrijerator',
  semi: 'Yarim tirkama',
  container: 'Konteyner tashuvchi',
};

export const fuelTypeLabels: Record<FuelType, string> = {
  diesel: 'Dizel',
  petrol: 'Benzin',
  gas: 'Metan (CNG)',
  electric: 'Elektr',
};
