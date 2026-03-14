'use client'

import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import CoinShop from "@/components/coins/CoinShop"

export default function CoinsPage() {
  return (
    <PayPalScriptProvider options={{
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
      currency: "EUR"
    }}>
      <CoinShop />
    </PayPalScriptProvider>
  )
}