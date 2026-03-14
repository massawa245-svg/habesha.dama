import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

export async function POST(req: Request) {
  try {
    // 1. Request Body loggen
    const body = await req.json()
    console.log('📦 Request Body:', JSON.stringify(body, null, 2))

    const { package: pkg, userId, userEmail } = body
    
    // 2. Prüfen ob alle Daten da sind
    if (!pkg) throw new Error('Kein Paket übergeben')
    if (!userId) throw new Error('Keine User ID')
    
    console.log('🔥 Paket:', pkg)
    console.log('👤 User:', { userId, userEmail })

    // 3. APP_URL checken
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    console.log('🌐 APP_URL:', appUrl)
    
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL ist nicht gesetzt!')
    }

    const totalCoins = pkg.coins + (pkg.bonus || 0)
    
    // 4. Stripe Session erstellen
    console.log('💰 Erstelle Stripe Session...')
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${pkg.coins} Coins`,
              description: pkg.bonus 
                ? `${pkg.coins} + ${pkg.bonus} gratis` 
                : `${pkg.coins} Coins`,
            },
            unit_amount: Math.round(pkg.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/coins`,
      customer_email: userEmail,
      metadata: {
        userId,
        coins: totalCoins.toString(),
      },
    })

    console.log('✅ Session erstellt:', session.id)
    console.log('🔗 Session URL:', session.url)
    
    return NextResponse.json({ url: session.url })
    
  } catch (error) {
    console.error('❌ Stripe error:', error)
    
    // Detaillierte Fehlerantwort
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    )
  }
}