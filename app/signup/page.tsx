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
  { value: 'dispatcher', label: 'Dispatcher', desc: 'Plan routes, manage fleet, create orders' },
  { value: 'admin', label: 'Admin', desc: 'Full platform access and analytics' },
  { value: 'driver', label: 'Driver', desc: 'Navigation, status updates, feedback' },
  { value: 'customer', label: 'Customer', desc: 'Track orders and delivery status' },
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
      router.push('/dashboard');
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp(email, password, name, role, company);
    if (error) {
      toast({ title: 'Sign up failed', description: error, variant: 'destructive' });
    } else if (needsEmailConfirmation) {
      setAwaitingConfirmation(true);
      toast({ title: 'Almost there!', description: 'Check your email to confirm your account.' });
    } else {
      toast({ title: 'Account created!', description: 'Welcome to Karvonboshi. Redirecting to dashboard...' });
      router.push('/dashboard');
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start optimizing routes across Uzbekistan</p>
        </div>

        {awaitingConfirmation ? (
          <Card className="p-8 shadow-lg text-center space-y-4">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Account Type</Label>
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
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" placeholder="Akmal Karimov" value={name} onChange={(e) => setName(e.target.value)} required className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@company.uz" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="company" placeholder="Logistics Co." value={company} onChange={(e) => setCompany(e.target.value)} className="pl-9" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}
