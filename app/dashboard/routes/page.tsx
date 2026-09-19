'use client';

import { useState } from 'react';
import {
  Route, MapPin, Sparkles, Shield, Gauge, Bed, Clock, UtensilsCrossed, Wallet,
  TrendingUp, Loader2, ArrowRight, AlertTriangle, Star, Navigation,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UzbekistanMap } from '@/components/uzbekistan-map';
import { useToast } from '@/hooks/use-toast';
import { optimizeRoute } from '@/lib/route-optimizer';
import { uzbekistanCities } from '@/lib/uzbekistan-data';
import { RouteOptimizationResult, CargoType, VehicleType } from '@/types/database';
import { cn } from '@/lib/utils';

const factors = [
  { key: 'safety', label: 'Xavfsizlik', icon: Shield, color: 'text-red-500' },
  { key: 'roadQuality', label: "Yo'l sifati", icon: Route, color: 'text-blue-500' },
  { key: 'speed', label: 'Tezlik', icon: Gauge, color: 'text-cyan-500' },
  { key: 'cost', label: 'Xarajat', icon: Wallet, color: 'text-green-500' },
  { key: 'comfort', label: 'Qulaylik', icon: Bed, color: 'text-amber-500' },
  { key: 'reliability', label: 'Ishonchlilik', icon: Clock, color: 'text-indigo-500' },
  { key: 'foodRest', label: 'Ovqat va dam olish', icon: UtensilsCrossed, color: 'text-orange-500' },
] as const;

const cargoTypes: { value: CargoType; label: string }[] = [
  { value: 'general', label: 'Oddiy yuk' },
  { value: 'perishable', label: 'Tez buziluvchi yuk' },
  { value: 'fragile', label: "Mo'rt buyumlar" },
  { value: 'hazardous', label: 'Xavfli yuklar (ADR)' },
];

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'truck', label: 'Yuk mashinasi' },
  { value: 'van', label: 'Furgon' },
  { value: 'refrigerated', label: 'Refrijerator' },
  { value: 'semi', label: 'Yarim tirkama' },
  { value: 'container', label: 'Konteyner tashuvchi' },
];

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
  if (score >= 6) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
  if (score >= 4) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
  return 'text-red-600 bg-red-100 dark:bg-red-900/30';
}

function scoreLabel(score: number): string {
  if (score >= 8) return "A'lo";
  if (score >= 6) return 'Yaxshi';
  if (score >= 4) return 'O\'rtacha';
  return 'Yomon';
}

