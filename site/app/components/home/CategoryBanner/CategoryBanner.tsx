import Link from "next/link";
import Image from "next/image";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import styles from "./CategoryBanner.module.scss";

const CATEGORIES = [
  {
    tag: "Collection Femme",
    title: "Femme",
    href: "/shop?cat=femme",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=85",
    alt: "Collection Femme ChezPrecious",
  },
  {
    tag: "Collection Homme",
    title: "Homme",
    href: "/shop?cat=homme",
    image:
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=900&q=85",
    alt: "Collection Homme ChezPrecious",
  },
];

export default function CategoryBanner() {
  return (
    <section className={styles.section}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {CATEGORIES.map((cat) => (
            <Grid key={cat.href} size={{ xs: 12, md: 6 }}>
              <Link href={cat.href} className={styles.card}>
                <Image
                  className={styles.image}
                  src={cat.image}
                  alt={cat.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className={styles.overlay}>
                  <span className={styles.tag}>{cat.tag}</span>
                  <h2 className={styles.title}>{cat.title}</h2>
                  <span className={styles.cta}>Explorer →</span>
                </div>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </section>
  );
}
