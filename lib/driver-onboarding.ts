'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * Haydovchi arizasini tasdiqlashda admin sessiyasini buzmaslik uchun
 * alohida (sessiyasiz) Supabase klient yaratadi.
 */
export function createEphemeralAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Telefon raqamini sintetik emailga aylantiradi (masalan:
 * +998 90 123 45 67 → 998901234567@drivers.karvonboshi.uz).
 * Haydovchilar tizimga telefon + parol orqali kiradi.
 */
export function phoneToSyntheticEmail(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@drivers.karvonboshi.uz`;
}

/** Telefon raqamini +998 XX XXX XX XX formatiga keltiradi */
export function formatUzPhone(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  if (d.length !== 9) return raw;
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** Ariza holati bo'yicha ochiq Supabase so'rovi uchun jadval nomi */
export const DRIVER_APPLICATIONS_TABLE = 'driver_applications';
