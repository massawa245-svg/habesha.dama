'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initialesBrett } from '@/lib/game/logic'

interface RaumErstellenProps {
  userId: string
  onRaumErstellt: (raumId: string) => void
}

export default function RaumErstellen({ userId, onRaumErstellt }: RaumErstellenProps) {
  const [raumId, setRaumId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const createRaum = async () => {
    setLoading(true)
    
    const newRaumId = Math.random().toString(36).substring(2, 8).toUpperCase()
    
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
      console.error('Fehler beim Erstellen des Raums:', error)
      setLoading(false)
      return
    }

    setRaumId(newRaumId)
    setLoading(false)
    onRaumErstellt(newRaumId)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/raum/${raumId}`
    navigator.clipboard.writeText(link)
    alert('Link kopiert!')
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