"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

type AuthContextValue = {
  supabase: SupabaseClient
  session: Session | null
  user: Session['user'] | null
  loading: boolean
  signIn: (options: { email: string; password: string }) => Promise<{ error?: string }>
  signUp: (options: { email: string; password: string }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => getSupabaseBrowserClient())
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setLoading(false)

      try {
        await fetch('/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event, session: newSession }),
          credentials: 'same-origin',
        })
      } catch (error) {
        console.error('Failed to sync auth state with server:', error)
      }

      router.refresh()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const value = useMemo<AuthContextValue>(() => ({
    supabase,
    session,
    user: session?.user ?? null,
    loading,
    async signIn({ email, password }) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { error: error.message }
      }
      router.refresh()
      return {}
    },
    async signUp({ email, password }) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        return { error: error.message }
      }
      router.refresh()
      return {}
    },
    async signOut() {
      await supabase.auth.signOut()
      router.refresh()
    },
  }), [supabase, session, loading, router])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
