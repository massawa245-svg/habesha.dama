'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface GameChatProps {
  gameId: number
  userId: string
  playerColor: 'schwarz' | 'weiss'
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: number
}

export default function GameChat({ gameId, userId, playerColor }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    console.log('🎮 Chat wird gestartet für Spiel:', gameId)
    
    const channel = supabase.channel(`chat-${gameId}`, {
      config: {
        broadcast: { self: true, ack: true }
      }
    })

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        console.log('📨 Neue Chat-Nachricht:', payload)
        setMessages(prev => [...prev, payload])
      })
      .subscribe((status) => {
        console.log('📡 Chat Channel Status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    // Willkommensnachricht
    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      userId: 'system',
      userName: 'System',
      message: '👋 Chat gestartet! Viel Spaß beim Spiel!',
      timestamp: Date.now()
    }
    setMessages([welcomeMsg])

    return () => {
      console.log('👋 Chat wird beendet')
      channel.unsubscribe()
    }
  }, [gameId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !channelRef.current) return

    const message: ChatMessage = {
      id: `${userId}-${Date.now()}`,
      userId,
      userName: playerColor === 'schwarz' ? '⚫ Schwarz' : '⚪ Weiß',
      message: newMessage.trim(),
      timestamp: Date.now()
    }

    console.log('📤 Sende Nachricht:', message)
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'new_message',
      payload: message
    })

    setNewMessage('')
  }

  return (
    <div className="space-y-3">
      {/* Verbindungsstatus */}
      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-amber-300">{isConnected ? 'Verbunden' : 'Verbindungsaufbau...'}</span>
      </div>

      {/* Nachrichten */}
      <div className="h-48 overflow-y-auto space-y-2 bg-black/40 rounded-lg p-3 border border-amber-500/20">
        {messages.length === 0 ? (
          <div className="text-amber-300/50 text-center italic">Noch keine Nachrichten...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`text-sm ${msg.userId === 'system' ? 'opacity-70' : ''}`}>
              {msg.userId === 'system' ? (
                <span className="text-amber-300/60 italic">{msg.message}</span>
              ) : (
                <>
                  <span className="text-amber-300 font-medium">{msg.userName}:</span>{' '}
                  <span className="text-white">{msg.message}</span>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Eingabe */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Nachricht eingeben..."
          className="flex-1 bg-amber-900/30 text-white px-3 py-2 rounded-lg text-sm border border-amber-500/30 focus:outline-none focus:border-amber-400 placeholder-amber-300/50"
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || !isConnected}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📤
        </button>
      </div>
    </div>
  )
}
