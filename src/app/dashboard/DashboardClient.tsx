"use client"

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStripe } from '@/lib/stripe-client'
import { prepareImageForUpload } from '@/lib/image-compression'

export type DashboardProject = {
  id: string
  prompt: string
  input_image_url: string
  output_image_url: string
  status: string | null
  created_at: string
  payment_status?: string | null
}

type DashboardClientProps = {
  projects: DashboardProject[]
}

export default function DashboardClient({ projects }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [image, setImage] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null)
  const disableActions = uploading || pending

  // Vérifier si on revient d'un paiement Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      setSuccess('Paiement confirmé ! Vous pouvez maintenant lancer la génération.')
      // Nettoyer l'URL
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!image) {
      setError('Veuillez sélectionner une image à transformer.')
      return
    }

    if (!prompt.trim()) {
      setError('Décrivez la transformation désirée.')
      return
    }

    // Vérifier la taille de l'image (limite à 4 MB pour Vercel)
    const maxSizeInMB = 4;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (image.size > maxSizeInBytes) {
      setError(`L'image est trop grande (${(image.size / 1024 / 1024).toFixed(2)} MB). Limite : ${maxSizeInMB} MB.`)
      return
    }

    try {
      setUploading(true)

      // Préparer l'image (compression si nécessaire)
      let imageToUpload = image;
      try {
        imageToUpload = await prepareImageForUpload(image, 4);
        console.log(`Image préparée : ${(imageToUpload.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (compressionError) {
        console.error('Erreur lors de la compression:', compressionError);
        throw new Error('Impossible de préparer l\'image pour l\'upload');
      }

      // Étape 1 : Créer un projet pending avec l'image uploadée dans Supabase
      const uploadFormData = new FormData()
      uploadFormData.append('image', imageToUpload)
      uploadFormData.append('prompt', prompt.trim())

      const uploadResponse = await fetch('/api/upload-and-create-project', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const payload = await uploadResponse.json().catch(() => ({ error: 'Erreur réseau' }))
        throw new Error(payload.error || 'Impossible de créer le projet')
      }

      const { projectId } = await uploadResponse.json()

      // Étape 2 : Créer la session Stripe Checkout
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!checkoutResponse.ok) {
        const payload = await checkoutResponse.json().catch(() => ({ error: 'Erreur réseau' }))
        throw new Error(payload.error || 'Impossible de créer la session de paiement')
      }

      const { url } = await checkoutResponse.json()

      // Étape 3 : Rediriger vers Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL de paiement introuvable')
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Une erreur est survenue.'
      )
      setUploading(false)
    }
  }

  const handleGenerate = async (projectId: string) => {
    setError(null)
    setSuccess(null)

    try {
      setUploading(true)

      // Récupérer les détails du projet
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) {
        throw new Error('Impossible de récupérer le projet')
      }

      const project = await projectResponse.json()

      // Créer un FormData avec les infos du projet
      const formData = new FormData()
      
      // Télécharger l'image depuis l'URL et la réuploader
      const imageResponse = await fetch(project.input_image_url)
      const imageBlob = await imageResponse.blob()
      const imageFile = new File([imageBlob], 'image.png', { type: imageBlob.type })
      
      formData.append('image', imageFile)
      formData.append('prompt', project.prompt)
      formData.append('projectId', projectId)

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Erreur réseau' }))
        throw new Error(payload.error || 'Impossible de générer l\'image')
      }

      setSuccess('Transformation réussie !')
      startTransition(() => router.refresh())
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Une erreur est survenue pendant la génération.'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Erreur réseau' }))
        throw new Error(payload.error || 'Impossible de supprimer le projet')
      }

      setSuccess('Projet supprimé.')
      startTransition(() => router.refresh())
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Erreur lors de la suppression du projet.'
      )
    }
  }

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Nouvelle transformation</h2>
        <p className="mt-2 text-sm text-slate-300">
          Téléversez une image source puis décrivez la transformation à effectuer. Vos résultats seront sauvegardés dans Supabase.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="image">
              Image de référence
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600"
              disabled={disableActions}
            />
            <p className="text-xs text-slate-400">
              Taille maximale : 4 MB. Formats supportés : JPG, PNG, WebP
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="prompt">
              Prompt de transformation
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ex : transforme cette photo en illustration de style cyberpunk…"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={disableActions}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-md bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={disableActions}
            className="inline-flex items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? 'Redirection vers le paiement…' : 'Générer (2,50 €)'}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-white">Mes projets</h2>
          <span className="text-sm text-slate-400">
            {projects.length === 0
              ? 'Aucun projet pour l’instant'
              : `${projects.length} projet${projects.length > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    {new Date(project.created_at).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {project.prompt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(project.id)}
                  className="text-xs font-semibold text-red-300 underline-offset-4 hover:text-red-200 hover:underline"
                  disabled={disableActions}
                >
                  Supprimer
                </button>
              </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                <figure className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <Image
                    src={project.input_image_url}
                    alt="Image d'origine"
                    fill
                    className="object-cover"
                  />
                </figure>
                {project.output_image_url ? (
                  <figure className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image
                      src={project.output_image_url}
                      alt="Résultat généré"
                      fill
                      className="object-cover"
                    />
                  </figure>
                ) : (
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
                    <p className="text-sm text-slate-400">En attente de génération</p>
                  </div>
                )}
              </div>

              {/* Afficher le statut et bouton de génération */}
              <div className="flex items-center justify-between gap-3">
                {project.status && (
                  <span className="self-start rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    {project.status}
                  </span>
                )}
                {project.payment_status === 'paid' && !project.output_image_url && (
                  <button
                    type="button"
                    onClick={() => handleGenerate(project.id)}
                    disabled={uploading}
                    className="rounded-md bg-green-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? 'Génération...' : 'Lancer la génération'}
                  </button>
                )}
                {project.payment_status === 'pending' && (
                  <span className="text-xs text-yellow-300">En attente de paiement</span>
                )}
              </div>
            </article>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            <p className="text-sm text-slate-300">
              Lancez votre première transformation pour voir vos projets ici.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
