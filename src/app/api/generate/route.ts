import { NextResponse } from 'next/server'
import { randomUUID, createHash } from 'crypto'
import Replicate from 'replicate'

import { getSupabaseClient } from '@/lib/supabase'
import { getSupabaseRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'

const replicateToken = process.env.REPLICATE_API_TOKEN
const replicateModelEnv = process.env.REPLICATE_MODEL
const replicateImageParam =
  process.env.REPLICATE_IMAGE_PARAM?.trim() || 'image'
const replicatePromptParam =
  process.env.REPLICATE_PROMPT_PARAM?.trim() || 'prompt'
const replicateWrapImageInArray =
  process.env.REPLICATE_IMAGE_AS_ARRAY === 'true'
const replicateExtraInputsRaw = process.env.REPLICATE_EXTRA_INPUTS

const inputBucket = process.env.SUPABASE_INPUT_BUCKET || 'input-images'
const inputFolder = process.env.SUPABASE_INPUT_FOLDER ?? ''
const outputBucket = process.env.SUPABASE_OUTPUT_BUCKET || 'output-images'
const outputFolder = process.env.SUPABASE_OUTPUT_FOLDER ?? ''
const signedUrlExpirySeconds = Number.parseInt(
  process.env.SUPABASE_SIGNED_URL_EXPIRY ?? '86400',
  10
)

const bucketVisibilityCache = new Map<string, boolean>()

async function isBucketPublic(
  supabase: ReturnType<typeof getSupabaseClient>,
  bucket: string
) {
  if (bucketVisibilityCache.has(bucket)) {
    return bucketVisibilityCache.get(bucket) ?? false
  }

  const { data, error } = await supabase.storage.getBucket(bucket)

  if (error) {
    console.warn(`Unable to determine visibility for bucket "${bucket}":`, error)
    bucketVisibilityCache.set(bucket, false)
    return false
  }

  const isPublic = Boolean(data?.public)
  bucketVisibilityCache.set(bucket, isPublic)
  return isPublic
}

if (!replicateToken) {
  throw new Error('REPLICATE_API_TOKEN is not set')
}

if (!replicateModelEnv) {
  throw new Error('REPLICATE_MODEL is not set')
}

const replicate = new Replicate({ auth: replicateToken })
const replicateModel = replicateModelEnv as
  | `${string}/${string}`
  | `${string}/${string}:${string}`

function createStorageKey(folder: string, filename?: string) {
  const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '')
  const extension = filename?.split('.').pop()?.split('?')[0] || 'png'
  const key = `${Date.now()}-${randomUUID()}.${extension}`
  return sanitizedFolder ? `${sanitizedFolder}/${key}` : key
}

type ResolvedReplicateOutput =
  | { kind: 'url'; url: string }
  | { kind: 'buffer'; buffer: Buffer; contentType: string }

async function getStorageUrl(
  supabase: ReturnType<typeof getSupabaseClient>,
  bucket: string,
  path: string
) {
  const bucketIsPublic = await isBucketPublic(supabase, bucket)

  if (bucketIsPublic) {
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    if (publicData?.publicUrl) {
      return { url: publicData.publicUrl, visibility: 'public' as const }
    }
  }

  if (!Number.isFinite(signedUrlExpirySeconds) || signedUrlExpirySeconds <= 0) {
    throw new Error(
      `Bucket "${bucket}" is not public and SUPABASE_SIGNED_URL_EXPIRY is invalid.`
    )
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, signedUrlExpirySeconds)

  if (signedError || !signedData?.signedUrl) {
    throw signedError ?? new Error('Failed to create signed URL')
  }

  return { url: signedData.signedUrl, visibility: 'signed' as const }
}

