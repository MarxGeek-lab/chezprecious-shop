"use client";

import { categoryLabel, formatPrice } from "@/app/utils/format";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, LayoutGrid, LayoutList, Star } from "lucide-react";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import ProductCard from "@/app/components/home/ProductCard/ProductCard";
import { usePublicProducts } from "@/app/hooks/useProducts";
import { useCategories } from "@/app/hooks/useCategories";
import type { ApiProduct } from "@/app/lib/api";
import styles from "./page.module.scss";

const PER_PAGE = 9;
const PRICE_MIN = 0;
const PRICE_MAX = 100000;

const SORT_OPTIONS = [
  { value: "newest",     label: "Nouveautés" },
  { value: "price_asc",  label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.accordion}>
      <button className={styles.accordionBtn} onClick={() => setOpen(v => !v)}>
        <span>{title}</span>
        {open ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
      </button>
      {open && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

function ShopContent() {
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory]   = useState<string>(() => searchParams.get("cat") ?? "");
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [sort, setSort]             = useState(() => searchParams.get("filter") === "new" ? "newest" : "newest");
  const [grid, setGrid]             = useState<"grid" | "list">("grid");
  const [page, setPage]             = useState(1);

  const resetPage = () => setPage(1);

  // Sync filters when URL params change (e.g. clicking navbar/footer links)
  // Store raw URL value; resolved to exact DB name once categoryList loads
  const urlCat = searchParams.get("cat") ?? "";
  const urlFilter = searchParams.get("filter") ?? "";

  useEffect(() => {
    if (urlFilter === "new") setSort("newest");
    setPage(1);
  }, [urlFilter]);

  // Resolve ?cat to exact DB category slug (case-insensitive) once categories load
  const { data: categoriesData } = useCategories();
  const categoryList = (categoriesData ?? []).map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug }));

  useEffect(() => {
    if (!urlCat) { setCategory(""); setPage(1); return; }
    if (categoryList.length === 0) return; // wait for categories
    const match = categoryList.find((c) => c.slug.toLowerCase() === urlCat.toLowerCase() || c.name.toLowerCase() === urlCat.toLowerCase());
    setCategory(match ? match.slug : urlCat);
    setPage(1);
  }, [urlCat, categoryList.map(c => c.slug).join(",")]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const queryParams = useMemo(() => ({
    page,
    limit: PER_PAGE,
    sort: sort as "newest" | "price_asc" | "price_desc",
    ...(category ? { category } : {}),
    ...(priceRange[0] > PRICE_MIN ? { minPrice: priceRange[0] } : {}),
    ...(priceRange[1] < PRICE_MAX ? { maxPrice: priceRange[1] } : {}),
  }), [page, sort, category, priceRange]);

  const { data, isLoading } = usePublicProducts(queryParams);

  const products: ApiProduct[] = data?.products ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;

  const priceActive = priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX;
  const activeCount = [
    category ? 1 : 0,
    priceActive ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => {
    setCategory(""); setPriceRange([PRICE_MIN, PRICE_MAX]); resetPage();
  };

  // ── Panneau filtres ──
  const FiltersPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className={styles.filters}>
      <div className={styles.filtersHeader}>
        <span className={styles.filtersTitle}>Filtres</span>
        <div className={styles.filtersHeaderActions}>
          {activeCount > 0 && (
            <button className={styles.clearAll} onClick={clearAll}>Tout effacer</button>
          )}
          {onClose && (
            <button className={styles.filtersClose} onClick={onClose} aria-label="Fermer">
              <X size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Catégorie */}
      <Accordion title="Catégorie">
        <div className={styles.filterOptions}>
          <button
            className={`${styles.filterPill} ${category === "" ? styles.filterPillActive : ""}`}
            onClick={() => { setCategory(""); resetPage(); }}
          >
            Toutes
          </button>
          {categoryList.map(cat => (
            <button
              key={cat.slug}
              className={`${styles.filterPill} ${category === cat.slug ? styles.filterPillActive : ""}`}
              onClick={() => { setCategory(cat.slug); resetPage(); }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </Accordion>

      {/* Prix — Slider MUI */}
      <Accordion title="Prix">
        <div className={styles.priceSliderWrap}>
          <div className={styles.priceLabels}>
            <span>{formatPrice(priceRange[0])}</span>
            <span>{priceRange[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(priceRange[1])}</span>
          </div>
          <Slider
            value={priceRange}
            onChange={(_, val) => { setPriceRange(val as [number, number]); resetPage(); }}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={1000}
            disableSwap
            sx={{
              color: "#FF2C2C",
              height: 2,
              padding: "10px 0",
              "& .MuiSlider-thumb": {
                width: 14,
                height: 14,
                backgroundColor: "#FF2C2C",
                border: "2px solid #fff",
                boxShadow: "0 0 0 2px #FF2C2C",
                "&:hover, &.Mui-active": {
                  boxShadow: "0 0 0 3px rgba(255, 44, 44,0.25)",
                },
              },
              "& .MuiSlider-rail": {
                backgroundColor: "rgba(10,10,10,0.12)",
                opacity: 1,
              },
              "& .MuiSlider-track": {
                backgroundColor: "#FF2C2C",
                border: "none",
              },
            }}
          />
          {priceActive && (
            <button
              className={styles.clearPrice}
              onClick={() => { setPriceRange([PRICE_MIN, PRICE_MAX]); resetPage(); }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </Accordion>
    </div>
  );

  return (
    <main className={styles.main}>
      {/* En-tête hero */}
      <div className={styles.pageHeader}>
        <Image
          src="/uploads/products/catalogue/coffrets-sag7-floral.webp"
          alt="ChezPrecious Boutique"
          fill
          className={styles.pageHeaderBg}
          priority
        />
        <div className={styles.pageHeaderOverlay} />
        <div className={styles.pageHeaderInner}>
          <h1 className={styles.pageTitle}>Boutique</h1>
          <p className={styles.pageSubtitle}>Produits naturels pour votre santé et votre beauté</p>
          <span className={styles.pageCount}>{total} produit{total > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar desktop */}
        <Box
          component="aside"
          className={styles.sidebar}
          sx={{
            position: "sticky",
            top: "126px",
            maxHeight: "auto",
            overflowY: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <FiltersPanel />
        </Box>

        {/* Contenu */}
        <div className={styles.content}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <button className={styles.filterToggle} onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal size={16} strokeWidth={1.5} />
              Filtres
              {activeCount > 0 && <span className={styles.filterBadge}>{activeCount}</span>}
            </button>

            <div className={styles.activeChips}>
              {category && (
                <span className={styles.chip}>
                  {categoryList.find(c => c.slug === category)?.name ?? category}
                  <button onClick={() => { setCategory(""); resetPage(); }}><X size={11} /></button>
                </span>
              )}
              {priceActive && (
                <span className={styles.chip}>
                  {formatPrice(priceRange[0])} – {priceRange[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(priceRange[1])}
                  <button onClick={() => { setPriceRange([PRICE_MIN, PRICE_MAX]); resetPage(); }}><X size={11} /></button>
                </span>
              )}
            </div>

            <div className={styles.toolbarRight}>
              <div className={styles.sortWrap}>
                <select
                  className={styles.sortSelect}
                  value={sort}
                  onChange={e => { setSort(e.target.value); resetPage(); }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.sortArrow} />
              </div>

              <div className={styles.viewBtns}>
                <button
                  className={`${styles.viewBtn} ${grid === "grid" ? styles.viewBtnActive : ""}`}
                  onClick={() => setGrid("grid")} aria-label="Vue grille"
                >
                  <LayoutGrid size={16} strokeWidth={1.5} />
                </button>
                <button
                  className={`${styles.viewBtn} ${grid === "list" ? styles.viewBtnActive : ""}`}
                  onClick={() => setGrid("list")} aria-label="Vue liste"
                >
                  <LayoutList size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Grille / Liste */}
          {isLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "3/4", background: "#f0f0f0", borderRadius: 4 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Aucun produit ne correspond à votre sélection.</p>
              <button className={styles.emptyBtn} onClick={clearAll}>Réinitialiser les filtres</button>
            </div>
          ) : grid === "grid" ? (
            <div className={styles.grid}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className={styles.listView}>
              {products.map(p => <ListRow key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                  onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  {n}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >→</button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
      )}
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}>
        <FiltersPanel onClose={() => setDrawerOpen(false)} />
        <div className={styles.drawerApply}>
          <button className={styles.applyBtn} onClick={() => setDrawerOpen(false)}>
            Voir {total} produit{total > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Vue liste ────────────────────────────────────────────────────────────────

function ListRow({ product }: { product: ApiProduct }) {
  const { name, price, comparePrice, images, category, rating, reviewCount, slug } = product;
  const isSale = comparePrice !== null && comparePrice !== undefined && comparePrice > price;
  const mainImage = images?.[0]?.url;

  return (
    <a href={`/product/${slug}`} className={styles.listRow}>
      <div className={styles.listImg}>
        {mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mainImage} alt={name} className={styles.listImgEl} />
        )}
        {isSale && <span className={`${styles.listBadge} ${styles.badgeSale}`}>Soldes</span>}
      </div>
      <div className={styles.listBody}>
        <span className={styles.listCategory}>{categoryLabel(category)}</span>
        <h3 className={styles.listName}>{name}</h3>
        {rating ? (
          <div className={styles.listRating}>
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={12} strokeWidth={1.5}
                fill={n <= Math.round(rating) ? "currentColor" : "none"} />
            ))}
            <span className={styles.listRatingNum}>{rating.toFixed(1)}</span>
            <span className={styles.listRatingCount}>({reviewCount})</span>
          </div>
        ) : null}
      </div>
      <div className={styles.listPrice}>
        <span className={styles.listPriceMain}>{formatPrice(price)}</span>
        {isSale && <span className={styles.listPriceOld}>{formatPrice(comparePrice)}</span>}
      </div>
    </a>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
