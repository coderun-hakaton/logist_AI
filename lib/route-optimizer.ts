import {
  RouteOptimizationInput,
  RouteOptimizationResult,
  RouteData,
  Waypoint,
  RestStopRecommendation,
  RouteAlert,
  SegmentScore,
  CargoType,
  VehicleType,
} from '@/types/database';
import {
  calculateDistance,
  uzbekistanCities,
  CityLocation,
  accidentZones,
  FUEL_PRICES,
  DRIVER_WAGE_PER_HOUR,
} from '@/lib/uzbekistan-data';

// Weights for the 7 optimization factors
const DEFAULT_WEIGHTS = {
  safety: 1.0,
  roadQuality: 0.8,
  speed: 0.7,
  cost: 0.9,
  comfort: 0.6,
  reliability: 0.7,
  foodRest: 0.5,
};

// Known rest stops in Uzbekistan (mirrors DB seed data)
const KNOWN_REST_STOPS: RestStopRecommendation[] = [
  { name: 'Tashkent Truck Stop Complex', type: 'complex', lat: 41.2995, lng: 69.2401, address: 'M-39 Highway, Tashkent', rating: 4.5, price_range: '$$', distance_from_route: 2, amenities: ['parking', 'shower', 'wifi', 'restaurant', 'fuel'], halal: true, parking_available: true, shower_available: true, wifi_available: true },
  { name: 'Samarkand Route Hotel', type: 'hotel', lat: 39.6542, lng: 66.9597, address: 'M-37 Highway, Samarkand', rating: 4.2, price_range: '$$', distance_from_route: 3, amenities: ['parking', 'shower', 'wifi', 'breakfast'], halal: true, parking_available: true, shower_available: true, wifi_available: true },
  { name: 'Bukhara Oasis Rest Stop', type: 'complex', lat: 39.7747, lng: 64.4286, address: 'A-380, Bukhara', rating: 4.0, price_range: '$', distance_from_route: 1, amenities: ['parking', 'shower', 'restaurant', 'fuel'], halal: true, parking_available: true, shower_available: true, wifi_available: false },
  { name: 'Navoi Highway Diner', type: 'restaurant', lat: 40.0844, lng: 65.3792, address: 'M-37, Navoi', rating: 3.8, price_range: '$', distance_from_route: 1, amenities: ['parking', 'halal_food'], halal: true, parking_available: true, shower_available: false, wifi_available: false },
  { name: 'Karshi Truck Plaza', type: 'complex', lat: 38.8617, lng: 65.7892, address: 'M-39, Kashkadarya', rating: 4.3, price_range: '$$', distance_from_route: 2, amenities: ['parking', 'shower', 'wifi', 'fuel', 'restaurant'], halal: true, parking_available: true, shower_available: true, wifi_available: true },
  { name: 'Urgench Crossroads Hotel', type: 'hotel', lat: 41.5533, lng: 60.6346, address: 'M-39, Khorezm', rating: 3.9, price_range: '$$', distance_from_route: 3, amenities: ['parking', 'wifi', 'shower', 'restaurant'], halal: true, parking_available: true, shower_available: true, wifi_available: true },
  { name: 'Fergana Valley Stop', type: 'restaurant', lat: 40.3864, lng: 71.7844, address: 'A-373, Fergana', rating: 4.1, price_range: '$', distance_from_route: 1, amenities: ['parking', 'halal_food', 'shower'], halal: true, parking_available: true, shower_available: true, wifi_available: false },
  { name: 'Kokand Valley Inn', type: 'hotel', lat: 40.5286, lng: 70.9481, address: 'A-373, Fergana', rating: 4.0, price_range: '$$', distance_from_route: 2, amenities: ['wifi', 'shower', 'parking', 'breakfast'], halal: true, parking_available: true, shower_available: true, wifi_available: true },
  { name: 'Termez Border Stop', type: 'complex', lat: 37.2242, lng: 67.2783, address: 'M-41, Surkhandarya', rating: 3.4, price_range: '$', distance_from_route: 1, amenities: ['fuel', 'parking', 'restaurant'], halal: true, parking_available: true, shower_available: false, wifi_available: false },
  { name: 'Gulistan Highway Rest', type: 'restaurant', lat: 40.5, lng: 68.7833, address: 'M-34, Syrdarya', rating: 3.7, price_range: '$', distance_from_route: 1, amenities: ['parking', 'halal_food'], halal: true, parking_available: true, shower_available: false, wifi_available: false },
  { name: 'Jizzakh Roadside Diner', type: 'restaurant', lat: 40.1233, lng: 67.8422, address: 'M-37, Jizzakh', rating: 3.6, price_range: '$', distance_from_route: 1, amenities: ['parking', 'halal_food'], halal: true, parking_available: true, shower_available: false, wifi_available: false },
  { name: 'Chirchik Industrial Stop', type: 'gas_station', lat: 41.4833, lng: 69.5833, address: 'M-34, Tashkent Region', rating: 3.8, price_range: '$', distance_from_route: 2, amenities: ['fuel', 'parking', 'convenience_store'], halal: true, parking_available: true, shower_available: false, wifi_available: false },
];

