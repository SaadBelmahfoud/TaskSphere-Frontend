'use client';

import { memo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import TokenTimer from './TokenTimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, ClipboardList, Shield, Columns3, Sun, Moon, BarChart3, ShieldCheck } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'My Tasks', href: '/tasks', icon: ClipboardList },
  { label: 'Kanban', href: '/kanban', icon: Columns3 },
  { label: 'Ownership', href: '/ownership', icon: Shield },
];

const adminNavItem = { label: 'Admin', href: '/admin', icon: ShieldCheck };

function NavbarInner() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
              {auth.role === 'ADMIN' && (() => {
                const Icon = adminNavItem.icon;
                const isActive = pathname === adminNavItem.href;
                return (
                  <Button
                    key={adminNavItem.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => router.push(adminNavItem.href)}
                    className={isActive ? 'text-primary' : 'text-red-600 hover:text-red-700'}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {adminNavItem.label}
                  </Button>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TokenTimer expiry={auth.tokenExpiry} />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{auth.email}</span>
              <Badge variant="secondary" className="text-xs">
                {auth.role}
              </Badge>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        <div className="sm:hidden flex gap-1 pb-2 flex-wrap">
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
          {auth.role === 'ADMIN' && (() => {
            const Icon = adminNavItem.icon;
            const isActive = pathname === adminNavItem.href;
            return (
              <Button
                key={adminNavItem.href}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => router.push(adminNavItem.href)}
                className={`flex-1 text-xs ${isActive ? 'text-primary' : 'text-red-600 hover:text-red-700'}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {adminNavItem.label}
              </Button>
            );
          })()}
        </div>
      </div>
    </nav>
  );
}

const Navbar = memo(NavbarInner);
Navbar.displayName = 'Navbar';
export default Navbar;
