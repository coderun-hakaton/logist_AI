'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Route, Truck, Package, BarChart3, Settings,
  Bell, Search, LogOut, Menu, ChevronDown, User as UserIcon,
  Shield, Users, Loader2, Bot,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AIChatbot } from '@/components/ai-chatbot';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const isStaff = profile?.role === 'admin' || profile?.role === 'dispatcher';

  const navItems = [
    { href: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
    { href: '/dashboard/routes', label: 'Marshrut optimizatori', icon: Route },
    { href: '/dashboard/orders', label: 'Buyurtmalar', icon: Package },
    { href: '/dashboard/fleet', label: 'Avtopark', icon: Truck },
    { href: '/dashboard/drivers', label: 'Haydovchilar', icon: Users, staffOnly: true },
    { href: '/dashboard/analytics', label: 'Tahlil', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
  ].filter((item) => !item.staffOnly || isStaff);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.name || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = profile?.role
    ? { admin: 'Administrator', dispatcher: 'Dispetcher', driver: 'Haydovchi', customer: 'Mijoz' }[profile.role] || profile.role
    : 'Foydalanuvchi';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Route className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold tracking-tight block">Karvonboshi</span>
          <span className="text-xs text-muted-foreground">Marshrut intellekti</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              data-testid={`nav-${item.href.replace('/dashboard/', '').replace('/dashboard', 'home')}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-medium">Tizim holati</span>
          </div>
          <p className="text-xs text-muted-foreground">Barcha xizmatlar ishlayapti</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Kompyuter paneli */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:flex flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobil panel */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Asosiy kontent */}
      <div className="lg:pl-64">
        {/* Yuqori panel */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-lg border-b border-border h-16 flex items-center px-4 sm:px-6 gap-4">
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileSidebarOpen(true)}
            data-testid="topbar-mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Marshrut, buyurtma yoki transport izlash..."
              className="pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
              data-testid="topbar-search-input"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost" size="icon" className="relative"
              onClick={() => setChatbotOpen(!chatbotOpen)}
              data-testid="topbar-ai-chatbot-btn"
            >
              <Bot className="w-4 h-4" />
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center">AI</Badge>
            </Button>

            <Button variant="ghost" size="icon" className="relative" data-testid="topbar-notifications-btn">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors" data-testid="topbar-user-menu-btn">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium leading-tight">{profile?.name || 'Foydalanuvchi'}</div>
                    <div className="text-xs text-muted-foreground">{roleLabel}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{profile?.name || 'Foydalanuvchi'}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Sozlamalar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer" data-testid="topbar-signout-btn">
                  <LogOut className="w-4 h-4 mr-2" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Sahifa kontenti */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* AI chatbot vidjeti */}
      <AIChatbot open={chatbotOpen} onOpenChange={setChatbotOpen} />
    </div>
  );
}
