'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { createClient } from '@/lib/supabase/client'

interface CoinPackage {
  coins: number
  price: number
  bonus?: number
  popular?: boolean
}

export default function CoinShop() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const packages: CoinPackage[] = [
    { coins: 30, price: 2.99 },
    { coins: 60, price: 5.99, bonus: 5, popular: true },
    { coins: 100, price: 9.99, bonus: 10 }
  ]

  const handlePayPalSuccess = async (details: any, pkg: CoinPackage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('❌ Bitte melde dich an!')
        return
      }

      const totalCoins = pkg.coins + (pkg.bonus || 0)
      
      // Aktuelle Balance holen
      const { data: current } = await supabase
        .from('user_coins')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      // Neue Balance berechnen
      const newBalance = (current?.balance || 0) + totalCoins

      // Balance updaten
      await supabase
        .from('user_coins')
        .upsert({ 
          user_id: user.id, 
          balance: newBalance 
        })

      // Transaktion speichern
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: totalCoins,
          type: 'purchase',
          method: 'paypal',
          paypal_id: details.id,
          description: `${pkg.coins} Coins + ${pkg.bonus || 0} Bonus`
        })

      alert(`✅ ${totalCoins} Coins wurden gutgeschrieben!`)
      
      // Balance im Header aktualisieren
      window.dispatchEvent(new Event('coinBalanceUpdate'))
      
    } catch (error) {
      console.error('Fehler:', error)
      alert('❌ Fehler bei der Gutschrift')
    }
  }

  return (
    <PayPalScriptProvider options={{
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
      currency: "EUR"
    }}>
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          🪙 Coins kaufen
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.coins}
              className={`
                relative bg-gradient-to-br from-amber-900 to-amber-950 
                p-6 rounded-xl text-center border-2
                ${pkg.popular ? 'border-yellow-400 shadow-xl shadow-yellow-400/20' : 'border-amber-700'}
              `}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 
                              bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ Beliebt
                </div>
              )}
              
              <div className="text-5xl mb-3">🪙</div>
              <div className="text-3xl font-bold text-white">{pkg.coins}</div>
              {pkg.bonus && (
                <div className="text-green-400 text-sm mt-1">
                  +{pkg.bonus} gratis
                </div>
              )}
              <div className="text-2xl text-amber-300 mt-3">
                {pkg.price.toFixed(2)}€
              </div>
              
              {/* Paypal Button - JETZT MIT INTENT! */}
              <div className="mt-4">
                <PayPalButtons
                  style={{ 
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal"
                  }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE", // ← DAS IST DER FIX!
                      purchase_units: [{
                        amount: {
                          value: pkg.price.toFixed(2),
                          currency_code: "EUR"
                        },
                        description: `${pkg.coins} Habesha Dama Coins ${pkg.bonus ? `+ ${pkg.bonus} gratis` : ''}`
                      }]
                    })
                  }}
                  onApprove={async (data, actions) => {
                    const details = await actions.order?.capture()
                    await handlePayPalSuccess(details, pkg)
                  }}
                  onError={(err) => {
                    console.error('Paypal Fehler:', err)
                    alert('❌ Paypal-Zahlung fehlgeschlagen')
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Auszahlungs-Info */}
        <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm text-center">
            💰 <span className="font-bold">100 Coins = 10€ Auszahlungswert</span><br/>
            💶 Mindestauszahlung: 50€ • Max. 1x pro Monat<br/>
            <span className="text-xs">🏦 Auszahlungen per Banküberweisung (manuell)</span>
          </p>
        </div>
      </div>
    </PayPalScriptProvider>
  )
}