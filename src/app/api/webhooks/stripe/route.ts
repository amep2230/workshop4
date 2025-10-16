import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Utiliser le service role key pour bypasser RLS dans le webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Pas de signature Stripe dans les headers');
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET non configuré');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // IMPORTANT : Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Webhook vérifié:', event.type);
  } catch (err: any) {
    console.error('❌ Erreur de vérification du webhook:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Gérer l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('💰 Paiement complété pour la session:', session.id);
    console.log('📝 Metadata:', session.metadata);

    const projectId = session.metadata?.project_id;
    
    if (!projectId) {
      console.error('❌ Pas de project_id dans les metadata');
      return NextResponse.json(
        { error: 'No project_id in metadata' },
        { status: 400 }
      );
    }

    try {
      // Mettre à jour le projet avec payment_status='paid'
      const { data, error } = await supabase
        .from('projects')
        .update({
          payment_status: 'paid',
          payment_amount: (session.amount_total || 0) / 100, // Convertir de centimes en euros
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_checkout_session_id: session.id,
        })
        .eq('id', projectId)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du projet:', error);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }

      console.log('✅ Projet mis à jour avec payment_status=paid:', data);
    } catch (err: any) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }
  }

  // Retourner une réponse 200 pour confirmer la réception
  return NextResponse.json({ received: true });
}
