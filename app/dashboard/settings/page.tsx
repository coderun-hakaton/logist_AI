'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Lock, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCompany(profile.company || '');
    }
  }, [profile]);

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), phone: phone.trim() || null, company: company.trim() || null } as any)
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Profil saqlandi', description: "Ma'lumotlaringiz muvaffaqiyatli yangilandi." });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || 'Profilni saqlab boʻlmadi.', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast({ title: 'Parol juda qisqa', description: 'Parol kamida 6 belgidan iborat boʻlishi kerak.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Parollar mos emas", description: 'Ikkala parol bir xil boʻlishi kerak.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Parol yangilandi', description: 'Parolingiz muvaffaqiyatli oʻzgartirildi.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err?.message || 'Parolni oʻzgartirib boʻlmadi.', variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  }

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    dispatcher: 'Logistika dispetcheri',
    driver: 'Haydovchi',
    customer: 'Mijoz',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tizim sozlamalari</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Shaxsiy profil, xavfsizlik va akkaunt ma'lumotlari
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" data-testid="settings-tab-profile">
            <User className="w-4 h-4 mr-1.5" />
            Profil ma'lumotlari
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="settings-tab-security">
            <Lock className="w-4 h-4 mr-1.5" />
            Parol va xavfsizlik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Shaxsiy profil</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">To'liq ism (F.I.Sh)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="settings-fullname-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefon raqami</Label>
                <Input
                  placeholder="+998 90 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="settings-phone-input"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Elektron pochta</Label>
                <Input value={user?.email || ''} disabled data-testid="settings-email-input" />
                <p className="text-[11px] text-muted-foreground">Email manzilni o'zgartirib bo'lmaydi</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tizimdagi rol</Label>
                <div className="flex items-center h-9">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {profile?.role ? roleLabel[profile.role] || profile.role : '—'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Kompaniya</Label>
              <Input
                placeholder="Logistics Co."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                data-testid="settings-company-input"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={savingProfile} data-testid="settings-save-profile-btn">
              {savingProfile ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Profilni saqlash
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Parolni o'zgartirish</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Yangi parol</Label>
                <Input
                  type="password"
                  placeholder="Kamida 6 belgi"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="settings-new-password-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Yangi parolni tasdiqlang</Label>
                <Input
                  type="password"
                  placeholder="Parolni qayta kiriting"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="settings-confirm-password-input"
                />
              </div>
            </div>

            <Button onClick={handleChangePassword} disabled={savingPassword} data-testid="settings-update-password-btn">
              {savingPassword ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Parolni yangilash
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
