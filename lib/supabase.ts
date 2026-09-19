'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase klienti.
 *
 * Diqqat: generik `Database` tipi ataylab berilmagan — supabase-js 2.x
 * `Insert`/`Update` tiplarini qat'iy tekshiradi va `Partial<Row>` bilan
 * `never` xatosini beradi. Jadval qatorlari tiplari (`Order`, `Vehicle`,
 * `Profile`, `DriverApplication` va h.k.) `@/types/database` dan olinib,
 * so'rov natijalariga qo'lda qo'llaniladi.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseServer = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
};
