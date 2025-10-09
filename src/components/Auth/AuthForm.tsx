"use client"

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const tabLabels = {
  login: 'Connexion',
  signup: "Inscription",
}

type Tab = keyof typeof tabLabels

type AuthFormProps = {
  defaultTab?: Tab
}

export function AuthForm({ defaultTab = 'login' }: AuthFormProps) {
  const router = useRouter()
  const auth = useAuth()
  const supabase = auth?.supabase
  const signIn = auth?.signIn ?? (async () => ({ error: 'Auth not available' }))
  const signUp = auth?.signUp ?? (async () => ({ error: 'Auth not available' }))
  const loading = auth?.loading ?? false
  
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignup = tab === 'signup'

  const resetState = () => {
    setFormError(null)
    setFormSuccess(null)
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setFormError('Service d\'authentification non disponible')
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        setFormError(error.message)
      }
    } catch (error) {
      setFormError('Erreur lors de la connexion avec Google')
    }
  }

  const validate = () => {
    if (!email.trim()) {
      return 'L’e-mail est requis.'
    }
    if (!email.includes('@')) {
      return 'Veuillez saisir un e-mail valide.'
    }
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    }
    if (isSignup && password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetState()

    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)

    const action = isSignup
      ? signUp({ email: email.trim(), password })
      : signIn({ email: email.trim(), password })

    const { error } = await action

    if (error) {
      setFormError(error)
      setSubmitting(false)
      return
    }

    if (isSignup) {
      setFormSuccess('Compte créé ! Veuillez vérifier votre boîte mail pour confirmer votre adresse.')
      setSubmitting(false)
    } else {
      setFormSuccess('Connexion réussie !')
      // Redirection immédiate vers le tableau de bord après connexion
      router.push('/dashboard')
    }
  }

  return (
    <div className="max-w-md mx-auto rounded-lg border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm">
      <div className="flex gap-2 mb-6" role="tablist">
        {(Object.keys(tabLabels) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              setTab(key)
              resetState()
            }}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      {/* Bouton Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || submitting}
        className="w-full mb-6 flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continuer avec Google
      </button>

      {/* Séparateur */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white/80 px-2 text-slate-500">Ou avec votre e-mail</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Votre adresse e-mail"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Votre mot de passe"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>

        {isSignup && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmez votre mot de passe"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
        )}

        {formError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
        )}

        {formSuccess && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formSuccess}</p>
        )}

        <button
          type="submit"
          disabled={loading || submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'En cours…' : tab === 'login' ? 'Se connecter' : 'Créer un compte'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        {tab === 'login' ? (
          <p>
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
              Inscrivez-vous
            </Link>
          </p>
        ) : (
          <p>
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Connectez-vous
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
