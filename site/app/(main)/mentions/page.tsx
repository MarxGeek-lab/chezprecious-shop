import styles from "./page.module.scss";

export const metadata = { title: "Mentions légales — ChezPrecious" };

export default function MentionsPage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Informations légales</span>
        <h1 className={styles.heroTitle}>Mentions légales</h1>
        <p className={styles.heroDate}>Dernière mise à jour : 1er janvier 2025</p>
      </div>

      <div className={styles.content}>

        <section className={styles.section}>
          <h2 className={styles.h2}>Éditeur du site</h2>
          <p className={styles.para}>Le site <strong>chezprecious.com</strong> est édité par la société <strong>ChezPrecious</strong>, société par actions simplifiée au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 123 456 789.</p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Siège social :</strong> 12 rue du Faubourg Saint-Antoine, 75012 Paris, France</li>
            <li className={styles.listItem}><strong>Téléphone :</strong> +33 1 00 00 00 00</li>
            <li className={styles.listItem}><strong>Email :</strong> contact@chezprecious.com</li>
            <li className={styles.listItem}><strong>Directeur de la publication :</strong> Awa Gansané</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Hébergement</h2>
          <p className={styles.para}>Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 700, San Francisco, CA 94104, États-Unis. (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className={styles.link}>vercel.com</a>)</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Propriété intellectuelle</h2>
          <p className={styles.para}>L'ensemble des éléments figurant sur ce site (textes, photographies, visuels, logos, illustrations) est la propriété exclusive de ChezPrecious ou de ses partenaires, et est protégé par les lois en vigueur sur la propriété intellectuelle.</p>
          <p className={styles.para}>Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de ChezPrecious.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Responsabilité</h2>
          <p className={styles.para}>ChezPrecious ne saurait être tenu responsable des dommages directs ou indirects résultant de l'accès ou de l'utilisation du site, y compris l'inaccessibilité, la perte de données, les dégâts, la destruction et tout virus pouvant affecter l'équipement informatique de l'utilisateur.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Cookies</h2>
          <p className={styles.para}>Ce site utilise des cookies techniques nécessaires à son bon fonctionnement (panier, session) ainsi que des cookies analytiques anonymisés pour améliorer l'expérience utilisateur. Vous pouvez configurer votre navigateur pour refuser ces cookies. Pour en savoir plus, consultez notre <a href="/confidentialite" className={styles.link}>politique de confidentialité</a>.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Droit applicable</h2>
          <p className={styles.para}>Le présent site et ses mentions légales sont régis par le droit béninois. Tout litige relatif à l'utilisation de ce site sera soumis à la compétence exclusive des tribunaux compétents de Cotonou.</p>
        </section>

      </div>
    </main>
  );
}
