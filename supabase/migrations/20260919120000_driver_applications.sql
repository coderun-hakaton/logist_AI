/*
# Karvonboshi — Haydovchi arizalari (driver onboarding)

Yangi jadval: driver_applications
  - Ochiq sahifa (/driver-apply) orqali haydovchilar ariza topshiradi (anon INSERT).
  - Admin/dispetcher /dashboard/drivers sahifasida ko'rib chiqadi (SELECT/UPDATE).
  - Tasdiqlanganda haydovchi uchun sintetik email bilan auth akkaunt yaratiladi.

Qo'shimcha: vehicles jadvaliga "brand" ustuni qo'shiladi.
Storage: "driver-docs" bucket — guvohnoma va tex pasport nusxalari uchun.

Ishga tushirish: Supabase Dashboard → SQL Editor → shu fayl mazmunini ishga tushiring.
*/

-- ==============================
-- 1. DRIVER APPLICATIONS JADVALI
-- ==============================
CREATE TABLE IF NOT EXISTS driver_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  password text,
  city text,
  experience_years int,
  has_vehicle boolean NOT NULL DEFAULT true,
  car_brand text,
  car_plate text,
  capacity_kg int,
  license_categories text,
  license_image_url text,
  tech_passport_image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

-- Hammalar (anon ham) ariza yuborishi mumkin
DROP POLICY IF EXISTS "driver_applications_insert_anon" ON driver_applications;
CREATE POLICY "driver_applications_insert_anon" ON driver_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Faqat admin/dispetcher barcha arizalarni ko'radi va boshqaradi
DROP POLICY IF EXISTS "driver_applications_select_staff" ON driver_applications;
CREATE POLICY "driver_applications_select_staff" ON driver_applications
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
    OR driver_id = auth.uid()
  );

DROP POLICY IF EXISTS "driver_applications_update_staff" ON driver_applications;
CREATE POLICY "driver_applications_update_staff" ON driver_applications
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );

CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_phone ON driver_applications(phone);

-- updated_at triggeri
DROP TRIGGER IF EXISTS trigger_driver_applications_updated ON driver_applications;
CREATE TRIGGER trigger_driver_applications_updated BEFORE UPDATE ON driver_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================
-- 2. VEHICLES: brand ustuni
-- ==============================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS brand text;

-- ==============================
-- 3. STORAGE: driver-docs bucket
-- ==============================
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-docs', 'driver-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "driver_docs_insert_anon" ON storage.objects;
CREATE POLICY "driver_docs_insert_anon" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'driver-docs');

DROP POLICY IF EXISTS "driver_docs_select_all" ON storage.objects;
CREATE POLICY "driver_docs_select_all" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'driver-docs');
