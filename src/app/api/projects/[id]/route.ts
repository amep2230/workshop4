import { NextResponse } from 'next/server'

import { getSupabaseRouteClient } from '@/lib/supabase-route'
import { getSupabaseClient } from '@/lib/supabase'

const inputBucket = process.env.SUPABASE_INPUT_BUCKET || 'input-images'
const outputBucket = process.env.SUPABASE_OUTPUT_BUCKET || 'output-images'

function extractStoragePath(url: string | null | undefined, bucket: string) {
  if (!url) return null

  try {
    const { pathname } = new URL(url)

    const signSegment = `/object/sign/${bucket}/`
    const publicSegment = `/object/public/${bucket}/`

    if (pathname.includes(signSegment)) {
      return pathname.split(signSegment)[1]
    }

    if (pathname.includes(publicSegment)) {
      return pathname.split(publicSegment)[1]
    }

    const genericSegment = `/${bucket}/`
    if (pathname.includes(genericSegment)) {
      return pathname.split(genericSegment)[1]
    }

    return null
  } catch (error) {
    console.warn('Unable to parse storage path from URL:', error)
    return null
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params

  const routeClient = await getSupabaseRouteClient()
  const {
    data: { user },
  } = await routeClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const supabase = getSupabaseClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, input_image_url, output_image_url')
    .eq('id', id)
    .single()

  if (projectError || !project) {
    console.error('Unable to locate project', projectError)
    return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  }

  if (project.user_id && project.user_id !== user.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const removals: Array<Promise<unknown>> = []

  const inputPath = extractStoragePath(project.input_image_url, inputBucket)
  if (inputPath) {
    removals.push(
      supabase.storage
        .from(inputBucket)
        .remove([inputPath])
        .catch((error) => {
          console.warn('Unable to remove input image from storage', error)
        })
    )
  }

  const outputPath = extractStoragePath(project.output_image_url, outputBucket)
  if (outputPath) {
    removals.push(
      supabase.storage
        .from(outputBucket)
        .remove([outputPath])
        .catch((error) => {
          console.warn('Unable to remove output image from storage', error)
        })
    )
  }

  await Promise.all(removals)

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Failed to delete project record:', deleteError)
    return NextResponse.json(
      { error: 'Impossible de supprimer le projet.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
