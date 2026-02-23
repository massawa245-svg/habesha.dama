import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const createGuestUser = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInAnonymously()
  
  if (error) {
    console.error('Fehler beim Erstellen des Guest-Users:', error)
    return null
  }
  
  return data.user
}