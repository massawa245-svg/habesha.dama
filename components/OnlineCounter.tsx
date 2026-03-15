'use client'
// components/OnlineCounter.tsx

import { usePresence } from '@/hooks/usePresence'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnlineCounter() {
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [])

  const { onlineCount, searchingCount } = usePresence(userId)

  return (
    <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-amber-500/20">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-60" />
        </div>
        <span className="text-green-400 text-sm font-medium">{onlineCount} online</span>
      </div>

      {searchingCount > 0 && (
        <>
          <div className="w-px h-4 bg-amber-500/30" />
          <span className="text-amber-300 text-sm">⚔️ {searchingCount} suchen</span>
        </>
      )}
    </div>
  )
}