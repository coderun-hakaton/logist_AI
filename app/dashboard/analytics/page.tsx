'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Package, CheckCircle2, Wallet, TrendingUp, Truck } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Order, Vehicle } from '@/types/database';
import { orderStatusConfig } from '@/lib/order-labels';
import { uzbekistanCities } from '@/lib/uzbekistan-data';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  assigned: '#3B82F6',
  in_transit: '#6366F1',
  delivered: '#16A34A',
  cancelled: '#EF4444',
  delayed: '#FB923C',
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, vehiclesRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('vehicles').select('*'),
        ]);
        if (ordersRes.error) throw ordersRes.error;
        setOrders((ordersRes.data as unknown as Order[]) || []);
        setVehicles((vehiclesRes.data as unknown as Vehicle[]) || []);
      } catch (err: any) {
        toast({
          title: "Ma'lumotlarni yuklab bo'lmadi",
          description: err?.message || 'Iltimos, sahifani qayta yuklang.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status,
      name: orderStatusConfig[status as keyof typeof orderStatusConfig]?.label || status,
      value: count,
    }));
  }, [orders]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; cost: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('uz-UZ', { month: 'short' }),
        cost: 0,
        count: 0,
      });
    }
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m && o.status !== 'cancelled') {
        m.cost += o.estimated_cost;
        m.count += 1;
      }
    });
    return months;
  }, [orders]);

  const regionData = useMemo(() => {
    const byRegion: Record<string, number> = {};
    orders.forEach((o) => {
      const city = uzbekistanCities.find(
        (c) => c.name === o.origin_address || c.nameUz === o.origin_address
      );
      const region = city?.region || 'Boshqa';
      byRegion[region] = (byRegion[region] || 0) + o.cargo_weight;
    });
    return Object.entries(byRegion)
      .map(([region, tonna]) => ({ region, tonna: Math.round(tonna * 10) / 10 }))
      .sort((a, b) => b.tonna - a.tonna)
      .slice(0, 6);
  }, [orders]);

  const kpi = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const active = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered');
    const totalCost = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.estimated_cost, 0);
    return {
      total: orders.length,
      delivered: delivered.length,
      active: active.length,
      totalCost,
      avgCost: orders.length ? Math.round(totalCost / orders.length) : 0,
      onTimeRate: orders.length
        ? Math.round((delivered.filter((o) => o.status === 'delivered').length / orders.length) * 100)
        : 0,
    };
  }, [orders]);

  const kpiCards = [
    { label: 'Jami buyurtmalar', value: kpi.total, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Yetkazilgan', value: kpi.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: "Faol (yo'lda/kutilmoqda)", value: kpi.active, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    {
      label: 'Umumiy aylanma',
      value: `${kpi.totalCost.toLocaleString('uz-UZ')} so'm`,
      icon: Wallet,
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="analytics-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logistika tahlili va hisobotlar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Xarajatlar, yetkazish dinamikasi va buyurtmalar statistikasi
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((s) => (
          <Card key={s.label} className="p-4" data-testid={`analytics-kpi-${s.label}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Tahlil uchun hali ma'lumot yo'q. Buyurtmalar yaratilgach, hisobotlar shu yerda paydo bo'ladi.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status donut */}
          <Card className="p-5" data-testid="chart-orders-status-donut">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Buyurtmalar holat taqsimoti
              </h2>
              <Badge variant="secondary" className="text-xs">{orders.length} ta</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} ta`, name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Monthly cost */}
          <Card className="p-5" data-testid="chart-monthly-cost-bar">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              Oylik yuk tashish xarajati (UZS)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v.toLocaleString('uz-UZ')} so'm`, 'Xarajat']}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Region volume */}
          <Card className="p-5 lg:col-span-2" data-testid="chart-region-volume-bar">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-primary" />
              Viloyatlar bo'yicha yuk tashish hajmi (tonna)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="region" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => [`${v} t`, 'Hajm']} />
                  <Bar dataKey="tonna" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
