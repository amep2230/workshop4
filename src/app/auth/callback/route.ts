import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true })

  try {
    const { event, session } = await request.json()
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Cookie may have been set from a Server Component
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Cookie may have been removed from a Server Component
            }
          },
        },
      }
    )

    if (event === 'SIGNED_OUT') {
      await supabase.auth.signOut()
    } else if (session) {
      await supabase.auth.setSession(session)
    }
  } catch (error) {
    console.error('Failed to handle auth callback:', error)
    return NextResponse.json({ error: 'Unable to update auth session.' }, { status: 500 })
  }

  return response
}