async function resolveReplicateOutput(
  output: unknown
): Promise<ResolvedReplicateOutput | null> {
  if (!output) return null

  if (typeof output === 'string') {
    return output.startsWith('http')
      ? { kind: 'url', url: output }
      : null
  }

  if (Array.isArray(output)) {
    for (const candidate of output) {
      const resolved = await resolveReplicateOutput(candidate)
      if (resolved) return resolved
    }
    return null
  }

  if (typeof output === 'object') {
    const candidate = output as Record<string, unknown>

    const urlProperty = candidate.url
    if (typeof urlProperty === 'string' && urlProperty.startsWith('http')) {
      return { kind: 'url', url: urlProperty }
    }

    const toStringMethod = candidate.toString as
      | (() => string)
      | undefined
    const toStringValue = toStringMethod?.call(candidate)
    if (
      typeof toStringValue === 'string' &&
      toStringValue.startsWith('http')
    ) {
      return { kind: 'url', url: toStringValue }
    }

    const blobFn = candidate.blob
    if (typeof blobFn === 'function') {
      const blob = await (blobFn as () => Promise<Blob>)()
      const arrayBuffer = await blob.arrayBuffer()
      return {
        kind: 'buffer',
        buffer: Buffer.from(arrayBuffer),
        contentType: blob.type || 'image/png',
      }
    }

    const maybeReadable = candidate as unknown as {
      getReader?: () => ReadableStreamDefaultReader<Uint8Array>
    }
    if (typeof maybeReadable.getReader === 'function') {
      const response = new Response(candidate as unknown as BodyInit)
      const arrayBuffer = await response.arrayBuffer()
      return {
        kind: 'buffer',
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get('content-type') || 'image/png',
      }
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const routeClient = await getSupabaseRouteClient()
    const {
      data: { user },
    } = await routeClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    const formData = await request.formData()
    const image = formData.get('image')
    const prompt = formData.get('prompt')

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: 'Image file is required.' },
        { status: 400 }
      )
    }

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      )
    }

  const inputPath = createStorageKey(inputFolder, image.name)
    const inputBuffer = Buffer.from(await image.arrayBuffer())

    const { error: inputUploadError } = await supabase.storage
      .from(inputBucket)
      .upload(inputPath, inputBuffer, {
        contentType: image.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (inputUploadError) {
      console.error('Failed to upload input image:', inputUploadError)
      return NextResponse.json(
        { error: 'Failed to upload input image.' },
        { status: 500 }
      )
    }

    let inputImageUrl: string
    try {
      const { url } = await getStorageUrl(supabase, inputBucket, inputPath)
      inputImageUrl = url
    } catch (error) {
      console.error('Failed to retrieve input image accessible URL:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve input image URL.' },
        { status: 500 }
      )
    }

    const imageInputValue = replicateWrapImageInArray
      ? [inputImageUrl]
      : inputImageUrl

    if (
      (Array.isArray(imageInputValue) && imageInputValue.length === 0) ||
      (!Array.isArray(imageInputValue) && !imageInputValue)
    ) {
      console.error('No valid image input provided to the Replicate model.')
      return NextResponse.json(
        { error: 'Replicate model input is missing the image URL.' },
        { status: 500 }
      )
    }

    const replicateInput: Record<string, unknown> = {
      [replicatePromptParam]: prompt.trim(),
      [replicateImageParam]: imageInputValue,
    }

    if (replicateExtraInputsRaw) {
      try {
        const parsed = JSON.parse(replicateExtraInputsRaw)
        if (parsed && typeof parsed === 'object') {
          Object.assign(replicateInput, parsed)
        }
      } catch (error) {
        console.warn('Failed to parse REPLICATE_EXTRA_INPUTS:', error)
      }
    }

    // Debug: Log the exact input being sent to Replicate
    console.log('🔍 Replicate Model:', replicateModel)
    console.log('🔍 Replicate Input:', JSON.stringify(replicateInput, null, 2))
    console.log('🔍 Image URL being sent:', imageInputValue)
    console.log('🔍 Prompt being sent:', prompt.trim())

    const replicateOutput = await replicate.run(replicateModel, {
      input: replicateInput,
    })

    const resolvedOutput = await resolveReplicateOutput(replicateOutput)

    if (!resolvedOutput) {
      console.error('Unexpected Replicate response:', replicateOutput)
      return NextResponse.json(
        { error: 'Failed to generate image.' },
        { status: 500 }
      )
    }

    let outputBuffer: Buffer
    let outputContentType = 'image/png'

    if (resolvedOutput.kind === 'url') {
      if (resolvedOutput.url === inputImageUrl) {
        console.error('Replicate returned the original input image URL.')
        return NextResponse.json(
          {
            error:
              'Generated image matches the original input. Please adjust model settings or prompt.',
          },
          { status: 502 }
        )
      }

      const generatedResponse = await fetch(resolvedOutput.url)

      if (!generatedResponse.ok) {
        console.error(
          'Failed to download generated image:',
          generatedResponse.status,
          generatedResponse.statusText
        )
        return NextResponse.json(
          { error: 'Failed to download generated image.' },
          { status: 500 }
        )
      }

      outputBuffer = Buffer.from(await generatedResponse.arrayBuffer())
      outputContentType =
        generatedResponse.headers.get('content-type') || outputContentType
    } else {
      outputBuffer = resolvedOutput.buffer
      outputContentType = resolvedOutput.contentType
    }

    const inputHash = createHash('sha256').update(inputBuffer).digest('hex')
    const outputHash = createHash('sha256').update(outputBuffer).digest('hex')

    if (inputHash === outputHash) {
      console.error('Generated image hash matches input image hash.')
      return NextResponse.json(
        {
          error:
            'Generated image is identical to the source image. This model may not be using the input image.',
        },
        { status: 502 }
      )
    }

    const outputPath = createStorageKey(
      outputFolder,
      resolvedOutput.kind === 'url' ? resolvedOutput.url : undefined
    )

    const { error: outputUploadError } = await supabase.storage
      .from(outputBucket)
      .upload(outputPath, outputBuffer, {
  contentType: outputContentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (outputUploadError) {
      console.error('Failed to upload generated image:', outputUploadError)
      return NextResponse.json(
        { error: 'Failed to upload generated image.' },
        { status: 500 }
      )
    }

    let outputImageUrl: string
    try {
      const { url } = await getStorageUrl(supabase, outputBucket, outputPath)
      outputImageUrl = url
    } catch (error) {
      console.error('Failed to retrieve output image accessible URL:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve generated image URL.' },
        { status: 500 }
      )
    }

    const { error: insertError } = await supabase.from('projects').insert({
      input_image_url: inputImageUrl,
      output_image_url: outputImageUrl,
      prompt,
      status: 'completed',
      user_id: user.id,
    })

    if (insertError) {
      console.error('Failed to persist project record:', insertError)
      return NextResponse.json(
        { error: 'Failed to save project record.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ outputUrl: outputImageUrl })
  } catch (error) {
    console.error('Unexpected error in generate route:', error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Unexpected error while generating image.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
