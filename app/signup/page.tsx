'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Route, Mail, Lock, User, Building2, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const roles = [
  { value: 'dispatcher', label: 'Dispetcher', desc: "Marshrutlar rejalashtirish, avtopark va buyurtmalar boshqarish" },
  { value: 'admin', label: 'Administrator', desc: "Platformaning to'liq imkoniyatlari va tahlil" },
  { value: 'driver', label: 'Haydovchi', desc: 'Navigatsiya, holat yangilash va fikr bildirish' },
  { value: 'customer', label: 'Mijoz', desc: 'Buyurtmalarni va yetkazish holatini kuzatish' },
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('dispatcher');
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const { signUp, user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      router.push(profile.role === 'driver' ? '/driver' : '/dashboard');
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp(email, password, name, role, company);
    if (error) {
      toast({ title: "Ro'yxatdan o'tish amalga oshmadi", description: error, variant: 'destructive' });
    } else if (needsEmailConfirmation) {
      setAwaitingConfirmation(true);
      toast({ title: 'Deyarli tayyor!', description: 'Emailingizni tekshirib, akkauntni tasdiqlang.' });
    } else {
      toast({ title: 'Akkaunt yaratildi!', description: "Karvonboshiga xush kelibsiz. Sahifaga o'tyapmiz..." });
      // Rol aniqlanishi bilan yuqoridagi useEffect to'g'ri sahifaga yo'naltiradi
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-background dark:via-background px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Route className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Akkaunt yarating</h1>
          <p className="text-sm text-muted-foreground mt-1">O'zbekiston bo'ylab marshrutlarni optimallashtirishni boshlang</p>
        </div>

        {awaitingConfirmation ? (
          <Card className="p-8 shadow-lg text-center space-y-4" data-testid="signup-await-confirmation">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Emailingizni tasdiqlang</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Biz <span className="font-medium text-foreground">{email}</span> manziliga tasdiqlash havolasini yubordik.
                Hisobingizni faollashtirish uchun shu havolani bosing, so'ng tizimga kiring.
              </p>
            </div>
            <Link href="/login" className="inline-block text-sm text-primary font-medium hover:underline">
              Kirish sahifasiga o'tish
            </Link>
          </Card>
        ) : (
        <Card className="p-6 shadow-lg max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
            <div className="space-y-2">
              <Label>Akkaunt turi</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      role === r.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    )}
                    data-testid={`signup-role-${r.value}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{r.label}</span>
                      {role === r.value && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">To'liq ism</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" placeholder="Akmal Karimov" value={name} onChange={(e) => setName(e.target.value)} required className="pl-9" data-testid="signup-name-input" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Elektron pochta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="siz@kompaniya.uz" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" data-testid="signup-email-input" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Kamida 8 belgi" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pl-9" data-testid="signup-password-input" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Kompaniya (ixtiyoriy)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="company" placeholder="Logistics Co." value={company} onChange={(e) => setCompany(e.target.value)} className="pl-9" data-testid="signup-company-input" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} data-testid="signup-submit-btn">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Akkaunt yaratish
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Akkauntingiz bormi?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Kirish
            </Link>
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}
