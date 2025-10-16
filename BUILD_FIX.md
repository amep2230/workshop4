# ✅ Fix Build Error - Stripe Initialization

## Problème résolu

**Erreur initiale :**
```
Error: Neither apiKey nor config.authenticator provided
```

Cette erreur se produisait lors du build car Stripe était initialisé au niveau du module (au chargement du fichier) avec `process.env.STRIPE_SECRET_KEY` qui était `undefined` pendant le build.

## Solution appliquée

### Avant (❌ Erreur)

```typescript
// Initialisation au niveau du module - ERREUR au build
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: NextRequest) {
  // Utilise stripe ici
}
```

### Après (✅ Fonctionnel)

```typescript
// Fonction helper qui initialise Stripe à la demande
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
  const stripe = getStripe(); // Initialisation lazy
  // Utilise stripe ici
}
```

## Fichiers modifiés

1. **`src/app/api/create-checkout-session/route.ts`**
   - Ajout de la fonction `getStripe()`
   - Initialisation lazy de Stripe

2. **`src/app/api/webhooks/stripe/route.ts`**
   - Ajout de la fonction `getStripe()`
   - Ajout de la fonction `getSupabaseAdmin()`
   - Initialisation lazy de Stripe et Supabase

## Pourquoi ce fix fonctionne

### Problème avec l'approche initiale

Quand vous déclarez une variable au niveau du module :

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

Cette ligne s'exécute **immédiatement** au moment où Next.js charge le fichier, ce qui arrive pendant le build. À ce moment-là, les variables d'environnement ne sont pas forcément chargées, donc `process.env.STRIPE_SECRET_KEY` est `undefined`.

### Solution : Lazy Initialization

Avec une fonction :

```typescript
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
```

L'initialisation ne se fait que quand la fonction est **appelée** (lors d'une requête HTTP), moment où les variables d'environnement sont garanties d'être chargées.

## Vérification

Le build passe maintenant avec succès :

```bash
✓ Linting and checking validity of types    
✓ Collecting page data    
✓ Generating static pages (12/12) 
✓ Finalizing page optimization    
```

## Pattern recommandé pour Next.js

Pour toute initialisation qui dépend de variables d'environnement dans les API routes :

### ❌ À éviter
```typescript
const client = new SomeClient(process.env.API_KEY!); // Au niveau du module
```

### ✅ Recommandé
```typescript
function getClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('API_KEY not configured');
  return new SomeClient(apiKey);
}

export async function POST() {
  const client = getClient(); // Dans la fonction handler
}
```

## Déploiement

Vous pouvez maintenant déployer sur Vercel, Netlify, ou toute autre plateforme sans erreur de build !

N'oubliez pas de configurer vos variables d'environnement sur la plateforme de déploiement :
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (après avoir créé le webhook)
- Toutes les autres variables Supabase et Replicate

---

**Build réussi ! 🎉**
