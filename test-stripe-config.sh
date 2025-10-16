#!/bin/bash

# 🎨 Script de test du flux de paiement Stripe
# Ce script vérifie que toutes les étapes sont bien configurées

echo "🔍 Vérification de la configuration Stripe..."
echo ""

# Vérifier les variables d'environnement
echo "📋 Vérification des variables d'environnement..."

if [ -f .env.local ]; then
    echo "✅ Fichier .env.local trouvé"
    
    if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configuré"
    else
        echo "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquant"
    fi
    
    if grep -q "STRIPE_SECRET_KEY" .env.local; then
        echo "✅ STRIPE_SECRET_KEY configuré"
    else
        echo "❌ STRIPE_SECRET_KEY manquant"
    fi
    
    if grep -q "NEXT_PUBLIC_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_URL configuré"
    else
        echo "❌ NEXT_PUBLIC_URL manquant"
    fi
    
    if grep -q "STRIPE_WEBHOOK_SECRET" .env.local; then
        if grep -q "^STRIPE_WEBHOOK_SECRET=whsec_" .env.local; then
            echo "✅ STRIPE_WEBHOOK_SECRET configuré"
        else
            echo "⚠️  STRIPE_WEBHOOK_SECRET commenté (normal en local sans webhook)"
        fi
    else
        echo "⚠️  STRIPE_WEBHOOK_SECRET manquant (requis pour les webhooks)"
    fi
else
    echo "❌ Fichier .env.local non trouvé"
    exit 1
fi

echo ""
echo "📦 Vérification des dépendances npm..."

if npm list stripe @stripe/stripe-js > /dev/null 2>&1; then
    echo "✅ Packages Stripe installés"
else
    echo "❌ Packages Stripe manquants. Exécutez: npm install stripe @stripe/stripe-js"
    exit 1
fi

echo ""
echo "📁 Vérification des fichiers API..."

files=(
    "src/lib/stripe-client.ts"
    "src/app/api/create-checkout-session/route.ts"
    "src/app/api/webhooks/stripe/route.ts"
    "src/app/api/upload-and-create-project/route.ts"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    exit 1
fi

echo ""
echo "🎯 Vérification de la base de données..."
echo "Vérifiez manuellement que la table 'projects' contient les colonnes:"
echo "  - payment_status"
echo "  - payment_amount"
echo "  - stripe_payment_intent_id"
echo "  - stripe_checkout_session_id"

echo ""
echo "✅ Configuration de base OK!"
echo ""
echo "🚀 Prochaines étapes:"
echo ""
echo "1️⃣  Démarrer le serveur de développement:"
echo "   npm run dev"
echo ""
echo "2️⃣  Configurer le webhook Stripe (dans un autre terminal):"
echo "   stripe login"
echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "3️⃣  Copier le webhook secret affiché et le mettre dans .env.local:"
echo "   STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
echo ""
echo "4️⃣  Redémarrer le serveur après avoir ajouté le webhook secret"
echo ""
echo "5️⃣  Tester le flow sur http://localhost:3000/dashboard"
echo ""
echo "💳 Carte de test Stripe:"
echo "   Numéro: 4242 4242 4242 4242"
echo "   Date: n'importe quelle date future"
echo "   CVC: 123"
echo ""
echo "📚 Documentation complète dans STRIPE_SETUP.md et PAYMENT_FLOW.md"
