'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Users, Clock, CheckCircle2, XCircle, Phone, Truck, Hash, Weight,
  FileText, ExternalLink, Loader2, RefreshCw, Search, Inbox, MapPin, Award,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { createEphemeralAuthClient, phoneToSyntheticEmail } from '@/lib/driver-onboarding';
import { listDriverApplications, reviewDriverApplication, DriverApplication } from '@/lib/api';
import { Profile, Vehicle } from '@/types/database';
import { uzbekistanCities } from '@/lib/uzbekistan-data';
import type { DriverMapPoint } from '@/components/drivers-mapbox';

// Mapbox faqat brauzerda ishlaydi — SSR'siz yuklanadi
const DriversMapbox = dynamic(() => import('@/components/drivers-mapbox'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-secondary/30">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

type DriverRoster = Profile & { vehicle?: Vehicle };

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DriversPage() {
  const { profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [roster, setRoster] = useState<DriverRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DriverApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvedInfo, setApprovedInfo] = useState<{
    name: string;
    email: string;
    phone: string;
    needsEmailConfirmation: boolean;
  } | null>(null);

  const isStaff = currentProfile?.role === 'admin' || currentProfile?.role === 'dispatcher';

  async function loadData() {
    setLoading(true);
    try {
      const [apps, profilesRes, vehiclesRes] = await Promise.all([
        listDriverApplications(),
        supabase.from('profiles').select('*').eq('role', 'driver').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const vehiclesByOwner = new Map<string, Vehicle>();
      ((vehiclesRes.data as unknown as Vehicle[]) || []).forEach((v) => vehiclesByOwner.set(v.owner_id, v));

      const rosterWithVehicles: DriverRoster[] = ((profilesRes.data as unknown as Profile[]) || []).map((p) => ({
        ...p,
        vehicle: vehiclesByOwner.get(p.id),
      }));

      setApplications(apps);
      setRoster(rosterWithVehicles);
    } catch (err: any) {
      toast({
        title: "Ma'lumotlarni yuklab bo'lmadi",
        description: err?.message || 'Iltimos, sahifani qayta yuklang.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = useMemo(() => applications.filter((a) => a.status === 'pending'), [applications]);
  const rejected = useMemo(() => applications.filter((a) => a.status === 'rejected'), [applications]);

  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.phone || '').toLowerCase().includes(q) ||
        (d.vehicle?.license_plate || '').toLowerCase().includes(q)
    );
  }, [roster, search]);

  /**
   * Xarita nuqtalari: tasdiqlangan haydovchilar (transport joylashuvi yoki
   * hududi bo'yicha) + kutilayotgan arizalar (ko'rsatilgan hudud bo'yicha).
   */
  const mapPoints = useMemo<DriverMapPoint[]>(() => {
    const cityCoords = (name: string | null) => {
      if (!name) return null;
      const n = name.trim().toLowerCase();
      const city = uzbekistanCities.find(
        (c) => c.name.toLowerCase() === n || c.nameUz.toLowerCase() === n
      );
      return city ? { lng: city.lng, lat: city.lat } : null;
    };

    const points: DriverMapPoint[] = [];

    roster.forEach((d) => {
      const v = d.vehicle;
      let coords: { lng: number; lat: number } | null = null;
      if (v?.current_lng != null && v?.current_lat != null) {
        coords = { lng: v.current_lng, lat: v.current_lat };
      }
      if (!coords) coords = cityCoords(d.company);
      if (!coords) {
        // Joylashuv ma'lum bo'lmasa — Toshkent atrofida kichik siljish bilan
        const tashkent = uzbekistanCities[0];
        const offset = (points.length % 5) * 0.08;
        coords = { lng: tashkent.lng + offset, lat: tashkent.lat + offset * 0.6 };
      }
      points.push({
        id: `driver-${d.id}`,
        name: d.name,
        phone: d.phone,
        licensePlate: v?.license_plate ?? null,
        vehicleBrand: v?.brand ?? v?.type ?? null,
        kind: 'active',
        city: d.company,
        ...coords,
      });
    });

    pending.forEach((app, idx) => {
      let coords = cityCoords(app.city);
      if (!coords) {
        const tashkent = uzbekistanCities[0];
        coords = { lng: tashkent.lng - 0.15 - idx * 0.07, lat: tashkent.lat - 0.12 };
      }
      points.push({
        id: `app-${app.id}`,
        name: `${app.first_name} ${app.last_name}`,
        phone: app.phone,
        licensePlate: app.car_plate,
        vehicleBrand: app.car_brand,
        kind: 'pending',
        city: app.city,
        ...coords,
      });
    });

    return points;
  }, [roster, pending]);

  async function handleApprove(app: DriverApplication) {
    if (!app.password) {
      toast({ title: 'Amalga oshmadi', description: "Ushbu so'rov uchun parol topilmadi.", variant: 'destructive' });
      return;
    }
    setProcessingId(app.id);
    try {
      // Admin sessiyasini buzmaslik uchun alohida klient bilan haydovchi akkaunti yaratiladi
      const tempClient = createEphemeralAuthClient();
      const email = phoneToSyntheticEmail(app.phone);
      const { data, error } = await tempClient.auth.signUp({
        email,
        password: app.password,
        options: {
          data: {
            name: `${app.first_name} ${app.last_name}`.trim(),
            role: 'driver',
            phone: app.phone,
          },
        },
      });

      if (error) throw error;
      const newDriverId = data.user?.id ?? null;

      await reviewDriverApplication(app.id, {
        status: 'approved',
        driver_id: newDriverId,
        reviewed_by: currentProfile?.id ?? null,
      });

      // Supabase'da "Confirm email" yoqilgan bo'lsa, akkaunt tasdiqlanmagan holda yaratiladi
      const needsEmailConfirmation = !data.session;
      setApprovedInfo({
        name: `${app.first_name} ${app.last_name}`,
        email,
        phone: app.phone,
        needsEmailConfirmation,
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Tasdiqlashda xatolik',
        description: err?.message || "Qayta urinib ko'ring.",
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await reviewDriverApplication(rejectTarget.id, {
        status: 'rejected',
        rejection_reason: rejectReason || null,
        reviewed_by: currentProfile?.id ?? null,
      });

      toast({
        title: "So'rov rad etildi",
        description: `${rejectTarget.first_name} ${rejectTarget.last_name} haqidagi so'rov rad etildi.`,
      });
      setRejectTarget(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Amalga oshmadi',
        description: err?.message || "Qayta urinib ko'ring.",
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  }

  if (!isStaff) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-3" data-testid="drivers-no-access">
        <Users className="w-10 h-10 text-muted-foreground mx-auto" />
        <h1 className="text-lg font-semibold">Ruxsat yo&apos;q</h1>
        <p className="text-sm text-muted-foreground">Bu sahifa faqat admin va dispetcherlar uchun mavjud.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="drivers-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Haydovchilar tarkibi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yangi ro&apos;yxatdan o&apos;tish so&apos;rovlarini ko&apos;rib chiqing va haydovchilar ro&apos;yxatini boshqaring.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} data-testid="drivers-refresh-btn">
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Yangilash
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4" data-testid="drivers-stat-pending">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> Kutilmoqda
          </div>
          <div className="text-2xl font-bold">{pending.length}</div>
        </Card>
        <Card className="p-4" data-testid="drivers-stat-active">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Faol haydovchilar
          </div>
          <div className="text-2xl font-bold">{roster.length}</div>
        </Card>
        <Card className="p-4" data-testid="drivers-stat-rejected">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <XCircle className="w-3.5 h-3.5" /> Rad etilgan
          </div>
          <div className="text-2xl font-bold">{rejected.length}</div>
        </Card>
        <Card className="p-4" data-testid="drivers-stat-total">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <Truck className="w-3.5 h-3.5" /> Jami so&apos;rovlar
          </div>
          <div className="text-2xl font-bold">{applications.length}</div>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="drivers-tab-pending">Kutilmoqda ({pending.length})</TabsTrigger>
          <TabsTrigger value="roster" data-testid="drivers-tab-roster">Haydovchilar ro&apos;yxati ({roster.length})</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="drivers-tab-rejected">Rad etilgan ({rejected.length})</TabsTrigger>
          <TabsTrigger value="map" data-testid="drivers-tab-map">
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Xarita
          </TabsTrigger>
        </TabsList>

        {/* KUTILMOQDA */}
        <TabsContent value="pending" className="mt-4 space-y-3">
          {loading ? (
            <LoadingSkeleton />
          ) : pending.length === 0 ? (
            <EmptyState icon={Inbox} text="Hozircha yangi so'rovlar yo'q." />
          ) : (
            pending.map((app) => (
              <Card key={app.id} className="p-4 sm:p-5" data-testid={`driver-application-${app.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initialsOf(`${app.first_name} ${app.last_name}`)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{app.first_name} {app.last_name}</h3>
                      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <Clock className="w-3 h-3" /> Kutilmoqda
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(app.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {app.phone}</span>
                      {app.city && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {app.city}</span>}
                      {app.experience_years != null && <span className="inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> {app.experience_years} yil tajriba</span>}
                      {app.license_categories && <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Toifa: {app.license_categories}</span>}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                      {app.has_vehicle ? (
                        <>
                          {app.car_brand && <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {app.car_brand}</span>}
                          {app.car_plate && <span className="inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {app.car_plate}</span>}
                          {app.capacity_kg != null && <span className="inline-flex items-center gap-1.5"><Weight className="w-3.5 h-3.5" /> {app.capacity_kg} kg</span>}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" /> Shaxsiy mashinasi yo&apos;q (kompaniya transporti kerak)
                        </span>
                      )}
                    </div>

                    {(app.license_image_url || app.tech_passport_image_url) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {app.license_image_url && (
                          <a href={app.license_image_url} target="_blank" rel="noreferrer">
                            <Button type="button" variant="outline" size="sm" data-testid="driver-view-documents-btn">
                              <FileText className="w-3.5 h-3.5 mr-1.5" /> Guvohnoma <ExternalLink className="w-3 h-3 ml-1.5" />
                            </Button>
                          </a>
                        )}
                        {app.tech_passport_image_url && (
                          <a href={app.tech_passport_image_url} target="_blank" rel="noreferrer">
                            <Button type="button" variant="outline" size="sm">
                              <FileText className="w-3.5 h-3.5 mr-1.5" /> Tex pasport <ExternalLink className="w-3 h-3 ml-1.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="flex-1 sm:flex-none"
                      data-testid="driver-approve-btn"
                    >
                      {processingId === app.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Tasdiqlash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                      disabled={processingId === app.id}
                      onClick={() => { setRejectTarget(app); setRejectReason(''); }}
                      data-testid="driver-reject-btn"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Rad etish
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* RO'YXAT */}
        <TabsContent value="roster" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ism, telefon yoki raqam bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="drivers-search-input"
            />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : filteredRoster.length === 0 ? (
            <EmptyState icon={Users} text="Hali tasdiqlangan haydovchilar yo'q." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredRoster.map((driver) => (
                <Card key={driver.id} className="p-4" data-testid={`driver-roster-card-${driver.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initialsOf(driver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{driver.name}</h3>
                        <Badge variant="secondary" className="gap-1 shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Faol
                        </Badge>
                      </div>
                      <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                        {driver.phone && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {driver.phone}</span>
                            <a href={`tel:${driver.phone.replace(/\s/g, '')}`} className="text-primary text-xs hover:underline">
                              Qo&apos;ng&apos;iroq
                            </a>
                          </div>
                        )}
                        {driver.vehicle && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {driver.vehicle.brand || driver.vehicle.type}</span>
                            <span className="inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {driver.vehicle.license_plate}</span>
                            <span className="inline-flex items-center gap-1.5"><Weight className="w-3.5 h-3.5" /> {driver.vehicle.capacity} t</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* RAD ETILGAN */}
        <TabsContent value="rejected" className="mt-4 space-y-3">
          {loading ? (
            <LoadingSkeleton />
          ) : rejected.length === 0 ? (
            <EmptyState icon={XCircle} text="Rad etilgan so'rovlar yo'q." />
          ) : (
            rejected.map((app) => (
              <Card key={app.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-destructive/10 text-destructive font-semibold text-sm">
                      {initialsOf(`${app.first_name} ${app.last_name}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{app.first_name} {app.last_name}</h3>
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> Rad etilgan
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{app.phone}</p>
                    {app.rejection_reason && (
                      <p className="text-sm mt-2 rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
                        {app.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* XARITA */}
        <TabsContent value="map" className="mt-4">
          <Card className="p-5 space-y-4" data-testid="drivers-map-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Haydovchilar xaritasi
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Faol haydovchilar va yangi arizalarning O&apos;zbekiston bo&apos;ylab joylashuvi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Faol haydovchi ({roster.length})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Ariza kutilmoqda ({pending.length})
                </span>
              </div>
            </div>

            <div className="h-[520px] w-full" data-testid="drivers-map-wrapper">
              <DriversMapbox drivers={mapPoints} />
            </div>

            {mapPoints.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center">
                Xaritada ko&apos;rsatish uchun hali haydovchi yoki ariza yo&apos;q.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tasdiqlangandan keyin kirish ma'lumotlari */}
      <Dialog open={!!approvedInfo} onOpenChange={(open) => !open && setApprovedInfo(null)}>
        <DialogContent data-testid="driver-approved-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Haydovchi tasdiqlandi
            </DialogTitle>
            <DialogDescription>
              {approvedInfo?.name} uchun akkaunt yaratildi. Kirish ma&apos;lumotlarini haydovchiga
              yetkazing (telefon: {approvedInfo?.phone}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Login (email):</span>
              <code className="font-mono text-xs break-all text-right" data-testid="driver-approved-email">
                {approvedInfo?.email}
              </code>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Parol:</span>
              <span className="text-xs text-right">
                Haydovchi ariza topshirganda o&apos;zi kiritgan parol
              </span>
            </div>
          </div>

          {approvedInfo?.needsEmailConfirmation && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 px-3 py-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <span className="font-medium">Diqqat:</span> Supabase&apos;da &laquo;Confirm email&raquo;
                yoqilgan — haydovchi kira olishi uchun uni Authentication → Sign In / Providers →
                Email bo&apos;limida o&apos;chirish kerak.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (approvedInfo?.email) navigator.clipboard?.writeText(approvedInfo.email);
                toast({ title: 'Nusxa olindi', description: 'Login nusxa olindi.' });
              }}
              data-testid="driver-approved-copy-btn"
            >
              Loginni nusxalash
            </Button>
            <Button onClick={() => setApprovedInfo(null)} data-testid="driver-approved-close-btn">
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>        <DialogContent data-testid="driver-reject-dialog">
          <DialogHeader>
            <DialogTitle>So&apos;rovni rad etish</DialogTitle>
            <DialogDescription>
              {rejectTarget && `${rejectTarget.first_name} ${rejectTarget.last_name}`} uchun sababni kiriting (ixtiyoriy).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Masalan: hujjatlar sifati past, ma'lumotlar mos emas..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            data-testid="driver-reject-reason-textarea"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Bekor qilish</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId === rejectTarget?.id}
              data-testid="driver-reject-confirm-btn"
            >
              {processingId === rejectTarget?.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Inbox; text: string }) {
  return (
    <Card className="p-10 text-center">
      <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}
