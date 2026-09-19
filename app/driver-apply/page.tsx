'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Route, User, Phone, Truck, FileText, CheckCircle2, Loader2,
  ArrowRight, Hash, Weight, ShieldCheck, Headphones, BadgeDollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { createDriverApplication } from '@/lib/api';
import { formatUzPhone } from '@/lib/driver-onboarding';
import { uzbekistanCities } from '@/lib/uzbekistan-data';
import { useToast } from '@/hooks/use-toast';

const licenseCategories = ['B', 'C', 'BC', 'CE', 'DE'];

const trustBadges = [
  { icon: BadgeDollarSign, label: "Kafolatlangan to'lovlar" },
  { icon: Headphones, label: '24/7 dispetcher yordami' },
  { icon: ShieldCheck, label: '7-faktorli yoʻnalishlar' },
];

export default function DriverApplyPage() {
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [hasVehicle, setHasVehicle] = useState<'yes' | 'no'>('yes');
  const [carBrand, setCarBrand] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [categories, setCategories] = useState<string[]>(['C']);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [techPassportFile, setTechPassportFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function uploadDoc(file: File | null): Promise<string | null> {
    if (!file) return null;
    try {
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const { error } = await supabase.storage.from('driver-docs').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) return null;
      const { data } = supabase.storage.from('driver-docs').getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  }
  async function handleSubmit() {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Ism kerak", description: 'Ism va familiyangizni kiriting.', variant: 'destructive' });
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      toast({ title: 'Telefon raqami noto\u2019g\u2019ri', description: "Masalan: +998 90 123 45 67", variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Parol juda qisqa', description: 'Kamida 6 belgidan iborat parol kiriting.', variant: 'destructive' });
      return;
    }
    if (!agreed) {
      toast({ title: 'Rozilik kerak', description: "Qoidalarga rozilik bildirishingiz kerak.", variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const [licenseUrl, techUrl] = await Promise.all([
        uploadDoc(licenseFile),
        uploadDoc(techPassportFile),
      ]);
      if ((licenseFile && !licenseUrl) || (techPassportFile && !techUrl)) {
        toast({
          title: 'Hujjatlarni yuklashda ogohlantirish',
          description: "Fayllar yuklanmadi — ariza hujjatsiz yuborildi. Dispecher sizdan keyin so'raydi.",
        });
      }

      await createDriverApplication({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: formatUzPhone(phone),
        password,
        city: city || null,
        experience_years: experience ? Number(experience) : null,
        has_vehicle: hasVehicle === 'yes',
        car_brand: carBrand.trim() || null,
        car_plate: carPlate.trim().toUpperCase() || null,
        capacity_kg: capacityKg ? Number(capacityKg) : null,
        license_categories: categories.join(', ') || null,
        license_image_url: licenseUrl,
        tech_passport_image_url: techUrl,
      });

      setSubmitted(true);    } catch (err: any) {
      toast({
        title: 'Arizani yuborib bo\u2019lmadi',
        description: err?.message || 'Iltimos, keyinroq qayta urinib ko\u2018ring.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-background dark:via-background px-4">
        <Card className="max-w-md w-full p-8 text-center shadow-lg space-y-4" data-testid="driver-apply-success">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold">Arizangiz qabul qilindi!</h1>
          <p className="text-sm text-muted-foreground">
            Tez orada dispetcherimiz siz bilan ko'rsatilgan telefon raqami orqali bog'lanadi.
            Karvonboshi oilasiga xush kelibsiz!
          </p>
          <Link href="/">
            <Button variant="outline" className="w-full">Bosh sahifaga qaytish</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-cyan-50/40 dark:from-background dark:via-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 dark:bg-background/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Route className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Karvonboshi</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">Bosh sahifa</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10" data-testid="driver-apply-page">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Truck className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Haydovchilar uchun vakansiya
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Karvonboshi jamoasiga haydovchi sifatida qo'shiling
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            O'zbekiston bo'ylab eng qulay va daromadli reyslar. Ariza topshirish 3 daqiqa vaqt oladi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {trustBadges.map((b) => (
              <Badge key={b.label} variant="outline" className="gap-1.5">
                <b.icon className="w-3.5 h-3.5 text-primary" />
                {b.label}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="p-6 shadow-lg space-y-8" data-testid="driver-apply-form">
          {/* Step 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">1</span>
              <h2 className="font-semibold">Shaxsiy ma'lumotlar</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ism</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rustam"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-9"
                    data-testid="driver-apply-firstname-input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Familiya</Label>
                <Input
                  placeholder="Karimov"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="driver-apply-lastname-input"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telefon raqamingiz (bog'lanish uchun)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    data-testid="driver-apply-phone-input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Parol (tizimga kirish uchun)</Label>
                <Input
                  type="password"
                  placeholder="Kamida 6 belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="driver-apply-password-input"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Yashash hududingiz</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger data-testid="driver-apply-city-select">
                    <SelectValue placeholder="Viloyat / shahar" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {uzbekistanCities
                      .filter((c) => c.region !== 'Kazakhstan' && c.region !== 'Tajikistan' && c.region !== 'Russia')
                      .map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name} ({c.nameUz})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Haydovchilik tajribasi (yil)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  data-testid="driver-apply-experience-input"
                />
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">2</span>
              <h2 className="font-semibold">Transport vositasi ma'lumotlari</h2>
            </div>

            <div className="grid grid-cols-2 gap-2" data-testid="driver-apply-has-truck-radio">
              <button
                type="button"
                onClick={() => setHasVehicle('yes')}
                className={`p-3 rounded-lg border text-left text-sm transition-all ${
                  hasVehicle === 'yes' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                }`}
                data-testid="driver-apply-has-vehicle-yes"
              >
                Ha, shaxsiy mashinam bor
              </button>
              <button
                type="button"
                onClick={() => setHasVehicle('no')}
                className={`p-3 rounded-lg border text-left text-sm transition-all ${
                  hasVehicle === 'no' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                }`}
                data-testid="driver-apply-has-vehicle-no"
              >
                Yo'q, kompaniya mashinasida ishlamoqchiman
              </button>
            </div>

            {hasVehicle === 'yes' && (
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mashina rusumi</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Isuzu yoki MAN"
                      value={carBrand}
                      onChange={(e) => setCarBrand(e.target.value)}
                      className="pl-9"
                      data-testid="driver-apply-truck-model-input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Davlat raqami</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="01 A 123 AA"
                      value={carPlate}
                      onChange={(e) => setCarPlate(e.target.value)}
                      className="pl-9 font-mono uppercase"
                      data-testid="driver-apply-truck-plate-input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Yuk ko'tarish (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      placeholder="20000"
                      value={capacityKg}
                      onChange={(e) => setCapacityKg(e.target.value)}
                      className="pl-9"
                      data-testid="driver-apply-capacity-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Step 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">3</span>
              <h2 className="font-semibold">Hujjatlar va guvohnoma</h2>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Haydovchilik guvohnomasi toifalari</Label>
              <div className="flex flex-wrap gap-2" data-testid="driver-apply-license-categories">
                {licenseCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
                    }
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      categories.includes(cat)
                        ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                    data-testid={`driver-apply-license-cat-${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Guvohnoma nusxasi (foto yoki PDF)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                    className="pl-9 text-xs pt-2"
                    data-testid="driver-apply-license-upload"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Texnik pasport nusxasi</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setTechPassportFile(e.target.files?.[0] || null)}
                  className="text-xs pt-2"
                  data-testid="driver-apply-passport-upload"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                data-testid="driver-apply-terms-checkbox"
              />
              <Label htmlFor="terms" className="text-xs font-normal leading-relaxed cursor-pointer">
                Qoidalar va shaxsiy ma'lumotlarni qayta ishlashga roziman
              </Label>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} size="lg" className="w-full" data-testid="driver-apply-submit-btn">
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Arizani yuborish
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Ariza yuborilgach, admin tomonidan ko'rib chiqiladi va tasdiqlangach telefon raqamingiz bilan tizimga kirasiz.
            </p>
          </section>
        </Card>
      </main>
    </div>
  );
}
