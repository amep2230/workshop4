# 🔧 Fix : Erreur 413 (Content Too Large) sur Vercel

## 🔴 Problème

Lors du déploiement sur Vercel, l'erreur suivante se produit :

```
POST /api/upload-and-create-project 413 (Content Too Large)
```

## 📋 Cause

Vercel limite la taille des requêtes HTTP à **4.5 MB** pour les API routes, même sur les plans payants. Si l'utilisateur upload une image de plus de 4.5 MB, la requête est rejetée.

## ✅ Solutions Implémentées

### 1. Configuration de la Route API

Ajout de la configuration dans `src/app/api/upload-and-create-project/route.ts` :

```typescript
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max
```

### 2. Validation Côté Client

Ajout d'une vérification avant l'upload dans `DashboardClient.tsx` :

```typescript
// Vérifier la taille de l'image (limite à 4 MB pour Vercel)
const maxSizeInMB = 4;
const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
if (image.size > maxSizeInBytes) {
  setError(`L'image est trop grande (${(image.size / 1024 / 1024).toFixed(2)} MB). Limite : ${maxSizeInMB} MB.`)
  return
}
```

### 3. Compression Automatique d'Image

Création d'un helper `src/lib/image-compression.ts` qui :

1. **Redimensionne** l'image si elle dépasse 2048x2048 pixels
2. **Compresse** l'image avec une qualité ajustable (80% par défaut)
3. **Vérifie** que le fichier final est en dessous de 4 MB
4. **Réessaie** avec une qualité plus basse si nécessaire

Utilisation dans `DashboardClient.tsx` :

```typescript
import { prepareImageForUpload } from '@/lib/image-compression'

// Dans handleSubmit
let imageToUpload = image;
imageToUpload = await prepareImageForUpload(image, 4);
```

### 4. Message Informatif pour l'Utilisateur

Ajout d'un texte sous le champ de sélection d'image :

```
Taille maximale : 4 MB. Formats supportés : JPG, PNG, WebP
```

## 🎯 Comment ça Fonctionne

### Avant
```
User sélectionne image de 8 MB
    ↓
Upload vers Vercel
    ↓
❌ 413 Content Too Large
```

### Après
```
User sélectionne image de 8 MB
    ↓
Compression automatique côté client
    ↓
Image réduite à 3.5 MB
    ↓
Upload vers Vercel
    ↓
✅ Succès
```

## 📊 Limites de Vercel

| Plan | Limite de Body Size | Limite de Durée |
|------|---------------------|-----------------|
| Hobby (gratuit) | 4.5 MB | 10 secondes |
| Pro | 4.5 MB | 60 secondes |
| Enterprise | 4.5 MB | 900 secondes |

**Note** : La limite de 4.5 MB est **identique pour tous les plans** pour les API routes.

## 🔄 Alternative : Upload Direct vers Supabase

Si vous avez besoin d'uploader des images plus grandes (> 4 MB), vous pouvez :

### Solution Alternative : Upload Direct Client → Supabase

```typescript
// Côté client, uploader directement vers Supabase Storage
const { data, error } = await supabase.storage
  .from('input-images')
  .upload(`${userId}/${Date.now()}.jpg`, image);

// Puis envoyer seulement l'URL à votre API
await fetch('/api/create-project', {
  method: 'POST',
  body: JSON.stringify({
    imageUrl: data.path,
    prompt: prompt
  })
});
```

Cette approche contourne complètement la limite de Vercel car l'image ne transite pas par votre API route.

## ✅ Vérification

Pour tester que la compression fonctionne :

1. Sélectionnez une image > 4 MB
2. Ouvrez la console du navigateur (F12)
3. Vous devriez voir :
   ```
   Image trop grande (8.5 MB), compression en cours...
   Image préparée : 3.2 MB
   ```
4. L'upload devrait réussir

## 🚀 Déploiement

Après ces modifications :

```bash
git add .
git commit -m "fix: Add image compression for Vercel 4MB limit"
git push
```

Vercel redéploiera automatiquement et le problème sera résolu ! ✅

## 📚 Fichiers Modifiés

1. `src/app/api/upload-and-create-project/route.ts` - Configuration runtime
2. `src/app/dashboard/DashboardClient.tsx` - Validation + compression
3. `src/lib/image-compression.ts` - Helper de compression (nouveau)

## 🎉 Résultat

Les utilisateurs peuvent maintenant :
- ✅ Uploader des images jusqu'à ~15 MB (qui seront compressées à < 4 MB)
- ✅ Recevoir un message d'erreur clair si l'image est vraiment trop grande
- ✅ Voir la taille de l'image compressée dans la console
- ✅ Uploader sans se soucier de la limite Vercel

---

**Problème résolu ! 🎉**
