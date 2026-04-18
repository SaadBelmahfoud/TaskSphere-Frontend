'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // Error is handled by the context
    }
  };

  const quickLogins = [
    { label: 'USER', email: 'saadoune@tasksphere.com', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'MANAGER', email: 'manager@tasksphere.com', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'ADMIN', email: 'admin@tasksphere.com', color: 'bg-red-50 text-red-700 border-red-200' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TaskSphere</h1>
          <p className="text-gray-500">Connectez-vous pour accéder à vos tâches</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                required
                placeholder="votre@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">
              Accès rapide (mot de passe : password123)
            </p>
            <div className="flex gap-2">
              {quickLogins.map((quick) => (
                <button
                  key={quick.label}
                  onClick={() => {
                    setEmail(quick.email);
                    setPassword('password123');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:opacity-80 ${quick.color}`}
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          TaskSphere Frontend — Sprint 1 • JWT Auth + CRUD + Ownership
        </p>
      </div>
    </div>
  );
}