function getVehicleFuelConsumption(type: VehicleType): number {
  const baseConsumption: Record<VehicleType, number> = {
    truck: 30,
    van: 15,
    refrigerated: 35,
    semi: 32,
    container: 34,
  };
  return baseConsumption[type] || 30;
}

function getCargoMultiplier(cargoType: CargoType): number {
  const multipliers: Record<CargoType, number> = {
    perishable: 1.15,
    fragile: 1.05,
    hazardous: 1.25,
    general: 1.0,
  };
  return multipliers[cargoType] || 1.0;
}

function getHighwayBetween(from: CityLocation, to: CityLocation): { quality: number; safety: number; avgSpeed: number } {
  // Simulate highway quality based on city importance and distance
  const isMajorRoute = from.isMajor && to.isMajor;
  const isFerganaRoute = from.region === 'Fergana' || to.region === 'Fergana';
  const isDesertRoute = from.region === 'Karakalpakstan' || to.region === 'Karakalpakstan';

  if (isDesertRoute) {
    return { quality: 5.5, safety: 6.0, avgSpeed: 60 };
  }
  if (isFerganaRoute) {
    return { quality: 6.5, safety: 7.0, avgSpeed: 68 };
  }
  if (isMajorRoute) {
    return { quality: 8.0, safety: 8.0, avgSpeed: 78 };
  }
  return { quality: 7.0, safety: 7.0, avgSpeed: 70 };
}

function findIntermediateCities(from: CityLocation, to: CityLocation): CityLocation[] {
  const allDist = calculateDistance(from.lat, from.lng, to.lat, to.lng);
  if (allDist < 200) return [];

  const candidates = uzbekistanCities.filter(
    (c) => c.name !== from.name && c.name !== to.name
  );

  const intermediates: { city: CityLocation; score: number }[] = [];
  for (const city of candidates) {
    const distFromOrigin = calculateDistance(from.lat, from.lng, city.lat, city.lng);
    const distToDest = calculateDistance(city.lat, city.lng, to.lat, to.lng);
    const directDist = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const detourRatio = (distFromOrigin + distToDest) / directDist;

    if (detourRatio < 1.25 && distFromOrigin < directDist * 0.7) {
      intermediates.push({ city, score: detourRatio });
    }
  }

  intermediates.sort((a, b) => a.score - b.score);
  return intermediates.slice(0, 2).map((i) => i.city);
}

function calculateSafetyScore(
  from: CityLocation,
  to: CityLocation,
  waypoints: Waypoint[]
): number {
  const highway = getHighwayBetween(from, to);
  let score = highway.safety;

  // Check proximity to accident zones
  for (const waypoint of waypoints) {
    for (const zone of accidentZones) {
      const dist = calculateDistance(waypoint.lat, waypoint.lng, zone.lat, zone.lng);
      if (dist < 50) {
        score -= (zone.risk / 10) * (1 - dist / 50) * 2;
      }
    }
  }

  return Math.max(0, Math.min(10, score));
}

function calculateRoadQuality(from: CityLocation, to: CityLocation): number {
  const highway = getHighwayBetween(from, to);
  return highway.quality;
}

function calculateSpeedScore(from: CityLocation, to: CityLocation, distance: number): { score: number; time: number; avgSpeed: number } {
  const highway = getHighwayBetween(from, to);
  const time = distance / highway.avgSpeed;
  // Score based on speed efficiency (higher speed = better score)
  const score = Math.min(10, (highway.avgSpeed / 90) * 10);
  return { score, time, avgSpeed: highway.avgSpeed };
}

