'use client';

import { memo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import TokenTimer from './TokenTimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, ClipboardList, Shield } from 'lucide-react';

const navItems = [
  { label: 'Mes Tâches', href: '/tasks', icon: ClipboardList },
  { label: 'Test Ownership', href: '/ownership', icon: Shield },
];

function NavbarInner() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-card border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push('/tasks')}
              className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
            >
              TaskSphere
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className={isActive ? 'text-primary' : ''}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TokenTimer expiry={auth.tokenExpiry} />

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{auth.email}</span>
              <Badge variant="secondary" className="text-xs">
                {auth.role}
              </Badge>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>

        <div className="sm:hidden flex gap-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => router.push(item.href)}
                className={`flex-1 text-xs ${isActive ? 'text-primary' : ''}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const Navbar = memo(NavbarInner);
Navbar.displayName = 'Navbar';
export default Navbar;
