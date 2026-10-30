# ChezPrecious — Documentation des fonctionnalités livrées
**Date :** Avril 2026  
**Version :** 1.0  

---

## Vue d'ensemble

La plateforme ChezPrecious est composée de trois applications distinctes :

| Application | URL de production | Description |
|---|---|---|
| **Site public** | chezprecious.com | Boutique en ligne pour les clients |
| **Panel Admin** | admin.chezprecious.com | Interface de gestion complète |
| **API** | api.chezprecious.com | Backend commun aux deux |

---

## 1. SITE PUBLIC — Boutique client

### 1.1 Page d'accueil
- Bannière hero avec visuel et bouton d'action
- Section **Nouveautés** — carrousel des derniers produits
- Section **Collection permanente** — carrousel auto-défilant des essentiels ChezPrecious
- Section **Recommandés pour vous** — sélection personnalisée
- Section **Meilleures ventes** — produits les plus populaires

---

### 1.2 Catalogue / Boutique (`/shop`)
- Affichage de tous les produits avec pagination
- **Filtres disponibles :**
  - Par catégorie (menu déroulant dynamique)
  - Par fourchette de prix (curseur 0 – 450 €)
  - Par tri : Nouveautés, Prix croissant, Prix décroissant
- Basculement vue **Grille / Liste**
- Affichage du nombre de résultats
- Filtres actifs affichés sous forme de pastilles (suppression rapide)
- Filtres sur tiroir mobile (drawer)
- État vide avec bouton de réinitialisation des filtres
- **Synchronisation URL** : les liens navbar/footer (`?cat=femme`, `?filter=new`) appliquent directement les filtres et activent les pastilles correspondantes

---

### 1.3 Fiche produit (`/product/[slug]`)
- Galerie d'images produit
- Nom, catégorie, prix, prix barré (si promotion)
- Notation étoile
- Description complète
- Sélection de variantes (taille, couleur)
- Indicateur de stock
- Bouton **Ajouter au panier**
- Bouton **Ajouter aux favoris**
- Fil d'Ariane (navigation)

---

### 1.4 Panier (`/cart`)
- Liste des articles avec image, nom, variantes choisies
- Contrôle de quantité (+ / –)
- Suppression d'un article
- Calcul automatique : sous-total, frais de livraison, total
- Livraison offerte à partir de 80 €
- Bouton vers le paiement
- État vide avec lien vers la boutique

---

### 1.5 Tunnel de commande (`/checkout`)
Le checkout se déroule en 3 étapes avec barre de progression :

**Étape 1 — Livraison**
- Saisie des coordonnées (prénom, nom, email, téléphone)
- Adresse complète (rue, code postal, ville, pays)
- Note de livraison (optionnelle)
- Choix du mode : **Standard** (3–5 jours, 4,90 €) ou **Express** (24–48h, 9,90 €)
- Livraison standard offerte dès 80 € d'achat

**Étape 2 — Paiement**
- **Carte bancaire** (Visa, Mastercard, CB) — champs numéro, titulaire, expiration, CVV
- **Mobile Money** (MTN, Moov, Wave)
- **PayPal**
- **Google Pay**
- **Apple Pay**
- Indicateur de sécurité SSL

**Étape 3 — Confirmation**
- Numéro de commande généré
- Récapitulatif de livraison
- Total payé
- Email de confirmation envoyé automatiquement
- Lien vers le suivi de commande

---

### 1.6 Pages informatives

| Page | Contenu |
|---|---|
| `/about` | Histoire de la marque, valeurs, équipe |
| `/contact` | Formulaire de contact, adresse, téléphone, email, horaires, carte — **données dynamiques depuis l'admin** |
| `/faq` | Questions fréquentes avec accordéons |
| `/livraison` | Options et tarifs de livraison, zones, politique de retour |
| `/mentions` | Mentions légales |
| `/confidentialite` | Politique de confidentialité |

---

### 1.7 Authentification client

- **Inscription** par email + mot de passe
- **Connexion** email / mot de passe
- **Réinitialisation de mot de passe** par email
- **Activation de compte** par lien email
- Sessions sécurisées JWT

---

### 1.8 Recherche
- Barre de recherche dans la navbar
- **Suggestions en temps réel** (au-delà de 2 caractères)
- Recherche avancée par mots-clés
- Fermeture au clic extérieur ou touche Échap

---

### 1.9 Dynamique depuis l'admin
Les informations suivantes s'affichent automatiquement d'après la configuration de l'admin :
- **Navbar** : nom du site, logo
- **Footer** : nom du site, slogan, adresse, email, téléphone, réseaux sociaux (Instagram, TikTok, Facebook, YouTube, Twitter, LinkedIn)
- **Contact** : adresse, email, téléphone, horaires
- **SEO** : titre et description meta de chaque page

---

## 2. ESPACE CLIENT (Board utilisateur)

Accessible après connexion sur `/account`.

