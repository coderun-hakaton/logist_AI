/**
 * Karvonboshi backend (FastAPI) bilan ishlash uchun tipli fetch qatlami.
 * Barcha so'rovlar nisbiy /api yo'li orqali Next.js rewrite bilan uzatiladi.
 */

export interface DriverApplication {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string | null;
  city: string | null;
  experience_years: number | null;
  has_vehicle: boolean;
  car_brand: string | null;
  car_plate: string | null;
  capacity_kg: number | null;
  license_categories: string | null;
  license_image_url: string | null;
  tech_passport_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  driver_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverApplicationCreate {
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  city?: string | null;
  experience_years?: number | null;
  has_vehicle: boolean;
  car_brand?: string | null;
  car_plate?: string | null;
  capacity_kg?: number | null;
  license_categories?: string | null;
  license_image_url?: string | null;
  tech_passport_image_url?: string | null;
}

export interface ReviewRequest {
  status: 'approved' | 'rejected';
  reviewed_by?: string | null;
  driver_id?: string | null;
  rejection_reason?: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });

  if (!res.ok) {
    let message = `So'rov xatosi (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') message = body.detail;
    } catch {
      // javob JSON emas — standart xabar ishlatiladi
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string) => request<T>(path);

export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

// ---- Haydovchi arizalari ----

export const createDriverApplication = (payload: DriverApplicationCreate) =>
  apiPost<DriverApplication>('/driver-applications', payload);

export const listDriverApplications = () =>
  apiGet<DriverApplication[]>('/driver-applications');

export const reviewDriverApplication = (id: string, payload: ReviewRequest) =>
  apiPatch<DriverApplication>(`/driver-applications/${id}`, payload);
