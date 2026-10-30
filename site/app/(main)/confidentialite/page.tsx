import styles from "./page.module.scss";

export const metadata = { title: "Politique de confidentialité — Chez Precious" };

export default function ConfidentialitePage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Vos données</span>
        <h1 className={styles.heroTitle}>Politique de confidentialité</h1>
        <p className={styles.heroDate}>Dernière mise à jour : 1er janvier 2025</p>
      </div>

      <div className={styles.content}>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. Responsable du traitement</h2>
          <p className={styles.para}>Chez Precious, 12 rue du Commerce, Cotonou, Bénin. Email : contact@chezprecious.com. En tant que responsable du traitement, Chez Precious s'engage à protéger vos données personnelles conformément aux réglementations applicables.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Données collectées</h2>
          <p className={styles.para}>Lors de votre utilisation de notre site, nous pouvons collecter les données suivantes :</p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone.</li>
            <li className={styles.listItem}><strong>Données de livraison :</strong> adresse postale, ville, pays.</li>
            <li className={styles.listItem}><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages visitées (anonymisées).</li>
            <li className={styles.listItem}><strong>Données de paiement :</strong> gérées directement par nos prestataires de paiement sécurisés (non stockées par Chez Precious).</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Finalités du traitement</h2>
          <p className={styles.para}>Vos données sont collectées pour les finalités suivantes :</p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Traitement et suivi de vos commandes</li>
            <li className={styles.listItem}>Gestion de votre compte client</li>
            <li className={styles.listItem}>Envoi d'emails transactionnels (confirmation de commande, suivi de livraison)</li>
            <li className={styles.listItem}>Envoi de la newsletter (avec votre consentement explicite)</li>
            <li className={styles.listItem}>Amélioration de nos services et de l'expérience utilisateur</li>
            <li className={styles.listItem}>Respect de nos obligations légales et comptables</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Durée de conservation</h2>
          <p className={styles.para}>Vos données personnelles sont conservées pour la durée strictement nécessaire à l'accomplissement des finalités mentionnées ci-dessus :</p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Données client :</strong> 3 ans à compter du dernier achat ou de la dernière connexion.</li>
            <li className={styles.listItem}><strong>Données de commande :</strong> 10 ans à des fins comptables et fiscales.</li>
            <li className={styles.listItem}><strong>Données de newsletter :</strong> jusqu'à désinscription.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>5. Partage des données</h2>
          <p className={styles.para}>Chez Precious ne vend pas vos données personnelles à des tiers. Vos données peuvent être partagées avec :</p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Nos prestataires logistiques (uniquement les données nécessaires à la livraison)</li>
            <li className={styles.listItem}>Nos prestataires de paiement sécurisé</li>
            <li className={styles.listItem}>Notre prestataire d'hébergement (Vercel Inc.)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>6. Vos droits</h2>
          <p className={styles.para}>Conformément aux réglementations en vigueur, vous disposez des droits suivants :</p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
            <li className={styles.listItem}><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
            <li className={styles.listItem}><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li className={styles.listItem}><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            <li className={styles.listItem}><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
          </ul>
          <p className={styles.para}>Pour exercer ces droits, contactez-nous à <a href="mailto:privacy@chezprecious.com" className={styles.link}>privacy@chezprecious.com</a>. Nous répondrons dans un délai maximum de 30 jours.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>7. Cookies</h2>
          <p className={styles.para}>Nous utilisons trois catégories de cookies :</p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (panier, session, préférences). Non désactivables.</li>
            <li className={styles.listItem}><strong>Cookies analytiques :</strong> mesure d'audience anonymisée pour améliorer nos services. Désactivables via les paramètres de votre navigateur.</li>
            <li className={styles.listItem}><strong>Cookies marketing :</strong> uniquement avec votre consentement explicite.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>8. Contact</h2>
          <p className={styles.para}>Pour toute question relative à cette politique de confidentialité ou à vos données personnelles, contactez notre Délégué à la Protection des Données à l'adresse suivante : <a href="mailto:privacy@chezprecious.com" className={styles.link}>privacy@chezprecious.com</a></p>
        </section>

      </div>
    </main>
  );
}
