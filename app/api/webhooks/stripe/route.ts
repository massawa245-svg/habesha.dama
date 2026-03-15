// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover'
})

// ✅ Service Role Client – darf Coins schreiben (nie im Frontend verwenden!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('❌ Keine Stripe Signatur')
    return NextResponse.json({ error: 'Keine Signatur' }, { status: 400 })
  }

  let event: Stripe.Event

  // ✅ Webhook Signatur verifizieren – verhindert gefälschte Requests
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('❌ Webhook Signatur ungültig:', err)
    return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 400 })
  }

  console.log('✅ Stripe Event:', event.type)

  // ✅ Nur erfolgreiche Zahlungen verarbeiten
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Nur bezahlte Sessions verarbeiten
    if (session.payment_status !== 'paid') {
      console.log('⚠️ Session nicht bezahlt:', session.payment_status)
      return NextResponse.json({ received: true })
    }

    const userId = session.metadata?.userId
    const coins = parseInt(session.metadata?.coins || '0')

    if (!userId || !coins) {
      console.error('❌ Fehlende Metadata:', { userId, coins })
      return NextResponse.json({ error: 'Fehlende Metadata' }, { status: 400 })
    }

    console.log(`💰 Gutschrift: ${coins} Coins für User ${userId}`)

    try {
      // ✅ Doppelte Verarbeitung verhindern (idempotency)
      const { data: existing } = await supabase
        .from('coin_transactions')
        .select('id')
        .eq('reference_id', session.id)
        .single()

      if (existing) {
        console.log('⚠️ Session bereits verarbeitet:', session.id)
        return NextResponse.json({ received: true })
      }

      // ✅ Aktuelle Balance holen
      const { data: current } = await supabase
        .from('user_coins')
        .select('balance')
        .eq('user_id', userId)
        .single()

      const newBalance = (current?.balance || 0) + coins

      // ✅ Balance updaten (service_role – sicher!)
      const { error: balanceError } = await supabase
        .from('user_coins')
        .upsert({
          user_id: userId,
          balance: newBalance,
          updated_at: new Date().toISOString()
        })

      if (balanceError) {
        console.error('❌ Fehler beim Balance-Update:', balanceError)
        return NextResponse.json({ error: 'Balance-Fehler' }, { status: 500 })
      }

      // ✅ Transaktion speichern
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: coins,
          type: 'purchase',
          reference_id: session.id,  // Stripe Session ID als eindeutige Referenz
        })

      if (txError) {
        console.error('❌ Fehler beim Speichern der Transaktion:', txError)
        return NextResponse.json({ error: 'Transaktions-Fehler' }, { status: 500 })
      }

      console.log(`✅ ${coins} Coins erfolgreich gutgeschrieben für User ${userId}`)

    } catch (error) {
      console.error('❌ Unerwarteter Fehler:', error)
      return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}