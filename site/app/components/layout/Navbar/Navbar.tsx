"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingBag, User, Menu, X, LogIn, Home, Tag, Heart,
  ChevronDown, Package, MessageSquare, MapPin, Settings, LogOut, Bell,
} from "lucide-react";
import { useCart } from "@/app/store/cartStore";
import { useWishlist } from "@/app/context/WishlistContext";
import { searchApi } from "@/app/lib/api";
import type { AuthUser } from "@/app/lib/api";
import styles from "./Navbar.module.scss";

const ANNOUNCEMENTS = [
  <>Livraison <strong>gratuite</strong> à partir de <strong>4 produits</strong> achetés</>,
  <>Retours gratuits sous <strong>30 jours</strong></>,
  <>Paiement <strong>100 % sécurisé</strong></>,
];

const NAV_LINKS = [
  { label: "Compléments", href: "/shop?cat=complements-alimentaires" },
  { label: "Soins & beauté", href: "/shop?cat=soins-beaute" },
  { label: "Café", href: "/shop?cat=cafe-boissons" },
  { label: "Boutique", href: "/shop" },
  { label: "À propos", href: "/about" },
];

const ACCOUNT_LINKS = [
  { label: "Mon compte",     href: "/account",           icon: User },
  { label: "Mes commandes",  href: "/account/orders",    icon: Package },
  { label: "Mes favoris",    href: "/account/wishlist",  icon: Heart },
  // { label: "Mes adresses",   href: "/account/addresses", icon: MapPin },
  // { label: "Messages",       href: "/account/messages",  icon: MessageSquare },
  { label: "Notifications",  href: "/account/notifications", icon: Bell },
  { label: "Paramètres",     href: "/account/settings",  icon: Settings },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [announcement, setAnnouncement] = useState(0);
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Lire l'auth depuis localStorage
  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_user") {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fermer le dropdown user au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      searchApi.suggestions(query).then((r) => setSuggestions(r.data.suggestions)).catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const id = setInterval(() => setAnnouncement((i) => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openSearch = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  const toggleMenu = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
    setMenuOpen((v) => !v);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push("/");
  }, [router]);

  const initials = user
    ? (user.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || user.email[0].toUpperCase())
    : "";

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeSearch(); closeMenu(); setUserMenuOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch, closeMenu]);

  return (
    <>
      <div className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>

        <div className={styles.announcementBar}>
          <span key={announcement} className={styles.announcementText}>
            {ANNOUNCEMENTS[announcement]}
          </span>
        </div>

        <nav className={styles.navbar}>
          <Link href="/" className={styles.logo} aria-label="ChezPrecious — Accueil">
            Chez<em>Precious</em>
          </Link>

          <div className={styles.navLinks}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={styles.navLink}>{l.label}</Link>
            ))}
          </div>

          <div className={styles.icons}>
            <button className={styles.searchPill} onClick={openSearch}>
              <Search size={16} strokeWidth={1.75} />
              <span>Rechercher un article…</span>
            </button>

            <Link href="/account/wishlist" className={styles.iconBtn} aria-label="Favoris">
              <Heart size={19} strokeWidth={1.5} />
              {wishlistItems.length > 0 && (
                <span className={styles.cartBadge}>{wishlistItems.length > 9 ? "9+" : wishlistItems.length}</span>
              )}
            </Link>

            {user ? (
              /* ── Dropdown desktop ── */
              <div className={styles.userMenuWrap} ref={userMenuRef}>
                <button
                  className={`${styles.iconBtn} ${styles.avatarBtn}`}
                  aria-label="Mon compte"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <span className={styles.avatarCircle}>{initials}</span>
                  <ChevronDown size={12} strokeWidth={2} className={`${styles.chevron} ${userMenuOpen ? styles.chevronUp : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userDropdownHeader}>
                      <span className={styles.userDropdownName}>{user.fullName || "Mon compte"}</span>
                      <span className={styles.userDropdownEmail}>{user.email}</span>
                    </div>
                    <div className={styles.userDropdownLinks}>
                      {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className={styles.userDropdownItem}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Icon size={15} strokeWidth={1.5} />
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className={styles.userDropdownFooter}>
                      <button className={styles.userDropdownLogout} onClick={handleLogout}>
                        <LogOut size={15} strokeWidth={1.5} />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth" className={`${styles.iconBtn} ${styles.loginBtn}`} aria-label="Se connecter">
                <LogIn size={18} strokeWidth={1.5} />
                <span className={styles.loginLabel}>Connexion</span>
              </Link>
            )}

            <Link href="/cart" className={styles.iconBtn} aria-label="Panier">
              <ShoppingBag size={18} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems > 9 ? "9+" : totalItems}</span>
              )}
            </Link>

            <button
              className={styles.burgerBtn}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={toggleMenu}
            >
              {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </nav>

        {/* Overlay recherche */}
        {searchOpen && (
          <div className={styles.searchOverlay} onClick={closeSearch}>
            <div className={styles.searchBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.searchInputRow}>
                <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
                <input
                  ref={inputRef}
                  className={styles.searchInput}
                  placeholder="Rechercher un produit, une catégorie…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className={styles.searchClose} onClick={closeSearch} aria-label="Fermer">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              {suggestions.length > 0 && (
                <ul className={styles.suggestions}>
                  {suggestions.map((s) => (
                    <li key={s}>
                      <Link href={`/shop?search=${encodeURIComponent(s)}`} className={styles.suggestion} onClick={closeSearch}>
                        <span className={styles.suggestionName}>{s}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && suggestions.length === 0 && (
                <p className={styles.noResults}>Aucun résultat pour « {query} »</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar mobile */}
      {menuOpen && <div className={styles.sidebarOverlay} onClick={closeMenu} aria-hidden="true" />}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-hidden={!menuOpen}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo} onClick={closeMenu}>ChezPrecious</Link>
          <button className={styles.sidebarClose} onClick={closeMenu} aria-label="Fermer">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Profil utilisateur dans la sidebar */}
        {user && (
          <div className={styles.sidebarUser}>
            <span className={styles.sidebarAvatar}>{initials}</span>
            <div className={styles.sidebarUserInfo}>
              <span className={styles.sidebarUserName}>{user.fullName || "Mon compte"}</span>
              <span className={styles.sidebarUserEmail}>{user.email}</span>
            </div>
          </div>
        )}

        <nav className={styles.sidebarNav}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.sidebarLink} onClick={closeMenu}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {user ? (
            <>
              <p className={styles.sidebarSectionLabel}>Mon compte</p>
              {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className={styles.sidebarAction} onClick={closeMenu}>
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </Link>
              ))}
              <button className={`${styles.sidebarAction} ${styles.sidebarLogout}`} onClick={handleLogout}>
                <LogOut size={16} strokeWidth={1.5} />
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/auth" className={styles.sidebarAction} onClick={closeMenu}>
              <LogIn size={16} strokeWidth={1.5} /> Connexion / Inscription
            </Link>
          )}
          <Link href="/cart" className={styles.sidebarAction} onClick={closeMenu}>
            <ShoppingBag size={16} strokeWidth={1.5} />
            Panier
            {totalItems > 0 && <span className={styles.sidebarBadge}>{totalItems}</span>}
          </Link>
        </div>
      </aside>

      <BottomNav totalItems={totalItems} isLoggedIn={!!user} onSearch={openSearch} />
    </>
  );
}

function BottomNav({ totalItems, isLoggedIn, onSearch }: { totalItems: number; isLoggedIn: boolean; onSearch: () => void }) {
  return (
    <nav className={styles.bottomNav} aria-label="Navigation principale">
      <Link href="/" className={styles.bnItem} aria-label="Accueil">
        <Home size={22} strokeWidth={1.5} /><span>Accueil</span>
      </Link>
      <Link href="/shop" className={styles.bnItem} aria-label="Boutique">
        <Tag size={22} strokeWidth={1.5} /><span>Boutique</span>
      </Link>
      <button className={styles.bnSearch} onClick={onSearch} aria-label="Rechercher">
        <Search size={22} strokeWidth={1.5} />
      </button>
      <Link href={isLoggedIn ? "/account" : "/auth"} className={styles.bnItem} aria-label="Compte">
        <User size={22} strokeWidth={1.5} /><span>{isLoggedIn ? "Compte" : "Connexion"}</span>
      </Link>
      <Link href="/cart" className={`${styles.bnItem} ${styles.bnCart}`} aria-label="Panier">
        <ShoppingBag size={22} strokeWidth={1.5} />
        {totalItems > 0 && <span className={styles.bnBadge}>{totalItems > 9 ? "9+" : totalItems}</span>}
        <span>Panier</span>
      </Link>
    </nav>
  );
}
