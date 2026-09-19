'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Route, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, profile } = useAuth();
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
    const { error } = await signIn(email, password);
    if (error) {
      const isUnconfirmed = /not confirmed|email_not_confirmed/i.test(error);
      toast({
        title: isUnconfirmed ? 'Email tasdiqlanmagan' : 'Kirish amalga oshmadi',
        description: isUnconfirmed
          ? "Akkauntingiz email orqali tasdiqlanmagan. Emailingizdagi tasdiqlash havolasini bosing yoki administrator Supabase sozlamalarida \"Confirm email\"ni o'chirib qo'ysin."
          : error,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      toast({ title: 'Xush kelibsiz!', description: 'Tizimga muvaffaqiyatli kirdingiz.' });
      // Rol aniqlanishi bilan yuqoridagi useEffect to'g'ri sahifaga yo'naltiradi
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-background dark:via-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Route className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Xush kelibsiz</h1>
          <p className="text-sm text-muted-foreground mt-1">Karvonboshi akkauntingizga kiring</p>
        </div>

        <Card className="p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Elektron pochta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="siz@kompaniya.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9"
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9"
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Kirish
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p>
              Akkauntingiz yo&apos;qmi?{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </p>
            <p className="text-muted-foreground">
              Haydovchimisiz?{' '}
              <Link href="/driver-apply" className="text-primary font-medium hover:underline">
                Ariza topshiring
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
