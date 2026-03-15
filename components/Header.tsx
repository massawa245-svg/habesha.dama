'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import CoinBalance from '@/components/coins/CoinBalance'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
    setLoading(false)
    setIsOpen(false)
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/'
    setLoading(false)
    setIsOpen(false)
  }

  return (
    <header className="relative z-50 mb-6">
      <div className="flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-xl">
            <span className="text-2xl animate-bounce">🇪🇹</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white whitespace-nowrap">
            Habesha Dama
          </h1>
        </div>

        {/* ── Desktop Rechts ── */}
        <div className="hidden md:flex items-center gap-3">

          {user ? (
            <>
              {/* Profil Pill */}
              <div className="flex items-center gap-2 bg-white/10 h-11 px-4 rounded-full">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-sm">
                    👤
                  </div>
                )}
                <span className="text-white text-sm font-medium">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="h-11 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-full text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <span>{loading ? '⏳' : '🚪'}</span>
                <span className="hidden lg:inline">Abmelden</span>
              </button>
            </>
          ) : (
            /* Login Button */
            <button
              onClick={handleLogin}
              disabled={loading}
              className="h-11 px-5 bg-white hover:bg-gray-100 text-gray-800 rounded-full text-sm font-medium transition-all hover:scale-105 shadow-xl flex items-center gap-2 whitespace-nowrap"
            >
              <GoogleIcon />
              <span>Anmelden</span>
            </button>
          )}

          {/* Coins */}
          {user && <CoinBalance />}

          {/* Language */}
          <div className="h-11 flex items-center">
            <LanguageSwitcher />
          </div>

        </div>

        {/* ── Hamburger (Mobile) ── */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center gap-1.5 transition-all shrink-0"
          aria-label="Menü"
        >
          <span className={`w-5 h-0.5 bg-amber-300 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-5 h-0.5 bg-amber-300 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`w-5 h-0.5 bg-amber-300 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

      </div>

      {/* ── Mobile Menü ── */}
      {isOpen && (
        <div className="absolute right-0 top-16 w-72 bg-gradient-to-b from-amber-900 to-amber-950 rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden md:hidden animate-slide-down z-50">
          {user ? (
            <div className="p-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-2xl">👤</div>
                )}
                <div>
                  <p className="text-white font-bold">{user.user_metadata?.full_name || 'Spieler'}</p>
                  <p className="text-amber-300 text-sm">{user.email || ''}</p>
                </div>
              </div>

              {/* Coins Mobile */}
              <div className="flex justify-center">
                <CoinBalance />
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full h-12 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? '⏳' : '🚪'}</span>
                <span>Abmelden</span>
              </button>
            </div>
          ) : (
            <div className="p-5">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-14 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-medium transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3"
              >
                <GoogleIcon size={22} />
                <span className="text-base">Mit Google anmelden</span>
              </button>
            </div>
          )}

          {/* Language unten */}
          <div className="p-4 border-t border-amber-500/20 bg-black/20">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  )
}

// ── Google SVG Icon ──────────────────────────────────────────────────────────
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}