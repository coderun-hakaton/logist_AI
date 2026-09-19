'use client';

import { useEffect, useState } from 'react';
import {
  Truck, Plus, Loader2, Trash2, Fuel, Weight, Wrench, CircleDot,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Vehicle, VehicleStatus, VehicleType, FuelType } from '@/types/database';
import { cn } from '@/lib/utils';

const typeLabels: Record<VehicleType, string> = {
  truck: 'Yuk mashinasi (tentli)',
  van: 'Furgon',
  refrigerated: 'Refrijerator',
  semi: 'Yarim tirkama',
  container: 'Konteyner tashuvchi',
};

const fuelLabels: Record<FuelType, string> = {
  diesel: 'Dizel',
  petrol: 'Benzin',
  gas: 'Metan (CNG)',
  electric: 'Elektr',
};

const statusLabels: Record<VehicleStatus, { label: string; color: string; bg: string }> = {
  available: { label: "Bo'sh (tayyor)", color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  on_route: { label: "Yo'lda (band)", color: 'text-blue-800 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  maintenance: { label: "Texnik xizmatda", color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  offline: { label: 'Rezervda', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-200/70 dark:bg-slate-800' },
};

export default function FleetPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<VehicleType>('truck');
  const [capacity, setCapacity] = useState('20');
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [consumption, setConsumption] = useState('30');
  const [dimensions, setDimensions] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVehicles((data as unknown as Vehicle[]) || []);
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

  const counts = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'available').length,
    onRoute: vehicles.filter((v) => v.status === 'on_route').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
  };

  async function handleSave() {
    if (!user) return;
    if (!plate.trim()) {
      toast({ title: "Davlat raqami kerak", description: "Iltimos, transport davlat raqamini kiriting.", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const base = {
        owner_id: user.id,
        type,
        capacity: Number(capacity) || 0,
        dimensions: dimensions.trim() || null,
        license_plate: plate.trim().toUpperCase(),
        fuel_type: fuelType,
        fuel_consumption: Number(consumption) || 0,
        status: 'available',
      };

      // "brand" ustuni bulutdagi bazada hali yo'q bo'lishi mumkin —
      // shu holda uni tashlab, qaytadan urinamiz.
      let { error } = await supabase.from('vehicles').insert({ ...base, brand: brand.trim() || null });
      if (error && (error.code === '42703' || /brand/i.test(error.message))) {
        const retry = await supabase.from('vehicles').insert(base);
        error = retry.error;
      }
      if (error) throw error;
      toast({ title: 'Transport saqlandi', description: `${plate.trim().toUpperCase()} avtoparkga qo'shildi.` });
      setDialogOpen(false);
      setPlate('');
      setBrand('');
      setType('truck');
      setCapacity('20');
      setFuelType('diesel');
      setConsumption('30');
      setDimensions('');
      await loadData();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || 'Transportni saqlab boʻlmadi.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(v: Vehicle, status: VehicleStatus) {
    try {
      const { error } = await supabase.from('vehicles').update({ status } as any).eq('id', v.id);
      if (error) throw error;
      setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, status } : x)));
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || 'Holatni oʻzgartirib boʻlmadi.', variant: 'destructive' });
    }
  }

  async function handleDelete(v: Vehicle) {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', v.id);
      if (error) throw error;
      setVehicles((prev) => prev.filter((x) => x.id !== v.id));
      toast({ title: "O'chirildi", description: `${v.license_plate} avtoparkdan o'chirildi.` });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || "O'chirib bo'lmadi.", variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="fleet-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avtopark (Transport vositalari)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kompaniya va hamkor transport vositalarining texnik holati va marshrutlari
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="add-vehicle-open-dialog-btn">
          <Plus className="w-4 h-4 mr-2" />
          Yangi transport qo'shish
        </Button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jami mashinalar', value: counts.total, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
          { label: "Bo'sh (tayyor)", value: counts.available, icon: CircleDot, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: "Yo'lda", value: counts.onRoute, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: "Ta'mirda", value: counts.maintenance, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-500/10' },
        ].map((s) => (
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

      {/* Vehicle grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Hozircha transport qo'shilmagan</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)} data-testid="fleet-empty-add-btn">
            Birinchi transportni qo'shing
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const st = statusLabels[v.status];
            return (
              <Card key={v.id} className="p-4 space-y-3 hover:shadow-md transition-shadow" data-testid={`vehicle-card-${v.license_plate}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-base border-2 border-primary/60 bg-primary/5 rounded-md px-2.5 py-1 tracking-wider" data-testid={`vehicle-plate-${v.license_plate}`}>
                    {v.license_plate}
                  </span>
                  <Badge variant="secondary" className={cn('font-medium', st.color, st.bg)}>{st.label}</Badge>
                </div>

                <div>
                  <p className="font-semibold">{v.brand || typeLabels[v.type]}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[v.type]}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Weight className="w-3.5 h-3.5 shrink-0" />
                    {v.capacity} t sig'im
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Fuel className="w-3.5 h-3.5 shrink-0" />
                    {v.fuel_consumption} L/100km · {fuelLabels[v.fuel_type]}
                  </div>
                  {v.dimensions && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <CircleDot className="w-3.5 h-3.5 shrink-0" />
                      O'lchamlari: {v.dimensions}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Select value={v.status} onValueChange={(val) => handleStatusChange(v, val as VehicleStatus)}>
                    <SelectTrigger className="h-8 flex-1 text-xs" data-testid={`vehicle-status-select-${v.license_plate}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabels) as VehicleStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(v)}
                    data-testid={`vehicle-delete-btn-${v.license_plate}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add vehicle dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="add-vehicle-dialog">
          <DialogHeader>
            <DialogTitle>Yangi transport qo'shish</DialogTitle>
            <DialogDescription>Transport vositasining texnik ma'lumotlarini kiriting.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Davlat raqami</Label>
                <Input
                  placeholder="01 A 777 AA"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="font-mono uppercase"
                  data-testid="vehicle-plate-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Markasi va modeli</Label>
                <Input
                  placeholder="MAN TGX 18.440"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  data-testid="vehicle-model-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Kuzov turi</Label>
              <Select value={type} onValueChange={(v) => setType(v as VehicleType)}>
                <SelectTrigger data-testid="vehicle-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeLabels) as VehicleType[]).map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Yuk ko'tarish (tonna)</Label>
                <Input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} data-testid="vehicle-capacity-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sarf (L/100km)</Label>
                <Input type="number" min="0" value={consumption} onChange={(e) => setConsumption(e.target.value)} data-testid="vehicle-consumption-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Yoqilg'i turi</Label>
                <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelType)}>
                  <SelectTrigger data-testid="vehicle-fuel-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(fuelLabels) as FuelType[]).map((f) => (
                      <SelectItem key={f} value={f}>{fuelLabels[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">O'lchamlari (ixtiyoriy)</Label>
                <Input placeholder="92 m³" value={dimensions} onChange={(e) => setDimensions(e.target.value)} data-testid="vehicle-dimensions-input" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-vehicle-submit-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
              Transportni saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
