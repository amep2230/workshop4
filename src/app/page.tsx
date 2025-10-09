import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-[70vh] flex-col justify-center gap-10 py-12">
      <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200 ring-1 ring-inset ring-blue-500/40">
            Générez, éditez, partagez
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            Transformez vos images grâce à l’intelligence artificielle
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Téléchargez vos visuels, décrivez la transformation souhaitée, et laissez notre pipeline IA powered by Replicate &amp; Supabase créer des résultats impressionnants.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-200 underline-offset-4 hover:underline"
            >
              J’ai déjà un compte
            </Link>
          </div>
          <ul className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <li className="rounded-md border border-white/5 bg-white/5 px-4 py-3">Stockage sécurisé Supabase</li>
            <li className="rounded-md border border-white/5 bg-white/5 px-4 py-3">Historique de projets illimité</li>
            <li className="rounded-md border border-white/5 bg-white/5 px-4 py-3">API Replicate haut de gamme</li>
            <li className="rounded-md border border-white/5 bg-white/5 px-4 py-3">Interface intuitive sans code</li>
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-blue-600/30 to-indigo-700/30 p-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.45),_transparent_60%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Comment ça marche ?</h2>
              <p className="mt-2 text-sm text-slate-200/80">
                1. Créez un compte et ouvrez votre tableau de bord.
                <br />2. Téléversez l’image de référence et décrivez la transformation.
                <br />3. Laissez l’algorithme générer une nouvelle version unique.
              </p>
            </div>
            <div className="mt-8 rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Technologies</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold text-white">
                <span className="rounded-lg bg-white/5 px-3 py-2">Next.js 13</span>
                <span className="rounded-lg bg-white/5 px-3 py-2">Replicate API</span>
                <span className="rounded-lg bg-white/5 px-3 py-2">Supabase Storage</span>
                <span className="rounded-lg bg-white/5 px-3 py-2">Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}