import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import DashboardClient, { DashboardProject } from './DashboardClient'

export const metadata: Metadata = {
  title: 'Tableau de bord — AI Image Editor',
  description: 'Gérez vos projets IA, téléversez vos images et consultez vos résultats générés.',
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, prompt, input_image_url, output_image_url, status, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Unable to fetch projects:', error)
  }

  return <DashboardClient projects={(data as DashboardProject[]) ?? []} />
}
