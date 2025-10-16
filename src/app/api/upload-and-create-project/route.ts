import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase-route';
import { getSupabaseClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

const inputBucket = process.env.SUPABASE_INPUT_BUCKET || 'input-images';
const inputFolder = process.env.SUPABASE_INPUT_FOLDER ?? '';

function createStorageKey(folder: string, filename?: string) {
  const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '');
  const extension = filename?.split('.').pop()?.split('?')[0] || 'png';
  const key = `${Date.now()}-${randomUUID()}.${extension}`;
  return sanitizedFolder ? `${sanitizedFolder}/${key}` : key;
}

export async function POST(request: NextRequest) {
  try {
    const routeClient = await getSupabaseRouteClient();
    const {
      data: { user },
    } = await routeClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const formData = await request.formData();
    const image = formData.get('image');
    const prompt = formData.get('prompt');

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: 'Image file is required.' },
        { status: 400 }
      );
    }

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    // Upload l'image dans Supabase Storage
    const inputPath = createStorageKey(inputFolder, image.name);
    const inputBuffer = Buffer.from(await image.arrayBuffer());

    const { error: inputUploadError } = await supabase.storage
      .from(inputBucket)
      .upload(inputPath, inputBuffer, {
        contentType: image.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (inputUploadError) {
      console.error('Failed to upload input image:', inputUploadError);
      return NextResponse.json(
        { error: 'Failed to upload input image.' },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique ou signée
    const { data: publicData } = supabase.storage
      .from(inputBucket)
      .getPublicUrl(inputPath);

    const inputImageUrl = publicData.publicUrl;

    // Créer le projet avec status='pending' et payment_status='pending'
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        input_image_url: inputImageUrl,
        prompt: prompt.trim(),
        status: 'pending',
        payment_status: 'pending',
        payment_amount: 2.50,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError || !project) {
      console.error('Failed to create project:', insertError);
      return NextResponse.json(
        { error: 'Failed to create project.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ projectId: project.id });
  } catch (error: any) {
    console.error('Unexpected error in upload-and-create-project:', error);
    return NextResponse.json(
      { error: error.message || 'Unexpected error.' },
      { status: 500 }
    );
  }
}