function calculateCostScore(
  distance: number,
  time: number,
  vehicleType: VehicleType,
  cargoType: CargoType,
  budgetConstraint?: number
): { score: number; cost: number } {
  const consumption = getVehicleFuelConsumption(vehicleType) * getCargoMultiplier(cargoType);
  const fuelLiters = (distance / 100) * consumption;
  const fuelCost = fuelLiters * FUEL_PRICES.diesel;
  const driverWage = time * DRIVER_WAGE_PER_HOUR;
  const tollCost = 0;
  const totalCost = fuelCost + driverWage + tollCost;

  let score = 7;
  if (budgetConstraint && budgetConstraint > 0) {
    const ratio = totalCost / budgetConstraint;
    if (ratio < 0.5) score = 9.5;
    else if (ratio < 0.7) score = 8.5;
    else if (ratio < 0.9) score = 7;
    else if (ratio < 1.0) score = 5;
    else score = 2;
  } else {
    // Score relative to typical costs
    const costPerKm = totalCost / distance;
    if (costPerKm < 6000) score = 9;
    else if (costPerKm < 8000) score = 7.5;
    else if (costPerKm < 10000) score = 6;
    else score = 4;
  }

  return { score, cost: Math.round(totalCost) };
}

function calculateComfortScore(
  distance: number,
  restStops: RestStopRecommendation[]
): number {
  // Need a rest stop every 300-400 km
  const idealStops = Math.ceil(distance / 350);
  const actualGoodStops = restStops.filter((s) => s.rating >= 4.0).length;

  if (distance < 200) return 9;

  const stopRatio = actualGoodStops / idealStops;
  let score = 5 + stopRatio * 4;
  if (actualGoodStops === 0 && distance > 300) score = 3;

  return Math.max(0, Math.min(10, score));
}

function calculateReliabilityScore(from: CityLocation, to: CityLocation, cargoType: CargoType): number {
  const highway = getHighwayBetween(from, to);
  let score = highway.quality * 0.6 + highway.safety * 0.4;

  // Perishable goods need higher reliability
  if (cargoType === 'perishable') score -= 0.5;
  if (cargoType === 'hazardous') score -= 1.0;

  // Major routes tend to be more reliable
  if (from.isMajor && to.isMajor) score += 0.5;

  return Math.max(0, Math.min(10, score));
}

function calculateFoodRestScore(restStops: RestStopRecommendation[]): number {
  if (restStops.length === 0) return 3;

  const avgRating = restStops.reduce((sum, s) => sum + s.rating, 0) / restStops.length;
  const halalCount = restStops.filter((s) => s.halal).length;
  const halalBonus = halalCount / restStops.length;

  const score = (avgRating / 5) * 7 + halalBonus * 3;
  return Math.max(0, Math.min(10, score));
}

function findRestStopsForRoute(
  from: CityLocation,
  to: CityLocation,
  intermediates: CityLocation[]
): RestStopRecommendation[] {
  const routeCities = [from, ...intermediates, to];
  const stops: RestStopRecommendation[] = [];
  const usedStopNames = new Set<string>();

  for (const city of routeCities) {
    for (const stop of KNOWN_REST_STOPS) {
      if (usedStopNames.has(stop.name)) continue;
      const dist = calculateDistance(city.lat, city.lng, stop.lat, stop.lng);
      if (dist < 50) {
        stops.push({ ...stop, distance_from_route: Math.round(dist) });
        usedStopNames.add(stop.name);
      }
    }
  }

  // Sort by position along route
  return stops.sort((a, b) => {
    const distA = calculateDistance(from.lat, from.lng, a.lat, a.lng);
    const distB = calculateDistance(from.lat, from.lng, b.lat, b.lng);
    return distA - distB;
  });
}

function generateAlerts(
  from: CityLocation,
  to: CityLocation,
  waypoints: Waypoint[]
): RouteAlert[] {
  const alerts: RouteAlert[] = [];
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDist += calculateDistance(
      waypoints[i].lat, waypoints[i].lng,
      waypoints[i + 1].lat, waypoints[i + 1].lng
    );
  }

  // Check accident zones
  for (const waypoint of waypoints) {
    for (const zone of accidentZones) {
      const dist = calculateDistance(waypoint.lat, waypoint.lng, zone.lat, zone.lng);
      if (dist < 40) {
        const markerDist = calculateDistance(from.lat, from.lng, zone.lat, zone.lng);
        alerts.push({
          type: 'accident',
          severity: zone.risk > 6 ? 'high' : 'medium',
          description: `High accident risk zone near ${zone.name}`,
          lat: zone.lat,
          lng: zone.lng,
          distance_marker: Math.round(markerDist),
        });
      }
    }
  }

  // Weather/road condition alerts for desert routes
  if (from.region === 'Karakalpakstan' || to.region === 'Karakalpakstan') {
    alerts.push({
      type: 'weather',
      severity: 'medium',
      description: 'Possible sandstorms in Karakalpakstan region - check weather before departure',
      lat: 42.0,
      lng: 60.0,
      distance_marker: Math.round(totalDist * 0.5),
    });
  }

  // Border checkpoint alerts
  if (from.region === 'Fergana' && to.region !== 'Fergana') {
    alerts.push({
      type: 'border_delay',
      severity: 'low',
      description: 'Road checkpoint between Fergana Valley and Tashkent region - expect 15-30 min delay',
      lat: 40.9,
      lng: 70.5,
      distance_marker: 50,
    });
  }

  return alerts;
}