### 2.1 Tableau de bord (`/account`)
- Carte de statistiques : Total dépensé, Nombre de commandes, Favoris, Avis publiés
- **Commandes récentes** : tableau des 5 dernières commandes (numéro, date, articles, total, statut)
- **Avis récents** : liste des 5 derniers avis avec note et lien vers la gestion

---

### 2.2 Profil (`/account/profile`)
- Upload et prévisualisation de l'avatar
- Modification du nom complet et du téléphone
- Email affiché (non modifiable, statut de vérification)
- Sauvegarde avec notification de succès/erreur

---

### 2.3 Mes commandes (`/account/orders`)
- Onglets de filtrage : **Toutes, En cours, Expédiées, Livrées, Annulées**
- Recherche par numéro de commande
- Statistiques : Total, En cours, Livrées, Annulées
- Vue **tableau** (desktop) / **cartes** (mobile)
- **Détail de commande (modal) :**
  - Suivi en étapes visuelles : Confirmée → En préparation → Expédiée → Livrée
  - Adresse de livraison complète
  - Liste des articles avec images, quantités, prix unitaires et totaux
  - Sous-total, frais de livraison, total TTC

---

### 2.4 Mes adresses (`/account/addresses`)
- Affichage de toutes les adresses sauvegardées
- Création d'une nouvelle adresse (label, nom, rue, CP, ville, pays, téléphone)
- Modification d'une adresse existante
- Suppression d'une adresse
- Définir une adresse par défaut
- Badge "Défaut" affiché sur l'adresse principale

---

### 2.5 Mes favoris (`/account/wishlist`)
- Statistiques : Total, En stock, En promotion
- Grille de produits favoris avec :
  - Image et badge de réduction (si promo)
  - Prix et prix barré (si promo)
  - Statut de disponibilité
  - Date d'ajout
  - Bouton **Ajouter au panier** (désactivé si rupture de stock)
  - Bouton **Voir le produit**
  - Bouton **Retirer des favoris**
- État vide avec lien vers la boutique

---

### 2.6 Mes avis (`/account/reviews`)
- Statistiques : Avis publiés, Note moyenne, Votes "utile", Avis vérifiés
- Liste des avis avec produit, note en étoiles, badge "vérifié", commentaire, date
- Modification d'un avis (note + commentaire)
- Suppression d'un avis (avec confirmation)

---

### 2.7 Sécurité (`/account/security`)
- Informations du compte (email, statut de vérification, statut actif)
- Modification du mot de passe :
  - Mot de passe actuel
  - Nouveau mot de passe
  - Confirmation
  - Validation en temps réel (8 caractères min, majuscule, minuscule, chiffre)
  - Affichage/masquage du mot de passe

---

### 2.8 Messages (`/account/messages`)
- Interface de chat avec le support ChezPrecious
- Affichage chronologique des messages
- Messages client (droite, orange) / Support (gauche, blanc)
- Envoi par bouton ou touche Entrée
- Défilement automatique vers le dernier message

---

