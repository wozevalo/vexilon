'use client';

import React, { useState } from 'react';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ok = await login(email, password);
    if (ok) {
      router.push('/admin/blog');
    } else {
      setError('Email ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-vexilon-primary mb-6">
            <Lock className="w-7 h-7 text-vexilon-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-widest">
            admin
          </h1>
          <p className="text-gray-500 mt-2 text-sm">accès restreint</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-vexilon-primary transition-colors"
                
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-vexilon-primary transition-colors"
                placeholder="••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm py-3 hover:bg-vexilon-primary/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-8">
          <a href="/" className="text-gray-600 hover:text-gray-400 text-xs uppercase tracking-widest transition-colors">
            ← Retour au site
          </a>
        </div>
      </div>
    </div>
  );
}
