'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Package, Truck, CheckCircle2, Wallet, Loader2, RefreshCw, MapPin,
  Calendar, Weight, ArrowRight, Map as MapIcon, Inbox, AlertTriangle, Clock,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/database';
import { orderStatusConfig, cargoTypeLabels } from '@/lib/order-labels';

const TripMapbox = dynamic(() => import('@/components/trip-mapbox'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-secondary/30">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  ),
});

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Haydovchi holatni qanday o'zgartira oladi */
const NEXT_STEP: Partial<Record<OrderStatus, { next: OrderStatus; label: string; icon: typeof Truck }>> = {
  assigned: { next: 'in_transit', label: "Yo'lga chiqdim", icon: Truck },
  in_transit: { next: 'delivered', label: 'Yetkazildi', icon: CheckCircle2 },
};

export default function DriverCabinetPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'delivered' | 'all'>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mapOrderId, setMapOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch (err: any) {
      toast({
        title: "Reyslarni yuklab bo'lmadi",
        description: err?.message || 'Iltimos, sahifani qayta yuklang.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const active = orders.filter((o) => o.status === 'assigned' || o.status === 'in_transit');
    const earnings = delivered.reduce((sum, o) => sum + (o.actual_cost ?? o.estimated_cost), 0);
    const totalKm = delivered.reduce((sum, o) => {
      const dLat = o.destination_lat - o.origin_lat;
      const dLng = o.destination_lng - o.origin_lng;
      return sum + Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111);
    }, 0);
    return { delivered: delivered.length, active: active.length, earnings, totalKm };
  }, [orders]);

  const visible = useMemo(() => {
    if (filter === 'active') {
      return orders.filter((o) => o.status === 'assigned' || o.status === 'in_transit' || o.status === 'delayed');
    }
    if (filter === 'delivered') return orders.filter((o) => o.status === 'delivered');
    return orders;
  }, [orders, filter]);

  async function handleAdvance(order: Order) {
    const step = NEXT_STEP[order.status];
    if (!step) return;
    setUpdatingId(order.id);
    try {
      const patch: Record<string, unknown> = { status: step.next };
      if (step.next === 'delivered') patch.actual_arrival = new Date().toISOString();

      const { error } = await supabase.from('orders').update(patch).eq('id', order.id);
      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status: step.next, actual_arrival: step.next === 'delivered' ? new Date().toISOString() : o.actual_arrival }
            : o
        )
      );
      toast({
        title: step.next === 'delivered' ? 'Reys yakunlandi!' : "Yo'lga chiqdingiz",
        description:
          step.next === 'delivered'
            ? `${order.order_number} yetkazildi deb belgilandi. Rahmat!`
            : `${order.order_number} holati "Yo'lda" ga o'zgartirildi.`,
      });
    } catch (err: any) {
      toast({
        title: "Holatni o'zgartirib bo'lmadi",
        description: err?.message || "Qayta urinib ko'ring.",
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const statCards = [
    { label: 'Faol reyslar', value: stats.active, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Yetkazilgan', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Bosib o\u2018tilgan', value: `${stats.totalKm.toLocaleString('uz-UZ')} km`, icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: 'Umumiy daromad', value: `${stats.earnings.toLocaleString('uz-UZ')} so'm`, icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-5 animate-fade-in" data-testid="driver-cabinet-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Salom, {profile?.name?.split(' ')[0] || 'haydovchi'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sizga biriktirilgan reyslar va ularning holati
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} data-testid="driver-refresh-btn">
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Yangilash
        </Button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4" data-testid={`driver-stat-${s.label}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                {loading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-bold mt-1 truncate">{s.value}</p>
                )}
              </div>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                <s.icon className={cn('w-4 h-4', s.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtrlar */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="active" className="flex-1 sm:flex-none" data-testid="driver-filter-active">
            Faol ({orders.filter((o) => o.status === 'assigned' || o.status === 'in_transit' || o.status === 'delayed').length})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="flex-1 sm:flex-none" data-testid="driver-filter-delivered">
            Yetkazilgan ({stats.delivered})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1 sm:flex-none" data-testid="driver-filter-all">
            Barchasi ({orders.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reyslar */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center" data-testid="driver-empty-state">
          <Inbox className="w-9 h-9 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === 'active'
              ? "Hozircha faol reys yo'q. Dispetcher sizga reys biriktirgach, shu yerda paydo bo'ladi."
              : filter === 'delivered'
              ? "Hali yetkazilgan reys yo'q."
              : "Sizga hali reys biriktirilmagan."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const st = orderStatusConfig[order.status];
            const step = NEXT_STEP[order.status];
            const showMap = mapOrderId === order.id;
            const pickup = formatDate(order.pickup_date);
            const deadline = formatDate(order.delivery_deadline);

            return (
              <Card key={order.id} className="p-4 space-y-3" data-testid={`driver-trip-card-${order.order_number}`}>
                {/* Sarlavha */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" data-testid={`driver-trip-number-${order.order_number}`}>
                        {order.order_number}
                      </span>
                      <Badge variant="secondary" className={cn('font-medium', st.color, st.bg)}>
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cargoTypeLabels[order.cargo_type]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">To&apos;lov</p>
                    <p className="font-bold text-sm">
                      {(order.actual_cost ?? order.estimated_cost).toLocaleString('uz-UZ')} so&apos;m
                    </p>
                  </div>
                </div>

                {/* Yo'nalish */}
                <div className="rounded-lg bg-secondary/40 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium">{order.origin_address}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="font-medium">{order.destination_address}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Weight className="w-3.5 h-3.5" /> {order.cargo_weight} tonna
                    </span>
                    {pickup && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Yuklash: {pickup}
                      </span>
                    )}
                    {deadline && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Muddat: {deadline}
                      </span>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs">{order.notes}</p>
                  </div>
                )}

                {/* Xarita */}
                {showMap && (
                  <div className="h-56 w-full" data-testid={`driver-trip-map-${order.order_number}`}>
                    <TripMapbox
                      origin={{ lng: order.origin_lng, lat: order.origin_lat, label: order.origin_address }}
                      destination={{ lng: order.destination_lng, lat: order.destination_lat, label: order.destination_address }}
                    />
                  </div>
                )}

                {/* Amallar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapOrderId(showMap ? null : order.id)}
                    data-testid={`driver-trip-map-btn-${order.order_number}`}
                  >
                    <MapIcon className="w-3.5 h-3.5 mr-1.5" />
                    {showMap ? 'Xaritani yopish' : 'Marshrutni ko\u2018rish'}
                  </Button>

                  {step && (
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => handleAdvance(order)}
                      disabled={updatingId === order.id}
                      data-testid={`driver-trip-advance-btn-${order.order_number}`}
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <step.icon className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {step.label}
                    </Button>
                  )}

                  {order.status === 'delivered' && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Yakunlandi
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Yordam */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Package className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Qanday ishlaydi:</span> dispetcher sizga reys
            biriktiradi → yuk olgach <span className="font-medium text-foreground">&laquo;Yo&apos;lga chiqdim&raquo;</span> tugmasini
            bosasiz → manzilga yetib borgach <span className="font-medium text-foreground">&laquo;Yetkazildi&raquo;</span> deb
            belgilaysiz. Daromad avtomatik hisoblanadi.
          </div>
        </div>
      </Card>
    </div>
  );
}
