"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  const isActive = (path: string) => pathname === path

  return (
    <header className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
      <Link href="/" className="text-lg font-semibold text-white">
        AI Image Editor
      </Link>
      <nav className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <Link
          href="/dashboard"
          className={`rounded-full px-4 py-2 transition-colors ${
            isActive('/dashboard') ? 'bg-white/15 text-white' : 'hover:bg-white/10'
          } ${!user ? 'pointer-events-none opacity-40' : ''}`}
          aria-disabled={!user}
        >
          Tableau de bord
        </Link>
        {loading ? (
          <span className="ml-4 text-xs text-slate-300">Chargement…</span>
        ) : user ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-full bg-red-500/80 px-4 py-2 text-white transition-colors hover:bg-red-600"
          >
            Se déconnecter
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`rounded-full px-4 py-2 transition-colors ${
                isActive('/login') ? 'bg-white/15 text-white' : 'hover:bg-white/10'
              }`}
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Inscription
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
