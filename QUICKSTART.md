# 🚀 Guide de Démarrage Rapide - Paiement Stripe

## Installation et Configuration (5 minutes)

### 1. Vérifier la configuration

```bash
./test-stripe-config.sh
```

Si tout est ✅, passez à l'étape 2.

### 2. Démarrer le serveur Next.js

```bash
npm run dev
```

Le serveur démarre sur http://localhost:3000

### 3. Configurer le webhook Stripe (dans un nouveau terminal)

```bash
# Installer Stripe CLI si ce n'est pas déjà fait
brew install stripe/stripe-cli/stripe

# Se connecter à Stripe
stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Vous verrez un message comme :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Copier le webhook secret

Copiez le `whsec_xxxxx...` affiché et ajoutez-le dans `.env.local` :

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Redémarrer le serveur

Arrêtez le serveur (Ctrl+C) et relancez :

```bash
npm run dev
```

## 🎮 Tester le Flow Complet

### Étape 1 : Créer un projet et payer

1. Allez sur http://localhost:3000/dashboard
2. Si vous n'êtes pas connecté, créez un compte ou connectez-vous
3. Uploadez une image
4. Entrez un prompt (ex: "transform this into a cyberpunk illustration")
5. Cliquez sur **"Générer (2,50 €)"**
6. Vous serez redirigé vers Stripe Checkout

### Étape 2 : Effectuer le paiement

Sur la page Stripe Checkout, utilisez la carte de test :

- **Numéro** : `4242 4242 4242 4242`
- **Date** : n'importe quelle date future (ex: 12/25)
- **CVC** : `123`
- **Email** : votre email

Cliquez sur "Payer"

### Étape 3 : Vérifier le webhook

Dans le terminal où tourne `stripe listen`, vous devriez voir :

```
✅ Webhook verified: checkout.session.completed
💰 Paiement complété pour la session: cs_test_xxxxx
📝 Metadata: { project_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }
✅ Projet mis à jour avec payment_status=paid
```

### Étape 4 : Retour sur le dashboard

Vous êtes automatiquement redirigé vers `/dashboard` avec un message :
> "Paiement confirmé ! Vous pouvez maintenant lancer la génération."

### Étape 5 : Lancer la génération

Sur votre projet, vous verrez un bouton vert **"Lancer la génération"**.

Cliquez dessus.

### Étape 6 : Voir le résultat

Après quelques secondes, l'image générée apparaît ! 🎉

## 🐛 Dépannage

### Le webhook ne reçoit rien

- ✅ Vérifiez que `stripe listen` est toujours actif
- ✅ Vérifiez que le serveur Next.js tourne sur le port 3000
- ✅ Essayez de redémarrer `stripe listen`

### Erreur "Webhook Error: Invalid signature"

- ✅ Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien défini dans `.env.local`
- ✅ Utilisez le secret affiché par `stripe listen`, pas celui du dashboard
- ✅ Redémarrez le serveur Next.js après avoir ajouté le secret

### Le bouton "Lancer la génération" n'apparaît pas

- ✅ Vérifiez que le webhook a bien été reçu (logs de `stripe listen`)
- ✅ Vérifiez dans Supabase que `payment_status = 'paid'` pour le projet
- ✅ Rafraîchissez la page `/dashboard`

### Erreur "Paiement requis"

Le projet n'a pas `payment_status='paid'`. Vérifiez :
- ✅ Le webhook est bien configuré
- ✅ Le webhook a bien été déclenché
- ✅ Les logs du terminal `stripe listen` pour voir les erreurs

## 📊 Vérifier les Données

### Dans Supabase

Allez dans votre projet Supabase > Table Editor > `projects`

Vous devriez voir :
- `payment_status` : `'paid'`
- `payment_amount` : `2.50`
- `stripe_checkout_session_id` : `cs_test_xxxxx`
- `stripe_payment_intent_id` : `pi_xxxxx`

### Dans Stripe Dashboard

Allez sur https://dashboard.stripe.com/test/payments

Vous verrez le paiement de 2,50 EUR avec le statut "Succeeded".

## 🎯 Ce qui a été créé

### Nouvelles routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/upload-and-create-project` | POST | Upload image + crée projet pending |
| `/api/create-checkout-session` | POST | Crée session Stripe Checkout |
| `/api/webhooks/stripe` | POST | Reçoit webhook de paiement |
| `/api/generate` | POST | Génère l'image (vérifie paiement) |
| `/api/projects/[id]` | GET | Récupère un projet |

### Nouveaux fichiers

- `src/lib/stripe-client.ts` - Client Stripe
- `STRIPE_SETUP.md` - Documentation configuration
- `PAYMENT_FLOW.md` - Documentation du flow
- `test-stripe-config.sh` - Script de test

### Fichiers modifiés

- `.env.local` - Variables Stripe
- `src/app/dashboard/DashboardClient.tsx` - UI avec paiement
- `src/app/api/generate/route.ts` - Vérification paiement

## 🎉 Prêt pour la production ?

Pour passer en production :

1. Créez un webhook dans [Stripe Dashboard Production](https://dashboard.stripe.com/webhooks)
2. URL : `https://votre-domaine.com/api/webhooks/stripe`
3. Événement : `checkout.session.completed`
4. Mettez à jour les variables d'environnement avec les clés de production
5. Testez avec une vraie carte avant de passer en live

## 📚 Documentation Complète

- **STRIPE_SETUP.md** - Configuration détaillée
- **PAYMENT_FLOW.md** - Architecture et flow complet
- **README.md** - Documentation générale du projet

---

Besoin d'aide ? Consultez les logs :
- Terminal 1 : `npm run dev` (logs Next.js)
- Terminal 2 : `stripe listen` (logs webhooks)
