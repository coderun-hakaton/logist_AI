'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users, Clock, CheckCircle2, XCircle, Phone, Truck, Hash, Weight,
  FileText, ExternalLink, Loader2, RefreshCw, Search, Inbox,
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
import { DriverApplication, Profile, Vehicle } from '@/types/database';

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

  const isStaff = currentProfile?.role === 'admin' || currentProfile?.role === 'dispatcher';

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: appsData, error: appsError }, { data: profilesData, error: profilesError }, { data: vehiclesData }] = await Promise.all([
        supabase.from('driver_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'driver').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*'),
      ]);

      if (appsError) throw appsError;
      if (profilesError) throw profilesError;

      const vehiclesByOwner = new Map<string, Vehicle>();
      ((vehiclesData as unknown as Vehicle[]) || []).forEach((v) => vehiclesByOwner.set(v.owner_id, v));

      const rosterWithVehicles: DriverRoster[] = ((profilesData as unknown as Profile[]) || []).map((p) => ({
        ...p,
        vehicle: vehiclesByOwner.get(p.id),
      }));

      setApplications((appsData as unknown as DriverApplication[]) || []);
      setRoster(rosterWithVehicles);
    } catch (err: any) {
      toast({
        title: 'Ma\'lumotlarni yuklab bo\'lmadi',
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
      (d) => d.name.toLowerCase().includes(q) || (d.phone || '').toLowerCase().includes(q) || (d.vehicle?.license_plate || '').toLowerCase().includes(q)
    );
  }, [roster, search]);

  async function handleApprove(app: DriverApplication) {
    if (!app.password) {
      toast({ title: 'Amalga oshmadi', description: 'Ushbu so\'rov uchun parol topilmadi.', variant: 'destructive' });
      return;
    }
    setProcessingId(app.id);
    try {
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
            status: 'approved',
            license_image_url: app.license_image_url,
            tech_passport_image_url: app.tech_passport_image_url,
            car_brand: app.car_brand,
            car_plate: app.car_plate,
            capacity_kg: app.capacity_kg,
          },
        },
      });

      if (error) throw error;
      const newDriverId = data.user?.id;

      const { error: updateError } = await supabase
        .from('driver_applications')
        .update({
          status: 'approved',
          driver_id: newDriverId ?? null,
          reviewed_by: currentProfile?.id,
          reviewed_at: new Date().toISOString(),
          password: null,
        } as any)
        .eq('id', app.id);
      if (updateError) throw updateError;

      toast({ title: 'Haydovchi tasdiqlandi', description: `${app.first_name} ${app.last_name} endi tizimga kira oladi.` });
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Tasdiqlashda xatolik',
        description: err?.message || 'Qayta urinib ko\'ring.',
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
      const { error } = await supabase
        .from('driver_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason || null,
          reviewed_by: currentProfile?.id,
          reviewed_at: new Date().toISOString(),
          password: null,
        } as any)
        .eq('id', rejectTarget.id);
      if (error) throw error;

      toast({ title: 'So\'rov rad etildi', description: `${rejectTarget.first_name} ${rejectTarget.last_name} haqidagi so'rov rad etildi.` });
      setRejectTarget(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Amalga oshmadi',
        description: err?.message || 'Qayta urinib ko\'ring.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  }

  if (!isStaff) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-3">
        <Users className="w-10 h-10 text-muted-foreground mx-auto" />
        <h1 className="text-lg font-semibold">Ruxsat yo&apos;q</h1>
        <p className="text-sm text-muted-foreground">Bu sahifa faqat admin va dispetcherlar uchun mavjud.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Haydovchilar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yangi ro&apos;yxatdan o&apos;tish so&apos;rovlarini ko&apos;rib chiqing va haydovchilar ro&apos;yhatini boshqaring.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Yangilash
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> Kutilmoqda
          </div>
          <div className="text-2xl font-bold">{pending.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Faol haydovchilar
          </div>
          <div className="text-2xl font-bold">{roster.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <XCircle className="w-3.5 h-3.5" /> Rad etilgan
          </div>
          <div className="text-2xl font-bold">{rejected.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <Truck className="w-3.5 h-3.5" /> Jami so&apos;rovlar
          </div>
          <div className="text-2xl font-bold">{applications.length}</div>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Kutilmoqda ({pending.length})</TabsTrigger>
          <TabsTrigger value="roster">Haydovchilar ro&apos;yhati ({roster.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rad etilgan ({rejected.length})</TabsTrigger>
        </TabsList>

        {/* PENDING */}
        <TabsContent value="pending" className="mt-4 space-y-3">
          {loading ? (
            <LoadingSkeleton />
          ) : pending.length === 0 ? (
            <EmptyState icon={Inbox} text="Hozircha yangi so'rovlar yo'q." />
          ) : (
            pending.map((app) => (
              <Card key={app.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initialsOf(`${app.first_name} ${app.last_name}`)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{app.first_name} {app.last_name}</h3>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" /> Kutilmoqda
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(app.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {app.phone}</span>
                      {app.car_brand && <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {app.car_brand}</span>}
                      {app.car_plate && <span className="inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {app.car_plate}</span>}
                      {app.capacity_kg != null && <span className="inline-flex items-center gap-1.5"><Weight className="w-3.5 h-3.5" /> {app.capacity_kg} kg</span>}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {app.license_image_url && (
                        <a href={app.license_image_url} target="_blank" rel="noreferrer">
                          <Button type="button" variant="outline" size="sm">
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
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="flex-1 sm:flex-none"
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

        {/* ROSTER */}
        <TabsContent value="roster" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ism, telefon yoki raqam bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : filteredRoster.length === 0 ? (
            <EmptyState icon={Users} text="Hali tasdiqlangan haydovchilar yo'q." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredRoster.map((driver) => (
                <Card key={driver.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initialsOf(driver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{driver.name}</h3>
                        <Badge variant="secondary" className="gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Faol
                        </Badge>
                      </div>
                      <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                        {driver.phone && <div className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {driver.phone}</div>}
                        {driver.vehicle && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {driver.vehicle.brand || driver.vehicle.type}</span>
                            <span className="inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {driver.vehicle.license_plate}</span>
                            <span className="inline-flex items-center gap-1.5"><Weight className="w-3.5 h-3.5" /> {driver.vehicle.capacity} kg</span>
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

        {/* REJECTED */}
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
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
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
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processingId === rejectTarget?.id}>
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