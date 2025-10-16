# Configuration du Paiement Stripe

## Vue d'ensemble

Ce projet intègre Stripe avec le modèle **"paiement à la génération"** :
- Prix : **2,50 EUR** par génération d'image
- Paiement via Stripe Checkout
- Validation par webhook avant génération

## Architecture du flux de paiement

### 1. Création du projet et paiement

```
Utilisateur clique sur "Générer (2,50 €)"
    ↓
POST /api/upload-and-create-project
    - Upload l'image dans Supabase Storage
    - Crée un projet avec payment_status='pending'
    ↓
POST /api/create-checkout-session
    - Crée une Stripe Checkout Session
    - Montant: 250 centimes (2,50 EUR)
    - Metadata: { project_id }
    ↓
Redirection vers Stripe Checkout
    ↓
Utilisateur paie
    ↓
Stripe envoie webhook checkout.session.completed
    ↓
POST /api/webhooks/stripe
    - Vérifie la signature du webhook
    - Met à jour payment_status='paid'
    ↓
Utilisateur revient sur /dashboard
```

### 2. Génération de l'image

```
Utilisateur voit le bouton "Lancer la génération"
    ↓
POST /api/generate (avec projectId)
    - Vérifie payment_status='paid'
    - Génère l'image avec Replicate
    - Met à jour le projet avec output_image_url
```

## Configuration du Webhook Stripe

### Étape 1 : Créer le webhook dans Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/test/webhooks
2. Cliquez sur "Add endpoint"
3. URL du endpoint : `https://votre-domaine.com/api/webhooks/stripe`
   - En local avec Stripe CLI : `http://localhost:3000/api/webhooks/stripe`
4. Événements à écouter : `checkout.session.completed`
5. Cliquez sur "Add endpoint"

### Étape 2 : Récupérer le Webhook Secret

Après avoir créé le webhook, Stripe vous donnera un **Signing secret** qui commence par `whsec_...`

Ajoutez-le dans `.env.local` :

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Étape 3 : Tester en local avec Stripe CLI

Pour tester les webhooks en local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

La commande `stripe listen` vous donnera un webhook secret temporaire. Copiez-le dans `.env.local`.

### Étape 4 : Tester un paiement

```bash
# Dans un autre terminal, créer un événement de test
stripe trigger checkout.session.completed
```

Ou testez avec une vraie session de paiement :
- Utilisez la carte de test : `4242 4242 4242 4242`
- Date d'expiration : n'importe quelle date future
- CVC : n'importe quel 3 chiffres

## Variables d'environnement requises

```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Replicate (déjà configuré)
REPLICATE_API_TOKEN=...
```

## Sécurité

### Vérification de la signature webhook

L'endpoint `/api/webhooks/stripe` **vérifie systématiquement** la signature du webhook avec :

```typescript
stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

⚠️ **Important** : Ne jamais faire confiance aux données envoyées par le client. Le montant est toujours défini côté serveur (250 centimes hardcodé).

### Vérification du paiement avant génération

L'API `/api/generate` vérifie que :
1. Le projet existe
2. Le projet appartient à l'utilisateur connecté (`user_id`)
3. Le paiement est validé (`payment_status='paid'`)

## Structure de la base de données

La table `projects` contient :

```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  input_image_url text NOT NULL,
  output_image_url text,
  prompt text NOT NULL,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_amount numeric,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  created_at timestamp DEFAULT now()
);
```

## Logs de débogage

Les webhooks loguent tous les événements dans la console :
- ✅ Webhook vérifié
- 💰 Paiement complété
- 📝 Metadata reçus
- ❌ Erreurs de vérification

Consultez les logs pour debugger :

```bash
npm run dev
# puis dans un autre terminal
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Déploiement en production

1. Créez un nouveau webhook dans la section **Production** de Stripe Dashboard
2. Mettez à jour les variables d'environnement avec les clés de production
3. Configurez `NEXT_PUBLIC_URL` avec votre domaine de production
4. Testez avec une vraie carte de test avant de passer en live

## Dépannage

### Le webhook ne reçoit pas les événements

- Vérifiez que l'URL du webhook est accessible publiquement
- En local, utilisez `stripe listen --forward-to`
- Vérifiez les logs Stripe Dashboard > Webhooks > événements

### Erreur "Webhook Error: Invalid signature"

- Le `STRIPE_WEBHOOK_SECRET` est incorrect
- Vérifiez que vous utilisez le bon secret (test vs production)

### Le paiement est validé mais l'image ne se génère pas

- Vérifiez que `payment_status='paid'` dans la base de données
- Consultez les logs de l'API `/api/generate`
- Vérifiez que le `projectId` est bien passé au moment de la génération
