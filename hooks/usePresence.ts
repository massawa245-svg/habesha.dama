'use client'
// hooks/usePresence.ts

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceUser {
  userId: string
  status: 'online' | 'searching' | 'playing'
  joinedAt: string
}

export function usePresence(userId: string | null, initialStatus: 'online' | 'searching' | 'playing' = 'online') {
  const [onlineCount, setOnlineCount] = useState(0)
  const [searchingCount, setSearchingCount] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } }
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => users.push(p as PresenceUser))
        })
        setOnlineUsers(users)
        setOnlineCount(users.length)
        setSearchingCount(users.filter(u => u.status === 'searching').length)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('👋 User online:', key)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 User offline:', key)
      })
      .subscribe(async (subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          await channel.track({
            userId,
            status: initialStatus,
            joinedAt: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [userId])

  const updateStatus = async (newStatus: 'online' | 'searching' | 'playing') => {
    if (!channelRef.current || !userId) return
    await channelRef.current.track({
      userId,
      status: newStatus,
      joinedAt: new Date().toISOString(),
    })
  }

  return { onlineCount, searchingCount, onlineUsers, updateStatus }
}