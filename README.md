# Next.js AI Image Editor avec Paiement Stripe

Application Next.js permettant de générer des images avec IA (Replicate) avec un système de **paiement à la génération** via Stripe.

## 🎯 Fonctionnalités

- 🔐 **Authentification** : Supabase Auth
- 📤 **Upload d'images** : Stockage dans Supabase Storage
- 🎨 **Génération d'images IA** : Via Replicate (Flux-dev)
- 💳 **Paiement Stripe** : 2,50 EUR par génération
- 🔔 **Webhooks** : Validation automatique des paiements
- 📊 **Dashboard** : Gestion des projets et historique

## 💰 Modèle de Paiement

### Flow de Paiement

1. **Upload** → L'utilisateur upload une image et entre un prompt
2. **Checkout** → Redirection vers Stripe Checkout (2,50 EUR)
3. **Paiement** → L'utilisateur paie avec sa carte
4. **Webhook** → Stripe envoie un webhook `checkout.session.completed`
5. **Validation** → Le statut du projet passe à `paid`
6. **Génération** → L'utilisateur peut lancer la génération
7. **Résultat** → L'image générée est affichée

### Sécurité

- ✅ Vérification de la signature du webhook
- ✅ Montant hardcodé côté serveur (jamais envoyé par le client)
- ✅ Vérification du paiement avant génération
- ✅ Vérification de la propriété du projet (user_id)

## 🚀 Démarrage Rapide

### Installation

1. Cloner le repository :
   ```bash
   git clone <repository-url>
   cd workshop4
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement (voir `.env.local`)

4. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

5. Configurer le webhook Stripe :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

📚 **Guide complet** : Consultez [QUICKSTART.md](./QUICKSTART.md) pour les instructions détaillées.

## 📋 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` avec :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...

# Replicate
REPLICATE_API_TOKEN=r8_xxxxx...
REPLICATE_MODEL=black-forest-labs/flux-dev

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx...
STRIPE_SECRET_KEY=sk_test_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...

# Application
NEXT_PUBLIC_URL=http://localhost:3000
```

### Configuration du Webhook Stripe

#### Avec Stripe CLI (recommandé pour le développement)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copiez le webhook secret affiché et ajoutez-le dans `.env.local`.

#### Sans Stripe CLI (production)

Consultez [WEBHOOK_SETUP_NO_CLI.md](./WEBHOOK_SETUP_NO_CLI.md) pour configurer le webhook directement dans le Stripe Dashboard.

## 🗂️ Structure du Projet

```
workshop4/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── create-checkout-session/    # Crée session Stripe
│   │   │   ├── webhooks/stripe/            # Reçoit webhooks Stripe
│   │   │   ├── upload-and-create-project/  # Upload + crée projet
│   │   │   ├── generate/                   # Génère l'image (vérifie paiement)
│   │   │   └── projects/[id]/              # CRUD projets
│   │   ├── dashboard/                      # Page dashboard utilisateur
│   │   ├── login/                          # Page de connexion
│   │   └── signup/                         # Page d'inscription
│   ├── components/
│   │   ├── Editor/                         # Composants d'édition
│   │   ├── Auth/                           # Composants d'authentification
│   │   └── ui/                             # Composants UI réutilisables
│   ├── lib/
│   │   ├── stripe-client.ts                # Client Stripe (navigateur)
│   │   ├── supabase*.ts                    # Clients Supabase
│   │   └── utils.ts                        # Utilitaires
│   └── types/
│       └── index.ts                        # Types TypeScript
├── QUICKSTART.md                           # Guide de démarrage rapide
├── STRIPE_SETUP.md                         # Configuration Stripe détaillée
├── PAYMENT_FLOW.md                         # Documentation du flow de paiement
├── WEBHOOK_SETUP_NO_CLI.md                 # Config webhook sans CLI
└── test-stripe-config.sh                   # Script de vérification
```

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **[QUICKSTART.md](./QUICKSTART.md)** | Guide de démarrage rapide (5 min) |
| **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** | Configuration Stripe détaillée |
| **[PAYMENT_FLOW.md](./PAYMENT_FLOW.md)** | Architecture et flow complet |
| **[WEBHOOK_SETUP_NO_CLI.md](./WEBHOOK_SETUP_NO_CLI.md)** | Configuration webhook sans CLI |

## 🧪 Tests

### Vérifier la Configuration

```bash
./test-stripe-config.sh
```

### Tester le Paiement

1. Allez sur http://localhost:3000/dashboard
2. Uploadez une image et entrez un prompt
3. Cliquez sur "Générer (2,50 €)"
4. Utilisez la carte de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : `123`
5. Complétez le paiement
6. Vérifiez que le webhook est reçu dans les logs
7. Cliquez sur "Lancer la génération"
8. L'image est générée ! 🎉

## 🛠️ Technologies

- **Framework** : Next.js 14 (App Router)
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage
- **Paiement** : Stripe Checkout
- **IA** : Replicate (Flux-dev)
- **Styling** : Tailwind CSS
- **TypeScript** : Pour la sécurité des types

## 🔐 Sécurité

### Webhooks

- Vérification de la signature Stripe avec `stripe.webhooks.constructEvent()`
- Utilisation de `SUPABASE_SERVICE_ROLE_KEY` pour bypasser RLS dans le webhook
- Validation du `project_id` dans les metadata

### Paiements

- Montant toujours hardcodé côté serveur (250 centimes)
- Vérification que `payment_status='paid'` avant génération
- Vérification que `project.user_id === auth.user.id`

### API Routes

- Toutes les routes API vérifient l'authentification
- Row Level Security (RLS) activé sur Supabase
- Service Role Key utilisé uniquement pour les webhooks

## 🚀 Déploiement

### Vercel (recommandé)

```bash
vercel
```

Configurez les variables d'environnement dans le dashboard Vercel.

### Autres Plateformes

Consultez [WEBHOOK_SETUP_NO_CLI.md](./WEBHOOK_SETUP_NO_CLI.md) pour la configuration du webhook en production.

## 🐛 Dépannage

### Le webhook ne reçoit rien

- Vérifiez que `stripe listen` est actif
- Vérifiez que le serveur Next.js tourne sur le port 3000
- Consultez les logs de `stripe listen`

### Erreur "Invalid signature"

- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Utilisez le secret affiché par `stripe listen`
- Redémarrez le serveur après avoir ajouté le secret

### Le bouton "Lancer la génération" n'apparaît pas

- Vérifiez que le webhook a été reçu
- Vérifiez dans Supabase que `payment_status='paid'`
- Rafraîchissez la page

### Autres Problèmes

Consultez [STRIPE_SETUP.md](./STRIPE_SETUP.md) pour plus de solutions.

## 📝 License

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou soumettez une pull request.