export default function RouteOptimizerPage() {
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>('general');
  const [cargoWeight, setCargoWeight] = useState(5);
  const [vehicleType, setVehicleType] = useState<VehicleType>('truck');
  const [budget, setBudget] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [priorities, setPriorities] = useState({
    safety: 80,
    roadQuality: 60,
    speed: 50,
    cost: 70,
    comfort: 40,
    reliability: 50,
    foodRest: 35,
  });

  const findCity = (name: string) => uzbekistanCities.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() || c.nameUz.toLowerCase() === name.toLowerCase()
  );

  const handleOptimize = async () => {
    if (!origin || !destination) {
      toast({ title: "Ma'lumot yetarli emas", description: 'Jo\'nash va yetkazish shaharlarini tanlang.', variant: 'destructive' });
      return;
    }

    const fromCity = findCity(origin);
    const toCity = findCity(destination);

    if (!fromCity || !toCity) {
      toast({ title: 'Shahar topilmadi', description: 'Shaharlarni ro\'yxatdan tanlang.', variant: 'destructive' });
      return;
    }

    setOptimizing(true);
    setResult(null);

    // AI tahlil vaqtini simulyatsiya qilish
    await new Promise((r) => setTimeout(r, 1200));

    const optimizationResult = optimizeRoute({
      origin: { lat: fromCity.lat, lng: fromCity.lng, address: fromCity.name },
      destination: { lat: toCity.lat, lng: toCity.lng, address: toCity.name },
      cargoType,
      cargoWeight,
      vehicleType,
      budgetConstraint: budget ? parseInt(budget) : undefined,
      priorities: {
        safety: priorities.safety / 100,
        roadQuality: priorities.roadQuality / 100,
        speed: priorities.speed / 100,
        cost: priorities.cost / 100,
        comfort: priorities.comfort / 100,
        reliability: priorities.reliability / 100,
        foodRest: priorities.foodRest / 100,
      },
    });

    setResult(optimizationResult);
    setSelectedRouteIdx(0);
    setOptimizing(false);
    toast({ title: 'Marshrut optimallashtirildi!', description: `Eng yaxshi marshrut umumiy balli: ${optimizationResult.route.overall_score}/10.` });
  };

  const allRoutes = result ? [result.route, ...result.alternatives] : [];
  const selectedRoute = allRoutes[selectedRouteIdx];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="routes-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marshrut optimizatori</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          O'zbekiston bo'ylab 7 real faktorni hisobga oluvchi AI asosidagi marshrut optimallashtirish.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Forma */}
        <Card className="p-5 xl:col-span-1 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Marshrut parametrlari</h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-500" />
                Jo'nash shahri
              </Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger data-testid="routes-origin-select"><SelectValue placeholder="Jo'nash shahri" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {uzbekistanCities.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name} ({c.nameUz})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary" />
                Yetkazish shahri
              </Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger data-testid="routes-destination-select"><SelectValue placeholder="Yetkazish shahri" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {uzbekistanCities.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name} ({c.nameUz})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Yuk turi</Label>
              <Select value={cargoType} onValueChange={(v) => setCargoType(v as CargoType)}>
                <SelectTrigger data-testid="routes-cargo-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cargoTypes.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transport turi</Label>
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                <SelectTrigger data-testid="routes-vehicle-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Og'irlik (tonna)</Label>
              <Input type="number" value={cargoWeight} onChange={(e) => setCargoWeight(Number(e.target.value))} min={0.1} step={0.5} data-testid="routes-weight-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Byudjet (so'm, ixtiyoriy)</Label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Cheklovsiz" data-testid="routes-budget-input" />
            </div>
          </div>

          {/* Prioritet slayderlari */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-xs font-semibold">Optimallashtirish prioritetlari</Label>
            <div className="space-y-2.5">
              {factors.map((factor) => (
                <div key={factor.key} className="flex items-center gap-3">
                  <factor.icon className={cn('w-3.5 h-3.5 shrink-0', factor.color)} />
                  <span className="text-xs w-28 shrink-0">{factor.label}</span>
                  <Slider
                    value={[priorities[factor.key]]}
                    onValueChange={(v) => setPriorities({ ...priorities, [factor.key]: v[0] })}
                    max={100}
                    step={5}
                    className="flex-1"
                    data-testid={`routes-priority-${factor.key}`}
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{priorities[factor.key]}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleOptimize} disabled={optimizing} className="w-full" size="lg" data-testid="routes-optimize-btn">
            {optimizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Marshrut tahlilanmoqda...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Marshrutni optimallashtirish
              </>
            )}
          </Button>
        </Card>

        {/* Natijalar */}
        <div className="xl:col-span-2 space-y-6">
          {optimizing && (
            <Card className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">7 optimallashtirish faktori tahlilanmoqda...</p>
              <div className="flex gap-2 mt-3 flex-wrap justify-center max-w-md">
                {factors.map((f, i) => (
                  <Badge
                    key={f.key}
                    variant="outline"
                    className="text-xs animate-fade-in"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    <f.icon className={cn('w-3 h-3 mr-1', f.color)} />
                    {f.label}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {!optimizing && !result && (
            <Card className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Navigation className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Optimallashtirishga tayyor</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Jo'nash nuqtasi, manzil va yuk tafsilotlarini tanlang, so'ng "Marshrutni optimallashtirish" tugmasini bosing —
                AI tavsiyalarini olasiz.
              </p>
            </Card>
          )}

          {result && selectedRoute && (
            <>
              {/* Marshrut tanlash */}
              {allRoutes.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {allRoutes.map((route, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRouteIdx(idx)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                        selectedRouteIdx === idx
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50 text-muted-foreground'
                      )}
                      data-testid={`routes-select-${idx}`}
                    >
                      {idx === 0 ? 'Asosiy marshrut' : `${idx}-alternativa`}
                      <span className="ml-2 text-xs opacity-70">({route.overall_score}/10)</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Xarita */}
              <Card className="p-5">
                <div className="aspect-[8/5] w-full">
                  <UzbekistanMap
                    routes={[selectedRoute]}
                    waypoints={selectedRoute.waypoints}
                    showCities={true}
                    showAccidentZones={true}
                    interactive={true}
                  />
                </div>
              </Card>

              {/* Ball tahlili */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Marshrut xulosasi
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Masofa</p>
                      <p className="text-xl font-bold">{selectedRoute.total_distance} km</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Taxminiy vaqt</p>
                      <p className="text-xl font-bold">{Math.floor(selectedRoute.estimated_time)} soat {Math.round((selectedRoute.estimated_time % 1) * 60)} daq</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Taxminiy xarajat</p>
                      <p className="text-xl font-bold">{selectedRoute.estimated_cost.toLocaleString('uz-UZ')}</p>
                      <p className="text-[10px] text-muted-foreground">so'm</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-xs text-primary/70">Umumiy ball</p>
                      <p className="text-xl font-bold text-primary">{selectedRoute.overall_score}/10</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    7 faktor tahlili
                  </h3>
                  <div className="space-y-2.5">
                    {factors.map((factor) => {
                      const scoreMap: Record<string, number> = {
                        safety: selectedRoute.safety_score,
                        roadQuality: selectedRoute.road_quality_score,
                        speed: selectedRoute.speed_score,
                        cost: selectedRoute.cost_score,
                        comfort: selectedRoute.comfort_score,
                        reliability: selectedRoute.reliability_score,
                        foodRest: selectedRoute.food_rest_score,
                      };
                      const score = scoreMap[factor.key];
                      return (
                        <div key={factor.key} className="flex items-center gap-3">
                          <factor.icon className={cn('w-3.5 h-3.5 shrink-0', factor.color)} />
                          <span className="text-xs w-28 shrink-0">{factor.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500')}
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                          <Badge variant="secondary" className={cn('text-[10px] font-bold', scoreColor(score))}>
                            {score} · {scoreLabel(score)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Dam olish maskanlari */}
              {selectedRoute.rest_stops.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                    Tavsiya etilgan dam olish maskanlari
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedRoute.rest_stops.map((stop, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{stop.name}</p>
                            <p className="text-xs text-muted-foreground">{stop.address}</p>
                          </div>
                          {stop.halal && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600/30">Halol</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn('w-3 h-3', i < Math.floor(stop.rating) ? 'fill-amber-400 text-amber-400' : 'text-border')} />
                            ))}
                          </div>
                          <span className="text-xs font-medium">{stop.rating}</span>
                          <span className="text-xs text-muted-foreground">· marshrutdan {stop.distance_from_route}km</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {stop.amenities.slice(0, 4).map((a) => (
                            <Badge key={a} variant="secondary" className="text-[10px] capitalize">{a.replace(/_/g, ' ')}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Ogohlantirishlar */}
              {selectedRoute.alerts.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Marshrut ogohlantirishlari
                  </h3>
                  <div className="space-y-2">
                    {selectedRoute.alerts.map((alert, idx) => (
                      <div key={idx} className={cn(
                        'flex items-start gap-3 rounded-lg p-3 border',
                        alert.severity === 'high' ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10' :
                        alert.severity === 'medium' ? 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10' :
                        'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10'
                      )}>
                        <AlertTriangle className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          alert.severity === 'high' ? 'text-red-500' :
                          alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                        )} />
                        <div>
                          <p className="text-sm font-medium">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Boshlanishdan {alert.distance_marker}km uzoqda
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* AI tahlil */}
              <Card className="p-5 bg-gradient-to-br from-primary/5 to-chart-2/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">AI tahlili</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
