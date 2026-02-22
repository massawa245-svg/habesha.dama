'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
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

  if (!user) return null

  return (
    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-lg">
      {user.user_metadata?.avatar_url && (
        <img 
          src={user.user_metadata.avatar_url} 
          alt="Profile" 
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="text-white font-bold">{user.user_metadata?.full_name || user.email}</p>
        <p className="text-amber-300 text-sm">Eingeloggt </p>
      </div>
    </div>
  )
}
