'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, Truck, Clock, TrendingDown, ArrowUpRight, ArrowRight,
  CircleDot, AlertCircle, CheckCircle2, Wrench, MapPin, Activity,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { UzbekistanMap } from '@/components/uzbekistan-map';
import { supabase } from '@/lib/supabase';
import { Order, Vehicle, OrderStatus, VehicleStatus, Waypoint } from '@/types/database';
import { uzbekistanCities } from '@/lib/uzbekistan-data';
import { cn } from '@/lib/utils';

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted' },
  assigned: { label: 'Assigned', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  in_transit: { label: 'In Transit', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  delivered: { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  delayed: { label: 'Delayed', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

const vehicleStatusConfig: Record<VehicleStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'text-green-600' },
  on_route: { label: 'On Route', color: 'text-blue-600' },
  maintenance: { label: 'Maintenance', color: 'text-amber-600' },
  offline: { label: 'Offline', color: 'text-red-600' },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        setOrders((ordersData as unknown as Order[]) || []);
        setVehicles((vehiclesData as unknown as Vehicle[]) || []);
      } catch (err) {
        // Silent fail - empty dashboard is fine for new users
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
      link: '/dashboard/orders',
    },
    {
      label: 'Active Drivers',
      value: vehicles.filter((v) => v.status === 'on_route').length,
      icon: Truck,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      link: '/dashboard/fleet',
    },
    {
      label: 'Available Vehicles',
      value: vehicles.filter((v) => v.status === 'available').length,
      icon: CircleDot,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      link: '/dashboard/fleet',
    },
    {
      label: 'Cost Savings',
      value: '18%',
      icon: TrendingDown,
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
      link: '/dashboard/analytics',
    },
  ];

  // Create sample waypoints from recent orders for the map
  const mapWaypoints: Waypoint[] = orders.slice(0, 3).flatMap((order) => [
    { lat: order.origin_lat, lng: order.origin_lng, address: order.origin_address, type: 'origin' as const, name: order.origin_address },
    { lat: order.destination_lat, lng: order.destination_lng, address: order.destination_address, type: 'destination' as const, name: order.destination_address },
  ]);

  // If no orders, show sample waypoints connecting major cities
  const displayWaypoints = mapWaypoints.length > 0 ? mapWaypoints : [
    { lat: 41.2995, lng: 69.2401, address: 'Tashkent', type: 'origin' as const, name: 'Tashkent' },
    { lat: 39.6542, lng: 66.9597, address: 'Samarkand', type: 'destination' as const, name: 'Samarkand' },
    { lat: 39.7747, lng: 64.4286, address: 'Bukhara', type: 'destination' as const, name: 'Bukhara' },
  ];

  const fleetStats = {
    available: vehicles.filter((v) => v.status === 'available').length,
    onRoute: vehicles.filter((v) => v.status === 'on_route').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
    offline: vehicles.filter((v) => v.status === 'offline').length,
  };

  const totalVehicles = vehicles.length || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening with your logistics operations today.
          </p>
        </div>
        <Link href="/dashboard/routes">
          <Button>
            Optimize New Route
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                )}
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </div>
            <Link href={stat.link} className="text-xs text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1 transition-colors">
              View details
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </Card>
        ))}
      </div>

      {/* Map + Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Active Routes Map
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time overview of routes across Uzbekistan</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              {displayWaypoints.length / 2} active
            </Badge>
          </div>
          <div className="aspect-[8/5] w-full">
            <UzbekistanMap waypoints={displayWaypoints} showCities={true} />
          </div>
        </Card>

        {/* Fleet Status */}
        <Card className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-primary" />
            Fleet Status
          </h2>

          <div className="space-y-4">
            {[
              { label: 'Available', count: fleetStats.available, color: 'bg-green-500', text: 'text-green-600' },
              { label: 'On Route', count: fleetStats.onRoute, color: 'bg-blue-500', text: 'text-blue-600' },
              { label: 'Maintenance', count: fleetStats.maintenance, color: 'bg-amber-500', text: 'text-amber-600' },
              { label: 'Offline', count: fleetStats.offline, color: 'bg-red-500', text: 'text-red-600' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', item.color)} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className={cn('text-sm font-bold', item.text)}>{item.count}</span>
                </div>
                <Progress value={(item.count / totalVehicles) * 100} className="h-1.5" />
              </div>
            ))}
          </div>

          <Link href="/dashboard/fleet" className="block mt-5">
            <Button variant="outline" size="sm" className="w-full">
              Manage Fleet
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Recent Orders
          </h2>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <Link href="/dashboard/orders">
              <Button variant="outline" size="sm" className="mt-3">
                Create your first order
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left font-medium py-2.5 pr-4">Order #</th>
                  <th className="text-left font-medium py-2.5 pr-4 hidden md:table-cell">Route</th>
                  <th className="text-left font-medium py-2.5 pr-4 hidden sm:table-cell">Cargo</th>
                  <th className="text-left font-medium py-2.5 pr-4">Status</th>
                  <th className="text-right font-medium py-2.5">Cost</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{order.order_number}</td>
                      <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground">
                        {order.origin_address} → {order.destination_address}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">
                        {order.cargo_weight}t · {order.cargo_type}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className={cn('font-medium', status.color, status.bg)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {order.estimated_cost.toLocaleString()} UZS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