### 2.9 Notifications (`/account/notifications`)
- Notifications groupées par jour (Aujourd'hui, Hier, dates passées)
- Types : Commande, Message, Système (icônes et couleurs distinctes)
- Indicateur de non-lu (point bleu)
- Actions par notification : Marquer comme lu, Supprimer
- Actions globales : **Tout marquer comme lu**, **Effacer les lus**
- Pagination (20 par page)

---

## 3. PANEL ADMIN

Accessible sur admin.chezprecious.com.

### 3.1 Authentification admin
- Connexion email / mot de passe dédié admin
- Demande de réinitialisation de mot de passe
- Définition de mot de passe (premier accès ou reset)

---

### 3.2 Tableau de bord
- KPIs en temps réel : Chiffre d'affaires, Commandes, Clients, Produits
- Graphique d'évolution du CA
- Activité récente
- Indicateurs de performance

---

### 3.3 Gestion des produits

**Liste des produits :**
- Tableau paginé avec image, nom, catégorie, prix, stock, statut
- Export des produits
- Recherche et filtres
- Changement de statut rapide (Actif, Inactif, Brouillon)
- Suppression

**Création / Édition d'un produit :**

*Onglet Informations générales :*
- Nom, slug auto-généré, description courte, description complète (éditeur riche)
- Catégorie et sous-catégorie
- Marque, condition (Neuf / Reconditionné / Occasion), garantie, origine
- Upload jusqu'à 8 images (drag-and-drop, réorganisation, image principale)
- Upload de 2 vidéos (fichier ou URL YouTube/Vimeo)

*Onglet Prix & Stock :*
- Devise (EUR, USD, GBP, XOF…)
- Prix de vente, prix barré, coût d'achat
- Calcul automatique de la marge
- TVA (0%, 5.5%, 10%, 20%)
- SKU, code-barres
- Gestion du stock (quantité, seuil d'alerte, commande en rupture)

*Onglet Variantes :*
- Activation des variantes
- Création d'options (ex. Taille, Couleur) avec leurs valeurs
- Génération automatique des combinaisons
- Prix et stock individuels par variante
- Application en masse sur toutes les variantes

*Onglet Livraison :*
- Poids et dimensions (L × l × H)
- Disponibilité : livraison standard, express, retrait en magasin

*Onglet Métadonnées :*
- Tags produit
- Titre SEO et méta-description

*Aperçu en direct (sidebar) :*
- Prévisualisation du produit tel qu'affiché sur le site
- Compteurs : images, vidéos, variantes, tags
- Statut Actif / Mis en avant

---

### 3.4 Gestion des commandes
- Liste paginée de toutes les commandes
- Informations : numéro, client, date, articles, total, statut
- Détail complet d'une commande
- Export des commandes

---

### 3.5 Gestion des clients
- Liste paginée avec avatar, nom, email, rôle, statut
- Statistiques : total clients, actifs, vendeurs, inactifs
- Export de la liste
- **Fiche client :**
  - Informations de profil
  - Historique des commandes avec totaux
  - Liste de ses avis
  - Adresses enregistrées
  - Activation / désactivation du compte

---

### 3.6 Analytiques
- Graphique CA dans le temps (configurable par période)
- Répartition par source de trafic / canaux
- Top produits par revenu
- Indicateurs de conversion

---

### 3.7 Gestion des catégories
- Création, modification, suppression de catégories
- Gestion des sous-catégories (hiérarchie 2 niveaux)
- Activation / désactivation d'une catégorie

---

### 3.8 Promotions & Codes promo
- Création de codes promotionnels
- Configuration des règles (montant fixe, %, conditions d'application)
- Activation / désactivation
- Suivi d'utilisation

---

### 3.9 Livraison (`/shipping`)
- Configuration des transporteurs et tarifs
- Visualisation des livraisons en cours et de leur statut

---

### 3.10 Paiements (`/payments`)
- Historique des transactions
- Détails par paiement (méthode, montant, statut, référence)
- Export des données financières

---

### 3.11 Messages admin
- Vue de toutes les conversations clients ↔ support
- Interface de chat pour répondre directement
- Statistiques de messages (non lus, en attente)

---

### 3.12 Notifications admin
- Centre de notifications de l'admin
- Envoi de notifications ciblées (par utilisateur ou en masse)
- Historique des notifications envoyées

---

### 3.13 Newsletter
- Liste des abonnés avec statistiques
- Création et envoi de campagnes email
- Gestion des désabonnements

---

### 3.14 Équipe (`/team`)
- Liste des membres admin avec rôle et statut
- Invitation d'un nouvel administrateur par email
- Modification des droits et informations
- Activation / désactivation d'un membre
- Renvoi du lien de configuration

---

### 3.15 Rapports (`/reports`)
- Génération de rapports vendeurs
- Export **CSV** (compatible Excel)
- Export **PDF** (mise en page imprimable)
- Contenu : KPIs, liste des commandes, top produits

---

### 3.16 Paramètres (`/settings`)

| Section | Contenu |
|---|---|
| **Contact** | Emails (contact, support, no-reply), téléphones (principal, WhatsApp, support), adresse, ville, pays, horaires |
| **Réseaux sociaux** | URLs Facebook, Instagram, Twitter/X, YouTube, LinkedIn, TikTok |
| **Apparence** | Couleurs primaire, secondaire, accent ; upload logo, favicon, bannière |
| **Commerce** | Devise, commission marketplace, montant minimum de commande, seuil livraison gratuite, taux de TVA |
| **Livraison** | Transporteurs actifs et leurs tarifs (Colissimo, Chronopost, Point Relais, Click & Collect) |
| **SEO** | Titre meta, description meta, mots-clés, Google Analytics ID, Facebook Pixel ID |
| **Pages légales** | Éditeur riche pour CGU, Politique de confidentialité, Mentions légales, Politique de retour |
| **Notifications** | Activation des alertes commandes, stock, email, push |
| **Avancé** | Mode maintenance, modération des produits et avis, inscription vendeurs |
| **Contenu Homepage** | Configuration des bannières dynamiques, ventes flash, sections publicitaires |

> **Important :** toutes les informations de contact, réseaux sociaux et nom du site configurés ici s'affichent **automatiquement** sur le site public (footer, page contact, navbar).

---

## 4. INFRASTRUCTURE & TECHNIQUE

| Élément | Technologie |
|---|---|
| Site public | Next.js (App Router), TypeScript, SCSS Modules |
| Panel Admin | Next.js, TypeScript, Material UI |
| API | AdonisJS (Node.js), TypeScript, Prisma ORM |
| Base de données | PostgreSQL (Supabase en production) |
| Authentification | JWT + OAuth Google + OAuth Facebook |
| Stockage fichiers | Local (`/uploads/`) avec symlink persistant (images non écrasées au build) |
| Déploiement API | PM2 sur VPS |
| Devise | Euro (€) par défaut |

---

*Document généré le 24 avril 2026*