function generateSegmentScores(
  waypoints: Waypoint[],
  from: CityLocation,
  to: CityLocation
): SegmentScore[] {
  const segments: SegmentScore[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = waypoints[i];
    const wp2 = waypoints[i + 1];
    const midLat = (wp1.lat + wp2.lat) / 2;
    const midLng = (wp1.lng + wp2.lng) / 2;

    const nearest = uzbekistanCities.reduce((closest, city) => {
      const d = calculateDistance(midLat, midLng, city.lat, city.lng);
      return d < closest.dist ? { city, dist: d } : closest;
    }, { city: from, dist: Infinity });

    const highway = getHighwayBetween(from, nearest.city);

    segments.push({
      start_lat: wp1.lat,
      start_lng: wp1.lng,
      end_lat: wp2.lat,
      end_lng: wp2.lng,
      safety: highway.safety,
      road_quality: highway.quality,
      label: `${wp1.address} → ${wp2.address}`,
    });
  }
  return segments;
}

function buildRoute(
  from: CityLocation,
  to: CityLocation,
  intermediates: CityLocation[],
  input: RouteOptimizationInput,
  alternativeIndex: number
): RouteData {
  const routeCities = [from, ...intermediates, to];

  const waypoints: Waypoint[] = routeCities.map((city, idx) => ({
    lat: city.lat,
    lng: city.lng,
    address: city.name,
    type: idx === 0 ? 'origin' : idx === routeCities.length - 1 ? 'destination' : 'waypoint',
    name: city.name,
  }));

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < routeCities.length - 1; i++) {
    totalDistance += calculateDistance(
      routeCities[i].lat, routeCities[i].lng,
      routeCities[i + 1].lat, routeCities[i + 1].lng
    );
  }

  // Add detour factor for alternatives (slightly longer routes)
  if (alternativeIndex > 0) {
    totalDistance *= 1 + alternativeIndex * 0.12;
  }

  const { score: speedScore, time, avgSpeed } = calculateSpeedScore(from, to, totalDistance);
  const { score: costScore, cost } = calculateCostScore(
    totalDistance, time, input.vehicleType, input.cargoType, input.budgetConstraint
  );

  const restStops = findRestStopsForRoute(from, to, intermediates);
  const safetyScore = calculateSafetyScore(from, to, waypoints);
  const roadQualityScore = calculateRoadQuality(from, to);
  const comfortScore = calculateComfortScore(totalDistance, restStops);
  const reliabilityScore = calculateReliabilityScore(from, to, input.cargoType);
  const foodRestScore = calculateFoodRestScore(restStops);

  // Calculate overall weighted score
  const weights = input.priorities || DEFAULT_WEIGHTS;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const overallScore = (
    safetyScore * weights.safety +
    roadQualityScore * weights.roadQuality +
    speedScore * weights.speed +
    costScore * weights.cost +
    comfortScore * weights.comfort +
    reliabilityScore * weights.reliability +
    foodRestScore * weights.foodRest
  ) / totalWeight;

  const alerts = generateAlerts(from, to, waypoints);
  const segmentScores = generateSegmentScores(waypoints, from, to);

  return {
    id: `route-${Date.now()}-${alternativeIndex}`,
    order_id: '',
    waypoints,
    total_distance: Math.round(totalDistance * 10) / 10,
    estimated_time: Math.round(time * 10) / 10,
    estimated_cost: cost,
    safety_score: Math.round(safetyScore * 10) / 10,
    road_quality_score: Math.round(roadQualityScore * 10) / 10,
    speed_score: Math.round(speedScore * 10) / 10,
    cost_score: Math.round(costScore * 10) / 10,
    comfort_score: Math.round(comfortScore * 10) / 10,
    reliability_score: Math.round(reliabilityScore * 10) / 10,
    food_rest_score: Math.round(foodRestScore * 10) / 10,
    overall_score: Math.round(overallScore * 10) / 10,
    rest_stops: restStops,
    alerts,
    route_segment_scores: segmentScores,
    created_at: new Date().toISOString(),
  };
}

