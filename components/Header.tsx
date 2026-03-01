'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`
      }
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
      {/* Hauptzeile */}
      <div className="flex items-center justify-between">
        {/* Logo + Titel */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-xl">
            <span className="text-2xl animate-bounce">🇪🇹</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Habesha Dama
          </h1>
        </div>

        {/* Desktop: Login/Profile direkt sichtbar */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {/* User Profile */}
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
                    <span className="text-sm">👤</span>
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
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
              >
                {loading ? '⏳' : '🚪'}
                <span className="hidden lg:inline">Abmelden</span>
              </button>
            </>
          ) : (
            /* Login Button */
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-white hover:bg-gray-100 text-gray-800 px-6 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 shadow-xl flex items-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Anmelden</span>
            </button>
          )}
          
          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>

        {/* Hamburger Button (nur mobil) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center gap-1.5 transition-all"
        >
          <span className={`w-6 h-0.5 bg-amber-300 rounded-full transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-amber-300 rounded-full transition-all ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-amber-300 rounded-full transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menü */}
      {isOpen && (
        <div className="absolute right-0 top-20 w-72 bg-gradient-to-b from-amber-900 to-amber-950 rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden md:hidden animate-slide-down">
          {user ? (
            /* Eingeloggt */
            <div className="p-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl mb-3">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <p className="text-white font-bold">{user.user_metadata?.full_name || 'Spieler'}</p>
                  <p className="text-amber-300 text-sm">{user.email || ''}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
              >
                {loading ? '⏳' : '🚪'}
                <span>Abmelden</span>
              </button>
            </div>
          ) : (
            /* Nicht eingeloggt */
            <div className="p-6">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 px-6 py-4 rounded-xl font-medium transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-lg">Mit Google anmelden</span>
              </button>
            </div>
          )}

          {/* Language Switcher (immer unten) */}
          <div className="p-4 border-t border-amber-500/20 bg-black/20">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  )
}