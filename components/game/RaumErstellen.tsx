'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initialesBrett } from '@/lib/game/logic'

interface RaumErstellenProps {
  userId: string
  onRaumErstellt: (raumId: string) => void
  onGameStarted?: (gameId: number) => void
}

export default function RaumErstellen({ userId, onRaumErstellt, onGameStarted }: RaumErstellenProps) {
  const [raumId, setRaumId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const supabase = createClient()

  // Auf Gegner warten
  useEffect(() => {
    if (!raumId) return

    console.log('👀 Warte auf Gegner in Raum:', raumId)

    const subscription = supabase
      .channel(`raum-${raumId}-${Date.now()}`, {
        config: {
          broadcast: { self: true },
          presence: { key: '' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `raum_id=eq.${raumId}`
        },
        (payload) => {
          console.log('📨 UPDATE ERHALTEN!', payload)
          console.log('📨 Payload new:', payload.new)
          console.log('📨 Payload old:', payload.old)
          console.log('📨 Event type:', payload.eventType)
          
          if (payload.new.status === 'playing') {
            console.log('🎮 Gegner beigetreten! Starte Spiel...')
            console.log('📨 Game ID:', payload.new.id)
            
            if (onGameStarted && payload.new.id) {
              onGameStarted(payload.new.id)
            }
            
            setGameStarted(true)
          } else {
            console.log('⏳ Status ist noch:', payload.new.status)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Channel erfolgreich verbunden für Raum:', raumId)
        }
      })

    return () => {
      console.log('👋 Unsubscribe von Raum:', raumId)
      subscription.unsubscribe()
    }
  }, [raumId, supabase, onGameStarted])

  const createRaum = async () => {
    setLoading(true)
    
    const newRaumId = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('🏗️ Erstelle Raum mit ID:', newRaumId)
    
    const { data, error } = await supabase
      .from('games')
      .insert({
        player_black: userId,
        player_white: null,
        status: 'waiting',
        current_turn: 'schwarz',
        board: JSON.stringify(initialesBrett()),
        raum_id: newRaumId
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Fehler beim Erstellen des Raums:', error)
      setLoading(false)
      return
    }

    console.log('✅ Raum erfolgreich erstellt:', data)
    setRaumId(newRaumId)
    setLoading(false)
    onRaumErstellt(newRaumId)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/raum/${raumId}`
    navigator.clipboard.writeText(link)
    alert('Link kopiert!')
  }

  if (gameStarted) {
    return (
      <div className="bg-green-800/50 p-6 rounded-xl text-center">
        <p className="text-white text-2xl mb-4">🎮 Gegner gefunden!</p>
        <p className="text-amber-300">Spiel startet...</p>
      </div>
    )
  }

  if (raumId) {
    return (
      <div className="bg-amber-800/50 p-6 rounded-xl">
        <p className="text-white text-xl mb-4">Dein Raum-Code:</p>
        <div className="bg-amber-900 p-6 rounded-xl mb-6">
          <p className="text-6xl font-mono text-center text-white tracking-widest">{raumId}</p>
        </div>
        <p className="text-amber-300 mb-3">Teile diesen Link:</p>
        <div className="bg-amber-900/80 p-4 rounded-xl mb-4 text-amber-200 text-sm break-all font-mono border border-amber-500/30">
          {window.location.origin}/raum/{raumId}
        </div>
        <button 
          onClick={copyLink}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-xl text-lg font-bold hover:from-green-500 hover:to-green-400 transition-all mb-4 flex items-center justify-center gap-2"
        >
          <span className="text-xl">📋</span> Link kopieren
        </button>
        <div className="flex items-center justify-center gap-2 text-amber-300">
          <span className="animate-pulse">⏳</span>
          <span>Warte auf Gegner...</span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={createRaum}
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-5 rounded-xl text-xl font-bold hover:from-blue-500 hover:to-blue-400 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
    >
      <span className="text-2xl">🏠</span> Raum erstellen (Freund einladen)
    </button>
  )
}