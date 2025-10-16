#!/bin/bash

# 🚀 Script de démarrage complet du projet avec Stripe
# Ce script lance le serveur Next.js et affiche les instructions pour Stripe CLI

echo "🎨 Démarrage du projet AI Image Editor avec Stripe"
echo "=================================================="
echo ""

# Vérifier que les packages sont installés
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo ""
fi

# Vérifier la configuration
echo "🔍 Vérification de la configuration..."
./test-stripe-config.sh
echo ""

# Instructions pour Stripe
echo "=================================================="
echo "🔔 IMPORTANT : Configuration du Webhook Stripe"
echo "=================================================="
echo ""
echo "Pour que les paiements fonctionnent, vous devez lancer Stripe CLI"
echo "dans un AUTRE terminal avec la commande suivante :"
echo ""
echo "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "Puis copiez le webhook secret affiché (whsec_...) dans .env.local :"
echo ""
echo "  STRIPE_WEBHOOK_SECRET=whsec_xxxxx..."
echo ""
echo "Et redémarrez ce script."
echo ""
echo "=================================================="
echo ""

# Demander si l'utilisateur veut continuer
read -p "Appuyez sur ENTRÉE pour démarrer le serveur Next.js..." 

echo ""
echo "🚀 Démarrage du serveur Next.js sur http://localhost:3000"
echo ""
echo "📚 Documentation disponible :"
echo "  - QUICKSTART.md : Guide de démarrage rapide"
echo "  - STRIPE_SETUP.md : Configuration Stripe détaillée"
echo "  - PAYMENT_FLOW.md : Architecture et flow complet"
echo ""
echo "💳 Carte de test Stripe :"
echo "  Numéro : 4242 4242 4242 4242"
echo "  Date   : 12/34"
echo "  CVC    : 123"
echo ""
echo "=================================================="
echo ""

# Lancer le serveur
npm run dev
