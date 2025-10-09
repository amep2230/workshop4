"use client"

import { FormEvent, useState } from 'react'
import Link from 'next/link'
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
  const { signIn, signUp, loading } = useAuth()
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
    } else {
      setFormSuccess('Connexion réussie !')
    }

    setSubmitting(false)
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
