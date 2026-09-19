// Database types matching the Supabase schema

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'customer';
export type OrderStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled' | 'delayed';
export type VehicleStatus = 'available' | 'on_route' | 'maintenance' | 'offline';
export type VehicleType = 'truck' | 'van' | 'refrigerated' | 'semi' | 'container';
export type CargoType = 'perishable' | 'fragile' | 'hazardous' | 'general';
export type FuelType = 'diesel' | 'petrol' | 'gas' | 'electric';
export type RestStopType = 'hotel' | 'restaurant' | 'gas_station' | 'parking' | 'complex';
export type FeedbackType = 'road_condition' | 'incident' | 'suggestion' | 'rest_stop_review';
export type DriverApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  type: VehicleType;
  brand: string | null;
  capacity: number;
  dimensions: string | null;
  license_plate: string;
  fuel_type: FuelType;
  fuel_consumption: number;
  status: VehicleStatus;
  last_maintenance: string | null;
  next_maintenance: string | null;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  cargo_type: CargoType;
  cargo_weight: number;
  cargo_description: string | null;
  is_perishable: boolean;
  is_hazardous: boolean;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  pickup_date: string | null;
  delivery_deadline: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteData {
  id: string;
  order_id: string;
  waypoints: Waypoint[];
  total_distance: number;
  estimated_time: number;
  estimated_cost: number;
  safety_score: number;
  road_quality_score: number;
  speed_score: number;
  cost_score: number;
  comfort_score: number;
  reliability_score: number;
  food_rest_score: number;
  overall_score: number;
  rest_stops: RestStopRecommendation[];
  alerts: RouteAlert[];
  route_segment_scores: SegmentScore[];
  created_at: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
  address: string;
  type: 'origin' | 'destination' | 'waypoint' | 'rest_stop' | 'border' | 'fuel';
  name?: string;
}

export interface RestStop {
  id: string;
  name: string;
  type: RestStopType;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  price_range: string | null;
  amenities: string[];
  reviews: any[];
  verified: boolean;
  halal: boolean;
  parking_available: boolean;
  shower_available: boolean;
  wifi_available: boolean;
  created_at: string;
}

export interface RestStopRecommendation {
  id?: string;
  name: string;
  type: RestStopType;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  price_range: string | null;
  distance_from_route: number;
  amenities: string[];
  halal: boolean;
  parking_available: boolean;
  shower_available: boolean;
  wifi_available: boolean;
}

export interface RouteAlert {
  type: 'accident' | 'construction' | 'weather' | 'road_closure' | 'border_delay' | 'traffic';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lat: number;
  lng: number;
  distance_marker: number;
}

export interface SegmentScore {
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  safety: number;
  road_quality: number;
  label: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  route_id: string | null;
  type: FeedbackType;
  description: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  image_url: string | null;
  created_at: string;
}

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
  status: DriverApplicationStatus;
  driver_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Route optimization types
export interface RouteOptimizationInput {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  cargoType: CargoType;
  cargoWeight: number;
  vehicleType: VehicleType;
  deliveryDeadline?: Date;
  budgetConstraint?: number;
  priorities: {
    safety: number;
    roadQuality: number;
    speed: number;
    cost: number;
    comfort: number;
    reliability: number;
    foodRest: number;
  };
}

export interface RouteOptimizationResult {
  route: RouteData;
  alternatives: RouteData[];
  reasoning: string;
}

// Database type map for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Partial<Vehicle>;
        Update: Partial<Vehicle>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order>;
        Update: Partial<Order>;
      };
      routes: {
        Row: RouteData;
        Insert: Partial<RouteData>;
        Update: Partial<RouteData>;
      };
      rest_stops: {
        Row: RestStop;
        Insert: Partial<RestStop>;
        Update: Partial<RestStop>;
      };
      feedback: {
        Row: Feedback;
        Insert: Partial<Feedback>;
        Update: Partial<Feedback>;
      };
      driver_applications: {
        Row: DriverApplication;
        Insert: Partial<DriverApplication>;
        Update: Partial<DriverApplication>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
