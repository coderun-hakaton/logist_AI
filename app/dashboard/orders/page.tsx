'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package, Clock, Truck, CheckCircle2, Plus, Loader2, Trash2,
  MapPin, ArrowRight, Search, X, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { optimizeRoute } from '@/lib/route-optimizer';
import { uzbekistanCities } from '@/lib/uzbekistan-data';
import { Order, OrderStatus, CargoType, VehicleType, Profile } from '@/types/database';
import { orderStatusConfig, cargoTypeLabels, vehicleTypeLabels } from '@/lib/order-labels';
import { cn } from '@/lib/utils';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdersPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isStaff = profile?.role === 'admin' || profile?.role === 'dispatcher';

  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [vehicles, setVehicles] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>('general');
  const [cargoWeight, setCargoWeight] = useState('5');
  const [pickupDate, setPickupDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [driverId, setDriverId] = useState('none');
  const [vehicleId, setVehicleId] = useState('none');
  const [notes, setNotes] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [ordersRes, driversRes, vehiclesRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('*').eq('role', 'driver'),
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      setOrders((ordersRes.data as unknown as Order[]) || []);
      setDrivers((driversRes.data as unknown as Profile[]) || []);
      setVehicles(((vehiclesRes.data as unknown as Order[]) || []));
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

  const estimate = useMemo(() => {
    const from = uzbekistanCities.find((c) => c.name === origin);
    const to = uzbekistanCities.find((c) => c.name === destination);
    if (!from || !to) return null;
    const result = optimizeRoute({
      origin: { lat: from.lat, lng: from.lng, address: from.name },
      destination: { lat: to.lat, lng: to.lng, address: to.name },
      cargoType,
      cargoWeight: Number(cargoWeight) || 5,
      vehicleType: 'truck',
      priorities: { safety: 1, roadQuality: 0.8, speed: 0.7, cost: 0.9, comfort: 0.6, reliability: 0.7, foodRest: 0.5 },
    });
    return result.route;
  }, [origin, destination, cargoType, cargoWeight]);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.origin_address.toLowerCase().includes(q) ||
          o.destination_address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inTransit: orders.filter((o) => o.status === 'in_transit' || o.status === 'assigned').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const findCity = (name: string) => uzbekistanCities.find((c) => c.name === name);

  async function handleCreate() {
    const from = findCity(origin);
    const to = findCity(destination);
    if (!user) return;
    if (!from || !to) {
      toast({ title: "Ma'lumot yetarli emas", description: "Jo'nash va yetkazish shaharlarini tanlang.", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const orderNumber = `KB-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_id: user.id,
        driver_id: driverId && driverId !== 'none' ? driverId : null,
        vehicle_id: vehicleId && vehicleId !== 'none' ? vehicleId : null,
        cargo_type: cargoType,
        cargo_weight: Number(cargoWeight) || 0,
        is_perishable: cargoType === 'perishable',
        is_hazardous: cargoType === 'hazardous',
        origin_address: from.name,
        origin_lat: from.lat,
        origin_lng: from.lng,
        destination_address: to.name,
        destination_lat: to.lat,
        destination_lng: to.lng,
        pickup_date: pickupDate ? new Date(pickupDate).toISOString() : null,
        delivery_deadline: deadline ? new Date(deadline).toISOString() : null,
        estimated_cost: estimate?.estimated_cost ?? 0,
        status: 'pending',
        notes: notes || null,
      } as any);
      if (error) throw error;
      toast({ title: 'Buyurtma yaratildi', description: `${orderNumber} raqamli buyurtma muvaffaqiyatli saqlandi.` });
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || 'Buyurtmani saqlab boʻlmadi.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setOrigin('');
    setDestination('');
    setCargoType('general');
    setCargoWeight('5');
    setPickupDate('');
    setDeadline('');
    setDriverId('none');
    setVehicleId('none');
    setNotes('');
  }

  async function handleStatusChange(order: Order, status: OrderStatus) {
    try {
      const { error } = await supabase.from('orders').update({ status } as any).eq('id', order.id);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      toast({ title: 'Holat yangilandi', description: `${order.order_number}: ${orderStatusConfig[status].label}` });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || 'Holatni oʻzgartirib boʻlmadi.', variant: 'destructive' });
    }
  }

  async function handleDelete(order: Order) {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', order.id);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      toast({ title: "O'chirildi", description: `${order.order_number} buyurtmasi o'chirildi.` });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || "O'chirib bo'lmadi.", variant: 'destructive' });
    }
  }

  const statCards = [
    { label: 'Jami buyurtmalar', value: stats.total, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Kutilayotganlar', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: "Hozir yo'lda", value: stats.inTransit, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Yetkazilgan', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="orders-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buyurtmalar boshqaruvi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            O'zbekiston bo'ylab barcha yuk tashish buyurtmalari va ularning holati
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="create-order-open-dialog-btn">
          <Plus className="w-4 h-4 mr-2" />
          Yangi buyurtma yaratish
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                {loading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                )}
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.bg)}>
                <s.icon className={cn('w-4 h-4', s.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="orders-filter-all">Barchasi</TabsTrigger>
            <TabsTrigger value="pending" data-testid="orders-filter-pending">Kutilmoqda</TabsTrigger>
            <TabsTrigger value="in_transit" data-testid="orders-filter-in-transit">Yo'lda</TabsTrigger>
            <TabsTrigger value="delivered" data-testid="orders-filter-delivered">Yetkazilgan</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buyurtma raqami yoki shahar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="orders-search-input"
          />
        </div>
      </div>

      {/* Desktop table */}
      <Card className="p-5 hidden md:block">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyOrders onCreate={() => setDialogOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left font-medium py-2.5 pr-4">Buyurtma</th>
                  <th className="text-left font-medium py-2.5 pr-4">Yo'nalish</th>
                  <th className="text-left font-medium py-2.5 pr-4">Yuk</th>
                  <th className="text-left font-medium py-2.5 pr-4">Holat</th>
                  <th className="text-right font-medium py-2.5 pr-4">Summa</th>
                  <th className="text-left font-medium py-2.5 pr-4">Sana</th>
                  {isStaff && <th className="text-right font-medium py-2.5">Amallar</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const st = orderStatusConfig[order.status];
                  return (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors" data-testid={`order-row-${order.order_number}`}>
                      <td className="py-3 pr-4 font-medium">{order.order_number}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {order.origin_address} → {order.destination_address}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {cargoTypeLabels[order.cargo_type]} · {order.cargo_weight}t
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className={cn('font-medium', st.color, st.bg)}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium whitespace-nowrap">
                        {order.estimated_cost.toLocaleString('uz-UZ')} so'm
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{formatDate(order.created_at)}</td>
                      {isStaff && (
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Select value={order.status} onValueChange={(v) => handleStatusChange(order, v as OrderStatus)}>
                              <SelectTrigger className="h-8 w-36 text-xs" data-testid={`order-status-select-${order.order_number}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(orderStatusConfig) as OrderStatus[]).map((s) => (
                                  <SelectItem key={s} value={s}>{orderStatusConfig[s].label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(order)}
                              data-testid={`order-delete-btn-${order.order_number}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-6"><EmptyOrders onCreate={() => setDialogOpen(true)} /></Card>
        ) : (
          filtered.map((order) => {
            const st = orderStatusConfig[order.status];
            return (
              <Card key={order.id} className="p-4 space-y-2" data-testid={`order-card-${order.order_number}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{order.order_number}</span>
                  <Badge variant="secondary" className={cn('font-medium', st.color, st.bg)}>{st.label}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {order.origin_address} → {order.destination_address}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{cargoTypeLabels[order.cargo_type]} · {order.cargo_weight}t</span>
                  <span className="font-medium">{order.estimated_cost.toLocaleString('uz-UZ')} so'm</span>
                </div>
                {isStaff && (
                  <div className="flex items-center gap-2 pt-1">
                    <Select value={order.status} onValueChange={(v) => handleStatusChange(order, v as OrderStatus)}>
                      <SelectTrigger className="h-8 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(orderStatusConfig) as OrderStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{orderStatusConfig[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(order)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Create order dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="create-order-dialog">
          <DialogHeader>
            <DialogTitle>Yangi buyurtma yaratish</DialogTitle>
            <DialogDescription>
              Yuk jo'nash va yetkazish nuqtalarini, yuk tafsilotlarini kiriting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jo'nash shahri (Qayerdan)</Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger data-testid="order-origin-select"><SelectValue placeholder="Shaharni tanlang" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {uzbekistanCities.filter((c) => c.region !== 'Kazakhstan' && c.region !== 'Tajikistan' && c.region !== 'Russia').map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name} ({c.nameUz})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Yetkazish manzili (Qayerga)</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger data-testid="order-destination-select"><SelectValue placeholder="Shaharni tanlang" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {uzbekistanCities.filter((c) => c.region !== 'Kazakhstan' && c.region !== 'Tajikistan' && c.region !== 'Russia').map((c) => (
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
                  <SelectTrigger data-testid="order-cargo-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(cargoTypeLabels) as CargoType[]).map((c) => (
                      <SelectItem key={c} value={c}>{cargoTypeLabels[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Yuk og'irligi (tonna)</Label>
                <Input
                  type="number" min="0.1" step="0.5" value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  data-testid="order-weight-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Yuklash sanasi</Label>
                <Input type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} data-testid="order-pickup-date-picker" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Yetkazish muddati</Label>
                <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} data-testid="order-deadline-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Haydovchi (ixtiyoriy)</Label>
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger data-testid="order-driver-select"><SelectValue placeholder="Tanlanmagan" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">Tanlanmagan</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transport (ixtiyoriy)</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger data-testid="order-vehicle-select"><SelectValue placeholder="Tanlanmagan" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">Tanlanmagan</SelectItem>
                    {(vehicles as any[]).map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.license_plate}{v.brand ? ` · ${v.brand}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {estimate && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tavsiya etilgan to'lov (UZS)</p>
                  <p className="text-lg font-bold text-primary">{estimate.estimated_cost.toLocaleString('uz-UZ')} so'm</p>
                  <p className="text-[11px] text-muted-foreground">
                    {estimate.total_distance} km · ~{Math.floor(estimate.estimated_time)} soat · Xavfsizlik: {estimate.safety_score}/10
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Qo'shimcha eslatma va talablar</Label>
              <Textarea
                placeholder="Yuklash joyi xususiyatlari, kontakt raqam..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                data-testid="order-notes-textarea"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="create-order-cancel-btn">
              <X className="w-4 h-4 mr-1.5" />
              Bekor qilish
            </Button>
            <Button onClick={handleCreate} disabled={saving} data-testid="create-order-submit-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Buyurtmani tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyOrders({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Hozircha buyurtmalar yo'q</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onCreate} data-testid="orders-empty-create-btn">
        Birinchi buyurtmani yarating
      </Button>
    </div>
  );
}
