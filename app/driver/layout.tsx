'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Route, LogOut, Loader2, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isStaff = profile?.role === 'admin' || profile?.role === 'dispatcher';

  const initials = (profile?.name || user.email || 'H')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Route className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-bold tracking-tight leading-tight">Karvonboshi</div>
            <div className="text-xs text-muted-foreground">Haydovchi kabineti</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isStaff && (
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="outline" size="sm" data-testid="driver-to-dashboard-btn">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Dispetcher paneli
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                  data-testid="driver-user-menu-btn"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
                    {profile?.name || 'Haydovchi'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{profile?.name || 'Haydovchi'}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  <Badge variant="secondary" className="mt-1.5 bg-primary/10 text-primary text-[10px]">
                    Haydovchi
                  </Badge>
                </div>
                {isStaff && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dispetcher paneli
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer"
                  data-testid="driver-signout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">{children}</main>
    </div>
  );
}
