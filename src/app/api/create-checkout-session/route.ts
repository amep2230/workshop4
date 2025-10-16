import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseRouteClient } from '@/lib/supabase-route';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await getSupabaseRouteClient();

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { projectId, imageFile, prompt } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId manquant' },
        { status: 400 }
      );
    }

    // Vérifier que le projet appartient bien à l'utilisateur
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projet introuvable ou non autorisé' },
        { status: 404 }
      );
    }

    // Créer la Checkout Session Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: "Génération d'image IA",
              description: 'Une génération d\'image avec IA',
            },
            unit_amount: 250, // 2.50 EUR en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
      metadata: {
        project_id: projectId,
        user_id: session.user.id,
      },
    });

    // Mettre à jour le projet avec le checkout_session_id
    await supabase
      .from('projects')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
      })
      .eq('id', projectId);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la session Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
