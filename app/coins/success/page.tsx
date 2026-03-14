'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SuccessPage() {
  const [status, setStatus] = useState('loading')
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      if (!sessionId) {
        setStatus('error')
        return
      }

      try {
        // Session bei Stripe verifizieren
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          // Balance automatisch neuladen
          window.dispatchEvent(new Event('coinBalanceUpdate'))
        } else {
          setStatus('error')
        }
      } catch (error) {
        setStatus('error')
      }
    }

    checkSession()
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-white">Zahlung wird verifiziert...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-green-900 to-green-950 p-8 rounded-2xl text-center max-w-md">
          <div className="text-7xl mb-4">✅</div>
          <h1 className="text-3xl text-white mb-4">Zahlung erfolgreich!</h1>
          <p className="text-green-300 mb-6">
            Deine Coins wurden deinem Konto gutgeschrieben.
          </p>
          <Link 
            href="/"
            className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold
                     hover:bg-gray-100 transition-all"
          >
            Zum Spielen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-900 to-red-950 p-8 rounded-2xl text-center max-w-md">
        <div className="text-7xl mb-4">❌</div>
        <h1 className="text-3xl text-white mb-4">Zahlung fehlgeschlagen</h1>
        <p className="text-red-300 mb-6">
          Bitte versuche es später noch einmal.
        </p>
        <Link 
          href="/coins"
          className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold
                   hover:bg-gray-100 transition-all"
        >
          Zurück zum Shop
        </Link>
      </div>
    </div>
  )
}