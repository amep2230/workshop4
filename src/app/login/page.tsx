import type { Metadata } from 'next'
import { AuthForm } from '@/components/Auth/AuthForm'

export const metadata: Metadata = {
  title: 'Connexion — AI Image Editor',
  description: 'Connectez-vous pour accéder à votre espace de création.',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Bienvenue de retour</h1>
        <p className="mt-2 text-sm text-slate-300">
          Accédez à votre tableau de bord pour transformer vos images avec l’IA.
        </p>
      </div>
      <AuthForm defaultTab="login" />
    </main>
  )
}
