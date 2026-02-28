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

  // 🔥 VERBESSERT: Auf Gegner warten (Realtime + Polling als Fallback)
  useEffect(() => {
    if (!raumId) return

    console.log('👀 Warte auf Gegner in Raum:', raumId)
    
    // 1. Realtime Subscription
    const subscription = supabase
      .channel(`raum-${raumId}`)
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
          
          if (payload.new.status === 'playing') {
            console.log('🎮 Gegner beigetreten! (Realtime)')
            console.log('📨 Game ID:', payload.new.id)
            
            setGameStarted(true)
            
            // 🔥 WICHTIG: onGameStarted aufrufen und dann Komponente schließen
            if (onGameStarted && payload.new.id) {
              onGameStarted(payload.new.id)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime Status:', status)
      })

    // In RaumErstellen.tsx - ersetze den Polling-Teil:

     // 2. 🔥 POLLING FALLBACK
     const pollInterval = setInterval(async () => {
     try {
     console.log('⏳ Polling: Prüfe Raum-Status...')
    
     const { data, error } = await supabase
      .from('games')
      .select('id, status')
      .eq('raum_id', raumId)
      .single()

    if (error) {
      console.error('❌ Polling Fehler:', error)
      return
    }

    if (data?.status === 'playing') {
      console.log('🎮 Gegner beigetreten! (Polling)')
      console.log('📨 Game ID:', data.id)
      
      // 🔥 WICHTIG: Zuerst alles stoppen!
      clearInterval(pollInterval)
      subscription.unsubscribe()
      
      // Dann erst Callback aufrufen
      if (onGameStarted && data.id) {
        console.log('🔥 onGameStarted wird aufgerufen mit:', data.id)
        onGameStarted(data.id, 'schwarz')  // Farbe mitgeben!
      }
      
      setGameStarted(true)
      }
    } catch (err) {
    console.error('❌ Polling Exception:', err)
    }
     }, 2000)

    // Cleanup
    return () => {
      console.log('👋 Cleanup für Raum:', raumId)
      subscription.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [raumId, supabase, onGameStarted])

  const createRaum = async () => {
    setLoading(true)
    
    const newRaumId = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('🏗️ Erstelle Raum mit ID:', newRaumId)
    
    // Prüfe ob Raum-ID bereits existiert
    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('raum_id', newRaumId)
      .maybeSingle()
    
    if (existing) {
      console.log('⚠️ Raum-ID existiert bereits, generiere neue...')
      setLoading(false)
      return createRaum()
    }
    
    const { data, error } = await supabase
      .from('games')
      .insert({
        player_black: userId,
        player_white: null,
        status: 'waiting',
        current_turn: 'schwarz',
        board: JSON.stringify(initialesBrett()),
        raum_id: newRaumId,
        created_at: new Date().toISOString()
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
    alert('✅ Link kopiert!')
  }

  // 🔥 WICHTIG: Wenn gameStarted true ist, zeige GAR NICHTS an!
  // Die Parent-Komponente (page.tsx) zeigt dann OnlineGame
  if (gameStarted) {
    console.log('🎮 Spiel gestartet, RaumErstellen wird ausgeblendet')
    return null
  }

  if (raumId) {
    return (
      <div className="bg-amber-800/50 p-6 rounded-xl">
        <p className="text-white text-xl mb-4">Dein Raum-Code:</p>
        <div className="bg-amber-900 p-6 rounded-xl mb-6">
          <p className="text-6xl font-mono text-center text-white tracking-widest">{raumId}</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-amber-900/80 p-4 rounded-xl">
            <p className="text-amber-300 mb-2 text-sm">Link zum Teilen:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/raum/${raumId}`}
                readOnly
                className="flex-1 bg-amber-950 text-white px-3 py-2 rounded-lg text-sm font-mono border border-amber-500/30"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyLink}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
              >
                📋 Kopieren
              </button>
            </div>
          </div>

          <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-500/30">
            <p className="text-blue-300 text-sm mb-2">🔧 TEST: Direkt beitreten</p>
            <a
              href={`${window.location.origin}/raum/${raumId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm break-all font-mono"
            >
              {window.location.origin}/raum/{raumId}
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-amber-300 mt-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Warte auf Gegner...</span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={createRaum}
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-5 rounded-xl text-xl font-bold hover:from-blue-500 hover:to-blue-400 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
    >
      <span className="text-2xl">🏠</span>
      {loading ? 'Wird erstellt...' : 'Raum erstellen (Freund einladen)'}
    </button>
  )
}