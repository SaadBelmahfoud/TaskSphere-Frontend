'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import TokenTimer from './TokenTimer';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { label: 'Mes Tâches', href: '/tasks', icon: '📋' },
    { label: 'Test Ownership', href: '/ownership', icon: '🔒' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + Navigation */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push('/tasks')}
              className="text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              TaskSphere
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* User info + Timer + Logout */}
          <div className="flex items-center gap-4">
            <TokenTimer expiry={auth.tokenExpiry} />

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-700">{auth.email}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                {auth.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden flex gap-1 pb-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-center ${
                pathname === item.href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
