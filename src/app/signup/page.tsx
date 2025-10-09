import type { Metadata } from 'next'
import { AuthForm } from '@/components/Auth/AuthForm'

export const metadata: Metadata = {
  title: 'Inscription — AI Image Editor',
  description: 'Créez un compte pour commencer à générer et éditer des images.',
}

export default function SignupPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Créez votre compte</h1>
        <p className="mt-2 text-sm text-slate-300">
          Rejoignez la plateforme et stockez vos projets sur Supabase.
        </p>
      </div>
      <AuthForm defaultTab="signup" />
    </main>
  )
}
