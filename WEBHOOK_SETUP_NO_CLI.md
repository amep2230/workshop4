# 🔐 Configuration du Webhook Stripe (Sans CLI)

Si vous ne voulez pas utiliser Stripe CLI et que vous déployez directement sur un serveur accessible publiquement, voici comment configurer le webhook.

## Prérequis

- Votre application doit être accessible sur Internet (pas sur localhost)
- Vous devez avoir un compte Stripe

## Étapes de Configuration

### 1. Déployer votre application

Déployez d'abord votre application sur :
- Vercel
- Netlify
- Railway
- Render
- Ou tout autre hébergement

Assurez-vous que l'URL `/api/webhooks/stripe` est accessible publiquement.

### 2. Accéder au Stripe Dashboard

#### En mode Test
1. Allez sur https://dashboard.stripe.com/test/webhooks
2. Assurez-vous d'être en mode **Test** (toggle en haut à droite)

#### En mode Production
1. Allez sur https://dashboard.stripe.com/webhooks
2. Assurez-vous d'être en mode **Live**

### 3. Créer un Webhook Endpoint

1. Cliquez sur le bouton **"+ Add endpoint"**

2. Dans **"Endpoint URL"**, entrez :
   ```
   https://votre-domaine.com/api/webhooks/stripe
   ```
   
   Exemples :
   - Vercel : `https://votre-app.vercel.app/api/webhooks/stripe`
   - Custom domain : `https://app.monsite.com/api/webhooks/stripe`

3. Dans **"Description"** (optionnel), entrez :
   ```
   Webhook pour les paiements de génération d'images IA
   ```

4. Cliquez sur **"Select events to listen to"**

5. Dans la recherche, tapez `checkout.session.completed`

6. Cochez la case ☑️ **`checkout.session.completed`**

7. Cliquez sur **"Add events"**

8. Cliquez sur **"Add endpoint"**

### 4. Récupérer le Signing Secret

Une fois le webhook créé :

1. Vous serez redirigé vers la page de détails du webhook

2. Scrollez jusqu'à la section **"Signing secret"**

3. Cliquez sur **"Reveal"** ou **"Click to reveal"**

4. Copiez le secret qui commence par `whsec_...`
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 5. Ajouter le Secret dans vos Variables d'Environnement

#### Pour le développement local

Ajoutez dans `.env.local` :
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Redémarrez votre serveur :
```bash
npm run dev
```

#### Pour la production (Vercel)

1. Allez dans votre projet Vercel
2. Settings > Environment Variables
3. Ajoutez :
   - **Name** : `STRIPE_WEBHOOK_SECRET`
   - **Value** : `whsec_xxxxx...`
   - **Environment** : Production (ou tous)
4. Cliquez sur **"Save"**
5. Redéployez votre application

#### Pour la production (autres plateformes)

**Netlify :**
```
Site settings > Build & deploy > Environment > Environment variables
```

**Railway :**
```
Variables > New Variable
```

**Render :**
```
Environment > Environment Variables
```

### 6. Tester le Webhook

#### Option 1 : Tester avec l'interface Stripe

1. Dans la page de votre webhook, cliquez sur l'onglet **"Send test webhook"**
2. Sélectionnez **`checkout.session.completed`**
3. Cliquez sur **"Send test webhook"**
4. Vérifiez les logs de votre application

#### Option 2 : Tester avec un vrai paiement

1. Allez sur votre application déployée
2. Créez un projet et lancez un paiement
3. Utilisez la carte de test : `4242 4242 4242 4242`
4. Complétez le paiement
5. Vérifiez que le webhook a été reçu

### 7. Vérifier que le Webhook Fonctionne

Dans le Stripe Dashboard, sur la page de votre webhook :

1. Allez dans l'onglet **"Recent events"**
2. Vous devriez voir les événements `checkout.session.completed`
3. Si le statut est **✅ Succeeded**, tout fonctionne !
4. Si le statut est **❌ Failed**, cliquez dessus pour voir l'erreur

Les erreurs courantes :
- **401 Unauthorized** : Vérifiez que votre application est accessible
- **500 Internal Server Error** : Vérifiez les logs de votre application
- **Signature verification failed** : Le `STRIPE_WEBHOOK_SECRET` est incorrect

## 🔒 Sécurité

### ⚠️ Important : Secrets Différents pour Test et Production

Stripe génère **deux secrets différents** :
- Un pour le mode **Test** (`whsec_...`)
- Un pour le mode **Live** (`whsec_...`)

Assurez-vous d'utiliser le bon secret pour chaque environnement !

### 📋 Bonnes Pratiques

1. **Ne commitez JAMAIS le webhook secret dans Git**
   - Ajoutez `.env.local` dans `.gitignore`
   
2. **Utilisez des secrets différents par environnement**
   - Development : Secret du webhook test
   - Production : Secret du webhook live

3. **Vérifiez toujours la signature**
   - Notre code le fait automatiquement avec `stripe.webhooks.constructEvent()`

4. **Surveillez les webhooks en production**
   - Activez les alertes email dans Stripe Dashboard
   - Vérifiez régulièrement les logs

## 🐛 Dépannage

### Erreur : "No signing secret provided"

Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien défini dans vos variables d'environnement.

### Erreur : "Invalid signature"

1. Vérifiez que vous utilisez le bon secret (test vs production)
2. Assurez-vous que le secret commence bien par `whsec_`
3. Vérifiez qu'il n'y a pas d'espace avant ou après le secret
4. Redéployez l'application après avoir changé le secret

### Le webhook n'arrive jamais

1. Vérifiez que l'URL est accessible publiquement
2. Testez l'URL dans votre navigateur : `https://votre-domaine.com/api/webhooks/stripe`
   - Vous devriez voir une erreur 400 (c'est normal, c'est une requête POST)
3. Vérifiez les logs du webhook dans Stripe Dashboard

### Le webhook arrive mais ne met pas à jour la base

1. Vérifiez les logs de votre application
2. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré
3. Vérifiez que le `project_id` est bien dans les metadata de la session

## 📊 Monitoring

### Activer les Alertes Email

1. Dans Stripe Dashboard > Developers > Webhooks
2. Cliquez sur votre webhook
3. Activez **"Email me when webhook events fail"**

Vous recevrez un email si un webhook échoue pendant 3 heures consécutives.

### Logs en Production

Pour voir les logs de votre webhook :

**Vercel :**
```
Deployments > [votre déploiement] > Functions > /api/webhooks/stripe
```

**Netlify :**
```
Functions > Logs
```

**Railway :**
```
Deployments > View Logs
```

## 🎯 Checklist de Déploiement

Avant de passer en production :

- [ ] Webhook créé dans Stripe Dashboard (mode Live)
- [ ] URL du webhook est correcte et accessible
- [ ] `STRIPE_WEBHOOK_SECRET` configuré en production
- [ ] `STRIPE_SECRET_KEY` (mode Live) configuré
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (mode Live) configuré
- [ ] Webhook testé avec l'outil "Send test webhook"
- [ ] Paiement de test effectué et webhook reçu
- [ ] Alertes email activées
- [ ] Logs de production vérifiés

## 🚀 Prêt !

Votre webhook est maintenant configuré et prêt à recevoir les paiements en production ! 🎉

Pour plus d'informations :
- [Documentation Stripe sur les Webhooks](https://stripe.com/docs/webhooks)
- [Guide de sécurité des Webhooks](https://stripe.com/docs/webhooks/best-practices)
