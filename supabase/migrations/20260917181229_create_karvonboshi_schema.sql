/*
# Karvonboshi Logistics Platform - Core Schema

Creates the complete database schema for an intelligent route optimization platform
for Uzbekistan logistics. Includes user profiles, vehicles, orders, routes, rest stops,
and driver feedback with full Row Level Security.

## Tables Created
1. profiles - User profile data linked to Supabase auth, with role-based access
2. vehicles - Fleet vehicles with capacity, fuel consumption, maintenance tracking
3. orders - Delivery orders with cargo details, route info, timing, cost, and status
4. routes - AI-optimized route data with 7-factor scoring
5. rest_stops - Catalog of hotels, restaurants, gas stations, parking along routes
6. feedback - Driver-submitted reports on road conditions, incidents, suggestions

## Security
- RLS enabled on all tables
- Owner-scoped policies using auth.uid() for user-specific data
- Profiles: users can read all, update only their own
- Vehicles: owner-scoped
- Orders: customer + assigned driver + admin/dispatcher access
- Routes: accessible through order ownership
- Rest stops: public read, admin write
- Feedback: owner-scoped
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'dispatcher' CHECK (role IN ('admin', 'dispatcher', 'driver', 'customer')),
  phone text,
  company text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('truck', 'van', 'refrigerated', 'semi', 'container')),
  capacity float NOT NULL DEFAULT 0,
  dimensions text,
  license_plate text NOT NULL UNIQUE,
  fuel_type text NOT NULL DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'petrol', 'gas', 'electric')),
  fuel_consumption float NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_route', 'maintenance', 'offline')),
  last_maintenance timestamptz,
  next_maintenance timestamptz,
  current_lat float,
  current_lng float,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_select_own" ON vehicles;
CREATE POLICY "vehicles_select_own" ON vehicles FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "vehicles_insert_own" ON vehicles;
CREATE POLICY "vehicles_insert_own" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "vehicles_update_own" ON vehicles;
CREATE POLICY "vehicles_update_own" ON vehicles FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "vehicles_delete_own" ON vehicles;
CREATE POLICY "vehicles_delete_own" ON vehicles FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  cargo_type text NOT NULL DEFAULT 'general' CHECK (cargo_type IN ('perishable', 'fragile', 'hazardous', 'general')),
  cargo_weight float NOT NULL DEFAULT 0,
  cargo_description text,
  is_perishable boolean NOT NULL DEFAULT false,
  is_hazardous boolean NOT NULL DEFAULT false,
  origin_address text NOT NULL,
  origin_lat float NOT NULL,
  origin_lng float NOT NULL,
  destination_address text NOT NULL,
  destination_lat float NOT NULL,
  destination_lng float NOT NULL,
  pickup_date timestamptz,
  delivery_deadline timestamptz,
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  estimated_cost float NOT NULL DEFAULT 0,
  actual_cost float,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled', 'delayed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_participants" ON orders;
CREATE POLICY "orders_select_participants" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = customer_id OR auth.uid() = driver_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );
DROP POLICY IF EXISTS "orders_insert_auth" ON orders;
CREATE POLICY "orders_insert_auth" ON orders FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher', 'customer'))
  );
DROP POLICY IF EXISTS "orders_update_participants" ON orders;
CREATE POLICY "orders_update_participants" ON orders FOR UPDATE
  TO authenticated USING (
    auth.uid() = customer_id OR auth.uid() = driver_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  ) WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = driver_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );
DROP POLICY IF EXISTS "orders_delete_admin_dispatcher" ON orders;
CREATE POLICY "orders_delete_admin_dispatcher" ON orders FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );

-- ROUTES
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  waypoints jsonb NOT NULL DEFAULT '[]',
  total_distance float NOT NULL DEFAULT 0,
  estimated_time float NOT NULL DEFAULT 0,
  estimated_cost float NOT NULL DEFAULT 0,
  safety_score float NOT NULL DEFAULT 0,
  road_quality_score float NOT NULL DEFAULT 0,
  speed_score float NOT NULL DEFAULT 0,
  cost_score float NOT NULL DEFAULT 0,
  comfort_score float NOT NULL DEFAULT 0,
  reliability_score float NOT NULL DEFAULT 0,
  food_rest_score float NOT NULL DEFAULT 0,
  overall_score float NOT NULL DEFAULT 0,
  rest_stops jsonb NOT NULL DEFAULT '[]',
  alerts jsonb DEFAULT '[]',
  route_segment_scores jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routes_select_via_order" ON routes;
CREATE POLICY "routes_select_via_order" ON routes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = routes.order_id AND (
      orders.customer_id = auth.uid() OR orders.driver_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
    ))
  );
DROP POLICY IF EXISTS "routes_insert_via_order" ON routes;
CREATE POLICY "routes_insert_via_order" ON routes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = routes.order_id AND (
      orders.customer_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
    ))
  );
DROP POLICY IF EXISTS "routes_update_via_order" ON routes;
CREATE POLICY "routes_update_via_order" ON routes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = routes.order_id AND (
      orders.customer_id = auth.uid() OR orders.driver_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
    ))
  );

-- REST_STOPS
CREATE TABLE IF NOT EXISTS rest_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hotel', 'restaurant', 'gas_station', 'parking', 'complex')),
  lat float NOT NULL,
  lng float NOT NULL,
  address text NOT NULL,
  rating float NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  price_range text CHECK (price_range IN ('$', '$$', '$$$')),
  amenities jsonb DEFAULT '[]',
  reviews jsonb DEFAULT '[]',
  verified boolean NOT NULL DEFAULT false,
  halal boolean NOT NULL DEFAULT true,
  parking_available boolean NOT NULL DEFAULT false,
  shower_available boolean NOT NULL DEFAULT false,
  wifi_available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE rest_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rest_stops_select_all" ON rest_stops;
CREATE POLICY "rest_stops_select_all" ON rest_stops FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "rest_stops_insert_admin" ON rest_stops;
CREATE POLICY "rest_stops_insert_admin" ON rest_stops FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );
DROP POLICY IF EXISTS "rest_stops_update_admin" ON rest_stops;
CREATE POLICY "rest_stops_update_admin" ON rest_stops FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('road_condition', 'incident', 'suggestion', 'rest_stop_review')),
  description text NOT NULL,
  lat float,
  lng float,
  rating float CHECK (rating >= 0 AND rating <= 5),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_select_own" ON feedback;
CREATE POLICY "feedback_select_own" ON feedback FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'dispatcher'))
  );
DROP POLICY IF EXISTS "feedback_insert_own" ON feedback;
CREATE POLICY "feedback_insert_own" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "feedback_update_own" ON feedback;
CREATE POLICY "feedback_update_own" ON feedback FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "feedback_delete_own" ON feedback;
CREATE POLICY "feedback_delete_own" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_routes_order ON routes(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_rest_stops_type ON rest_stops(type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated ON profiles;
CREATE TRIGGER trigger_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trigger_vehicles_updated ON vehicles;
CREATE TRIGGER trigger_vehicles_updated BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trigger_orders_updated ON orders;
CREATE TRIGGER trigger_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
