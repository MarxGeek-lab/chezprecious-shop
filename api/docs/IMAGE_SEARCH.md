# Recherche par image — Documentation technique

## Vue d'ensemble

Le système de recherche par image permet aux utilisateurs de trouver des produits visuellement similaires en uploadant une photo ou en collant une URL d'image. Il utilise **TensorFlow.js** avec le modèle **MobileNet v2** pour extraire des empreintes visuelles et les comparer par **similarité cosinus**.

---

## Architecture

```
Utilisateur uploade une image
        │
        ▼
POST /api/search/image
        │
        ▼
SearchController.searchByImage()
        │
        ├── Mode fichier : sauvegarde dans tmp/image-search/
        └── Mode URL    : passée directement au service
        │
        ▼
ImageSearchService.searchSimilarProducts()
        │
        ├── Extraction des features de l'image de recherche (MobileNet → vecteur 1280D)
        │
        ├── Pour chaque produit en base :
        │     └── Lecture des features pré-indexées (table image_features)
        │
        ├── Calcul similarité cosinus entre l'image et chaque produit
        │
        └── Filtrage par seuil minimum + tri décroissant
        │
        ▼
Retourne la liste des produits similaires triés par score
```

---

## Modèle : MobileNet v2

MobileNet est un réseau de neurones convolutif entraîné sur **ImageNet** (1.2 million d'images, 1000 catégories). Il transforme n'importe quelle image en un **vecteur de 1280 dimensions** représentant ses caractéristiques visuelles (couleurs, formes, textures, objets).

**Avantages :**
- Léger et rapide (conçu pour mobile/edge)
- Fonctionne entièrement **en local** — aucune API externe
- Bonne précision pour distinguer les grandes catégories visuelles

**Limites :**
- Moins précis pour les sous-catégories fines (ex: sneaker vs derby)
- Entraîné sur des catégories générales — performances meilleures pour électronique, animaux, véhicules que pour la mode

---

## Similarité cosinus

Pour comparer deux images, on calcule l'angle entre leurs vecteurs de features :

```
similarity = (A · B) / (|A| × |B|)
```

Le résultat est compris entre **0** et **1** :

| Score | Interprétation |
|-------|----------------|
| `0.9 – 1.0` | Images quasi-identiques |
| `0.7 – 0.9` | Très similaires (même objet, même style) |
| `0.55 – 0.7` | Même catégorie générale |
| `0.4 – 0.55` | Vaguement similaires |
| `< 0.4` | Sans rapport visuel — filtrés |

---

## Seuil de pertinence

Le seuil actuel est **0.4**. Tout produit avec un score inférieur est exclu des résultats.

**Fichier à modifier :** `app/services/image_search_service.ts`, paramètre `minSimilarity` ligne ~131

```typescript
async searchSimilarProducts(
  queryImagePath: string,
  productImages: [...],
  topK: number = 10,
  minSimilarity: number = 0.4  // ← modifier ici
)
```

**Guide de réglage :**

| Seuil | Effet |
|-------|-------|
| `0.3` | Très permissif — beaucoup de faux positifs |
| `0.4` | **Actuel** — bon équilibre recall/précision |
| `0.55` | Strict — uniquement visuellement très proches |
| `0.7` | Très strict — quasi identiques |

> **Calibration :** Les top 5 scores sont loggués dans la console serveur à chaque recherche :
> ```
> [ImageSearch] Top scores: 0.621, 0.589, 0.512, 0.487, 0.401 | seuil: 0.4
> ```
> Observez ces valeurs pour ajuster le seuil selon votre catalogue.

---

## Indexation des features

Chaque image produit doit avoir ses features pré-calculées et stockées dans la table `image_features`. Sans ça, le service tente d'extraire les features à la volée (plus lent, peut échouer).

### Déclenchement automatique

L'indexation est lancée en **arrière-plan** (fire-and-forget, ne bloque pas la réponse HTTP) :

- À la **création** d'un produit (seller ou admin)
- À la **mise à jour** d'un produit avec de nouvelles images

Les images déjà indexées sont **sautées** automatiquement.

### Indexation manuelle (rattrapage)

Pour indexer tous les produits existants ou réindexer après une migration :

```bash
cd api
npx tsx prisma/index-images.ts
```

Sortie attendue :
```
📦 14 produits à indexer

🔄 Smartphone Pro: Extraction features...
✅ Smartphone Pro: Indexé (1280 features)
✓ Laptop UltraBook: Déjà indexé
...

📊 Résumé:
   ✅ Succès: 2
   ⏭️  Déjà indexés: 12
   ❌ Erreurs: 0
```

### Schéma base de données

```prisma
model ImageFeatures {
  id             String       @id
  productImageId String       @unique
  features       Json         // Vecteur Float[] de 1280 dimensions
  modelVersion   String       @default("mobilenet-v2")
  createdAt      DateTime
  updatedAt      DateTime
}
```

---

## API

### Recherche par image (fichier uploadé)

```http
POST /api/search/image
Content-Type: multipart/form-data

image   : <fichier> (jpg, jpeg, png, webp — max 10 Mo)
limit   : number (optionnel, défaut 12, max 20)
```

### Recherche par image (URL distante)

```http
POST /api/search/image
Content-Type: multipart/form-data

imageUrl : "https://example.com/image.jpg"
limit    : number (optionnel)
```

### Réponse

```json
{
  "data": [
    {
      "id": "...",
      "name": "Smartphone Pro Max",
      "price": "299000",
      "similarity": 0.721,
      "images": [...],
      "store": { "id": "...", "name": "TechStore" }
    }
  ],
  "meta": {
    "total": 3,
    "minSimilarity": 0.412,
    "maxSimilarity": 0.721
  }
}
```

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `app/services/image_search_service.ts` | Service MobileNet : extraction features, calcul similarité, seuil |
| `app/controllers/search_controller.ts` | Endpoint HTTP, gestion fichier/URL, appel service |
| `app/controllers/product_controller.ts` | Déclenche l'indexation après création/update produit (seller) |
| `app/controllers/admin_product_controller.ts` | Idem pour l'admin |
| `prisma/index-images.ts` | Script d'indexation manuelle en masse |
