'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CoinBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadBalance()
    
    // Echtzeit-Updates für Balance
    const channel = supabase
      .channel('coin_balance')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_coins' },
        () => loadBalance()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    setBalance(data?.balance || 0)
  }

  if (balance === null) return null

  return (
    <Link href="/coins" className="flex items-center gap-2 bg-amber-800/50 px-4 py-2 rounded-full hover:bg-amber-700/50 transition-all">
      <span className="text-2xl">🪙</span>
      <span className="text-white font-bold">{balance}</span>
      <span className="text-amber-300 text-xs ml-1">
        ({(balance / 10).toFixed(2)}€)
      </span>
    </Link>
  )
}