function generateReasoning(
  route: RouteData,
  from: CityLocation,
  to: CityLocation,
  intermediates: CityLocation[]
): string {
  const parts: string[] = [];

  parts.push(
    `Optimized route from ${from.name} to ${to.name} covering ${route.total_distance} km in approximately ${Math.floor(route.estimated_time)} hours.`
  );

  if (intermediates.length > 0) {
    parts.push(`Route passes through ${intermediates.map((c) => c.name).join(' and ')} for optimal road quality and rest stop access.`);
  }

  parts.push(
    `Safety score: ${route.safety_score}/10. ${route.safety_score >= 7 ? 'Route uses well-maintained highways with low accident risk.' : 'Exercise caution - some segments have elevated risk.'}`
  );

  if (route.rest_stops.length > 0) {
    const bestStop = route.rest_stops[0];
    parts.push(`${route.rest_stops.length} rest stops identified along the route. Top recommendation: ${bestStop.name} (rating: ${bestStop.rating}/5, ${bestStop.distance_from_route}km from route).`);
  } else if (route.total_distance > 300) {
    parts.push('Warning: Long route with limited rest stops. Plan fuel and rest breaks carefully.');
  }

  if (route.alerts.length > 0) {
    parts.push(`${route.alerts.length} alerts detected: ${route.alerts.map((a) => a.description).join('; ')}.`);
  }

  parts.push(`Estimated total cost: ${route.estimated_cost.toLocaleString()} UZS including fuel and driver wages.`);

  return parts.join(' ');
}

export function optimizeRoute(input: RouteOptimizationInput): RouteOptimizationResult {
  // Find nearest cities to origin and destination
  const fromCity = uzbekistanCities.reduce((closest, city) => {
    const d = calculateDistance(input.origin.lat, input.origin.lng, city.lat, city.lng);
    return d < closest.dist ? { city, dist: d } : closest;
  }, { city: uzbekistanCities[0], dist: Infinity }).city;

  const toCity = uzbekistanCities.reduce((closest, city) => {
    const d = calculateDistance(input.destination.lat, input.destination.lng, city.lat, city.lng);
    return d < closest.dist ? { city, dist: d } : closest;
  }, { city: uzbekistanCities[0], dist: Infinity }).city;

  // Override with exact origin/destination coordinates
  const from: CityLocation = { ...fromCity, lat: input.origin.lat, lng: input.origin.lng, name: input.origin.address };
  const to: CityLocation = { ...toCity, lat: input.destination.lat, lng: input.destination.lng, name: input.destination.address };

  const intermediates = findIntermediateCities(fromCity, toCity);

  // Primary route
  const primaryRoute = buildRoute(from, to, intermediates, input, 0);

  // Alternative routes (different intermediate cities or direct)
  const alternatives: RouteData[] = [];

  // Alternative 1: Direct route (no intermediates)
  if (intermediates.length > 0) {
    alternatives.push(buildRoute(from, to, [], input, 1));
  }

  // Alternative 2: Via a different city
  const altIntermediates = findIntermediateCities(fromCity, toCity)
    .filter((c) => !intermediates.some((i) => i.name === c.name));
  if (altIntermediates.length > 0) {
    alternatives.push(buildRoute(from, to, [altIntermediates[0]], input, 2));
  } else if (intermediates.length === 0) {
    // If no intermediates found, create alternative with detour
    const detourCity = uzbekistanCities
      .filter((c) => c.name !== from.name && c.name !== to.name)
      .map((c) => ({ city: c, detour: calculateDistance(from.lat, from.lng, c.lat, c.lng) + calculateDistance(c.lat, c.lng, to.lat, to.lng) }))
      .sort((a, b) => a.detour - b.detour)[0];
    if (detourCity) {
      alternatives.push(buildRoute(from, to, [detourCity.city], input, 1));
    }
  }

  // Sort all routes by overall score
  alternatives.sort((a, b) => b.overall_score - a.overall_score);

  const reasoning = generateReasoning(primaryRoute, from, to, intermediates);

  return {
    route: primaryRoute,
    alternatives: alternatives.slice(0, 2),
    reasoning,
  };
}
