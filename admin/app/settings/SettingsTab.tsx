'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Switch, Grid,
  MenuItem, InputBase, IconButton, Chip, CircularProgress,
  Snackbar, Alert,
} from '@mui/material';
import {
  Save, Globe, CreditCard, Truck, Bell, Shield, Palette,
  Image, Upload, Facebook, Instagram, Twitter, Youtube, Linkedin,
  MapPin, Phone, Mail, Clock, FileText, Search as SearchIcon,
  Link2, MessageSquare, ChevronRight, Eye, Trash2,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft,
  AlignCenter, AlignRight, Heading1, Heading2, Code, Quote,
  Undo, Redo, Type, Hash, Smartphone, Percent, Loader, Home, Plus,
} from 'lucide-react';
import {
  useSettings, SiteSettings,
  useUpdateGeneral, useUpdateContact, useUpdateSocial,
  useUpdateAppearance, useUpdateCommerce, useUpdateShipping,
  useUpdateSeo, useUpdateLegal, useUpdateNotifications,
  useUpdateAdvanced, useUpdateMedia, useDeleteMedia,
  useUpdateHomepageContent,
  type HomepageBannerConfig, type FlashSaleConfig, type AdSectionConfig,
} from '@/src/hooks/useSettings';
import api from '@/src/lib/api';
import styles from './settings.module.scss';

// ==============================================
// TYPES
// ==============================================
type SettingsSection =
  | 'general' | 'contact' | 'social' | 'appearance'
  | 'commerce' | 'shipping' | 'notifications' | 'seo'
  | 'legal' | 'advanced' | 'homepage-content';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

// ==============================================
// NAVIGATION
// ==============================================
const navItems: NavItem[] = [
  // { id: 'general', label: 'Général', icon: Globe },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'social', label: 'Réseaux sociaux', icon: Hash },
  // { id: 'appearance', label: 'Apparence', icon: Palette },
  // { id: 'commerce', label: 'Commerce', icon: CreditCard },
  // { id: 'shipping', label: 'Livraison', icon: Truck },
  // { id: 'notifications', label: 'Notifications', icon: Bell },
  // { id: 'seo', label: 'SEO', icon: SearchIcon },
  // { id: 'legal', label: 'Pages légales', icon: FileText },
  // { id: 'advanced', label: 'Avancé', icon: Shield },
  // { id: 'homepage-content', label: 'Contenu Homepage', icon: Home },
];

// ==============================================
// MEDIA UPLOAD FIELD (logo / favicon / banner)
// ==============================================
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api-backend/api').replace(/\/api$/, '');

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  console.log('[resolveMediaUrl] URL relative détectée, tentative de résolution :', url);
  return `${API_BASE}${url}`;
}

function MediaUploadField({
  type, currentUrl, btnOutline,
}: {
  type: 'logo' | 'favicon' | 'banner';
  currentUrl: string | null | undefined;
  btnOutline: Record<string, unknown>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMedia = useUpdateMedia(type);
  const deleteMedia = useDeleteMedia(type);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(currentUrl ?? null);

  useEffect(() => {
    setLocalUrl(currentUrl ?? null);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      // Étape 1 — upload du fichier
      const form = new FormData();
      form.append('image', file);
      // Ne pas forcer Content-Type — le navigateur génère le boundary multipart automatiquement
      const { data: uploadData } = await api.post<{ url: string }>('/upload/image', form, {
        headers: { 'Content-Type': undefined },
      });
      console.log('[MediaUpload] fichier uploadé :', uploadData.url);

      // Étape 2 — enregistrer l'URL dans les settings (clé = type)
      await updateMedia.mutateAsync(uploadData.url);
      setLocalUrl(uploadData.url);
      console.log('[MediaUpload] settings mis à jour pour', type);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      const msg = Array.isArray(raw)
        ? (raw as { message?: string }[]).map((e) => e.message).filter(Boolean).join(', ')
        : typeof raw === 'string'
          ? raw
          : (err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('[MediaUpload] échec :', (err as { response?: { data?: unknown } })?.response?.data ?? err);
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setUploadError(null);
    try {
      await deleteMedia.mutateAsync();
      setLocalUrl(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('[MediaUpload] suppression échouée :', msg);
      setUploadError(msg);
    }
  };

  const isLoading = uploading || updateMedia.isPending || deleteMedia.isPending;
  const label = type === 'logo' ? 'Changer le logo' : type === 'favicon' ? 'Changer le favicon' : 'Télécharger une bannière';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="contained"
          startIcon={isLoading ? <Loader size={16} className="spin" /> : <Upload size={16} />}
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
          sx={{ bgcolor: '#FF2C2C', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#D41E1E' } }}
        >
          {isLoading ? 'Envoi...' : label}
        </Button>
        {localUrl && !isLoading && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Trash2 size={16} />}
            onClick={handleDelete}
            sx={btnOutline}
          >
            Supprimer
          </Button>
        )}
      </Box>
      {uploadError && (
        <Typography sx={{ fontSize: 12, color: '#EF4444', mt: 0.5 }}>{uploadError}</Typography>
      )}
    </>
  );
}

// ==============================================
// RICH TEXT EDITOR
// ==============================================
function RichTextEditor({
  value, onChange, placeholder, minHeight = 300,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: number;
}) {
  return (
    <Box className={styles.richEditor}>
      <Box className={styles.richToolbar}>
        {[
          { icon: Undo, title: 'Annuler' },
          { icon: Redo, title: 'Refaire' },
          { type: 'divider' as const },
          { icon: Heading1, title: 'Titre 1' },
          { icon: Heading2, title: 'Titre 2' },
          { icon: Type, title: 'Paragraphe' },
          { type: 'divider' as const },
          { icon: Bold, title: 'Gras' },
          { icon: Italic, title: 'Italique' },
          { icon: Underline, title: 'Souligné' },
          { type: 'divider' as const },
          { icon: List, title: 'Liste à puces' },
          { icon: ListOrdered, title: 'Liste numérotée' },
          { icon: Quote, title: 'Citation' },
          { icon: Code, title: 'Code' },
          { type: 'divider' as const },
          { icon: AlignLeft, title: 'Gauche' },
          { icon: AlignCenter, title: 'Centrer' },
          { icon: AlignRight, title: 'Droite' },
          { type: 'divider' as const },
          { icon: Link2, title: 'Lien' },
          { icon: Image, title: 'Image' },
        ].map((item, i) =>
          'type' in item ? (
            <Box key={`d-${i}`} className={styles.richToolbarDivider} />
          ) : (
            <IconButton
              key={item.title} size="small" title={item.title}
              className={styles.richToolbarBtn}
              sx={{ width: 32, height: 32, borderRadius: '8px' }}
            >
              {item.icon && <item.icon size={16} />}
            </IconButton>
          )
        )}
      </Box>
      <textarea
        className={styles.richTextarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight }}
      />
    </Box>
  );
}

// ==============================================
// SAVE BUTTON
// ==============================================
function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <Button
      variant="contained"
      startIcon={saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
      disabled={saving}
      onClick={onClick}
      sx={{ bgcolor: '#FF2C2C', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#D41E1E' } }}
    >
      {saving ? 'Enregistrement...' : 'Enregistrer'}
    </Button>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function SettingsTab() {
  const { data: settings, isLoading, error: loadError } = useSettings();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // General
  const [siteName, setSiteName] = useState('');
  const [siteSlogan, setSiteSlogan] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteLanguage, setSiteLanguage] = useState('fr');
  const [siteTimezone, setSiteTimezone] = useState('Africa/Porto-Novo');

  // Contact
  const [contactEmail, setContactEmail] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [noReplyEmail, setNoReplyEmail] = useState('');
  const [phoneMain, setPhoneMain] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [phoneSupport, setPhoneSupport] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  // Social
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#FF2C2C');
  const [secondaryColor, setSecondaryColor] = useState('#1A1A2E');
  const [accentColor, setAccentColor] = useState('#10B981');

  // Commerce
  const [currency, setCurrency] = useState('XOF');
  const [commission, setCommission] = useState('10');
  const [minOrder, setMinOrder] = useState('5000');
  const [freeShipping, setFreeShipping] = useState('50000');
  const [taxRate, setTaxRate] = useState('18');

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [googleAnalytics, setGoogleAnalytics] = useState('');
  const [facebookPixel, setFacebookPixel] = useState('');

  // Legal
  const [cguContent, setCguContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [mentionsContent, setMentionsContent] = useState('');
  const [returnPolicyContent, setReturnPolicyContent] = useState('');

  // Notifications
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Advanced
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [productModeration, setProductModeration] = useState(false);
  const [sellerRegistration, setSellerRegistration] = useState(true);
  const [reviewModeration, setReviewModeration] = useState(true);

  // Legal tab
  const [legalTab, setLegalTab] = useState(0);

  // Homepage Content
  const [homepageBanners, setHomepageBanners] = useState<HomepageBannerConfig[]>([]);
  const [flashSaleConfig, setFlashSaleConfig] = useState<FlashSaleConfig>({
    isActive: false,
    endDate: '',
    promoCode: 'BIENVENUE50',
    promoCodeLabel: "Économisez jusqu'à 50% sur votre premier achat",
    maxDiscountPercent: 50,
    bannerBadge: 'Exclusif',
  });
  const [adSectionConfig, setAdSectionConfig] = useState<AdSectionConfig>({
    largeBanner: {
      isActive: true,
      imageUrl: '',
      badgeText: "Jusqu'à -70%",
      title: 'Ventes',
      titleHighlight: 'Flash',
      description: 'Ne manquez pas nos offres exceptionnelles sur plus de 500 produits',
      ctaLabel: 'Profiter maintenant',
      ctaLink: '/promotions',
      showTimer: true,
    },
    giftCardBanner: {
      isActive: true,
      title: 'Cartes Cadeaux',
      description: 'Le cadeau parfait pour vos proches',
      ctaLink: '/gift-cards',
    },
    newArrivalsBanner: {
      isActive: true,
      imageUrl: '',
      title: 'Nouveautés',
      description: 'Découvrez les derniers arrivages',
      ctaLink: '/products?sort=newest',
    },
  });

  // Mutations
  const updateGeneral = useUpdateGeneral();
  const updateContact = useUpdateContact();
  const updateSocial = useUpdateSocial();
  const updateAppearance = useUpdateAppearance();
  const updateCommerce = useUpdateCommerce();
  const updateShipping = useUpdateShipping();
  const updateSeo = useUpdateSeo();
  const updateLegal = useUpdateLegal();
  const updateNotifications = useUpdateNotifications();
  const updateAdvanced = useUpdateAdvanced();
  const updateHomepageContent = useUpdateHomepageContent();

  // Charger les données API dans le state local
  const populateFromSettings = useCallback((s: SiteSettings) => {
    setSiteName(s.siteName || '');
    setSiteSlogan(s.siteSlogan || '');
    setSiteDescription(s.siteDescription || '');
    setSiteUrl(s.siteUrl || '');
    setSiteLanguage(s.language || 'fr');
    setSiteTimezone(s.timezone || 'Africa/Porto-Novo');
    setContactEmail(s.contactEmail || '');
    setSupportEmail(s.supportEmail || '');
    setNoReplyEmail(s.noReplyEmail || '');
    setPhoneMain(s.phoneMain || '');
    setPhoneWhatsapp(s.phoneWhatsapp || '');
    setPhoneSupport(s.phoneSupport || '');
    setAddress(s.address || '');
    setCity(s.city || '');
    setCountry(s.country || '');
    setPostalCode(s.postalCode || '');
    setBusinessHours(s.businessHours || '');
    setFacebook(s.facebook || '');
    setInstagram(s.instagram || '');
    setTwitter(s.twitter || '');
    setYoutube(s.youtube || '');
    setLinkedin(s.linkedin || '');
    setTiktok(s.tiktok || '');
    setPrimaryColor(s.primaryColor || '#FF2C2C');
    setSecondaryColor(s.secondaryColor || '#1A1A2E');
    setAccentColor(s.accentColor || '#10B981');
    setCurrency(s.currency || 'XOF');
    setCommission(String(s.commission ?? '10'));
    setMinOrder(String(s.minOrder ?? '5000'));
    setFreeShipping(String(s.freeShippingMin ?? '50000'));
    setTaxRate(String(s.taxRate ?? '18'));
    setMetaTitle(s.metaTitle || '');
    setMetaDescription(s.metaDescription || '');
    setMetaKeywords(s.metaKeywords || '');
    setGoogleAnalytics(s.googleAnalytics || '');
    setFacebookPixel(s.facebookPixel || '');
    setCguContent(s.cguContent || '');
    setPrivacyContent(s.privacyContent || '');
    setMentionsContent(s.mentionsContent || '');
    setReturnPolicyContent(s.returnPolicy || '');
    setOrderNotifications(s.notifOrders ?? true);
    setStockAlerts(s.notifStock ?? true);
    setEmailNotifications(s.notifEmail ?? true);
    setPushNotifications(s.notifPush ?? false);
    setMaintenanceMode(s.maintenanceMode ?? false);
    setProductModeration(s.productModeration ?? false);
    setSellerRegistration(s.sellerRegistration ?? true);
    setReviewModeration(s.reviewModeration ?? true);
    // Homepage content
    if (s.homepageBanners) setHomepageBanners(s.homepageBanners as HomepageBannerConfig[]);
    if (s.flashSaleConfig)  setFlashSaleConfig(s.flashSaleConfig as FlashSaleConfig);
    if (s.adSectionConfig)  setAdSectionConfig(s.adSectionConfig as AdSectionConfig);
  }, []);

  useEffect(() => {
    if (settings) populateFromSettings(settings);
  }, [settings, populateFromSettings]);

  // Helpers
  const showSuccess = (msg = 'Paramètres enregistrés avec succès') =>
    setSnackbar({ open: true, message: msg, severity: 'success' });

  const showError = (msg = 'Erreur lors de la sauvegarde') =>
    setSnackbar({ open: true, message: msg, severity: 'error' });

  const handleSave = async (
    mutation: { mutateAsync: (data: Record<string, unknown>) => Promise<unknown>; isPending: boolean },
    data: Record<string, unknown>,
  ) => {
    try {
      await mutation.mutateAsync(data);
      showSuccess();
    } catch {
      showError();
    }
  };

  // Shared styles
  const btnOutline = { textTransform: 'none' as const, borderRadius: '10px', borderColor: '#E5E7EB', color: '#6B7280' };
  const switchSx = { '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF2C2C' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#FF2C2C' } };

  const legalPages = [
    { label: 'Conditions Générales (CGU)', value: cguContent, onChange: setCguContent, placeholder: 'Rédigez les conditions générales d\'utilisation...' },
    { label: 'Politique de confidentialité', value: privacyContent, onChange: setPrivacyContent, placeholder: 'Rédigez la politique de confidentialité...' },
    { label: 'Mentions légales', value: mentionsContent, onChange: setMentionsContent, placeholder: 'Rédigez les mentions légales...' },
    { label: 'Politique de retour', value: returnPolicyContent, onChange: setReturnPolicyContent, placeholder: 'Rédigez la politique de retour et remboursement...' },
  ];

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress sx={{ color: '#FF2C2C' }} size={36} />
        <Typography sx={{ color: '#6B7280', fontSize: 14 }}>Chargement des paramètres...</Typography>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          Impossible de charger les paramètres. Vérifiez votre connexion et réessayez.
        </Alert>
      </Box>
    );
  }

  // ==============================================
  // SECTIONS
  // ==============================================

  const renderGeneral = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Globe size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Informations générales</Typography>
          <Typography className={styles.sectionSubtitle}>Identité et informations de base du site</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5 }}>Logo du site</Typography>
      <Box className={styles.logoUpload}>
        <Box className={styles.logoPreview}>
          {settings?.logo ? <img src={resolveMediaUrl(settings.logo) ?? ''} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'M'}
        </Box>
        <Box className={styles.logoInfo}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.5 }}>Logo principal</Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1.5 }}>
            Format recommandé : PNG ou SVG, 512x512px minimum, fond transparent
          </Typography>
          <MediaUploadField type="logo" currentUrl={settings?.logo} btnOutline={btnOutline} />
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5 }}>Favicon</Typography>
      <Box className={styles.logoUpload} sx={{ mb: 3 }}>
        <Box className={styles.faviconPreview}>
          {settings?.favicon ? <img src={resolveMediaUrl(settings.favicon) ?? ''} alt="Favicon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'M'}
        </Box>
        <Box className={styles.logoInfo}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.5 }}>Icône du navigateur</Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1.5 }}>
            Format : ICO, PNG ou SVG, 32x32px ou 64x64px
          </Typography>
          <MediaUploadField type="favicon" currentUrl={settings?.favicon} btnOutline={btnOutline} />
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Nom du site" value={siteName} onChange={(e) => setSiteName(e.target.value)} size="small" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Slogan" value={siteSlogan} onChange={(e) => setSiteSlogan(e.target.value)} size="small" />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth label="Description du site" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} size="small" multiline rows={3} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="URL du site" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} size="small" />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField fullWidth label="Langue" value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)} size="small" select>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="pt">Português</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField fullWidth label="Fuseau horaire" value={siteTimezone} onChange={(e) => setSiteTimezone(e.target.value)} size="small" select>
            <MenuItem value="Africa/Porto-Novo">Porto-Novo (GMT+1)</MenuItem>
            <MenuItem value="Africa/Lagos">Lagos (GMT+1)</MenuItem>
            <MenuItem value="Africa/Abidjan">Abidjan (GMT+0)</MenuItem>
            <MenuItem value="Europe/Paris">Paris (GMT+1)</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateGeneral.isPending} onClick={() => handleSave(updateGeneral, {
          siteName, siteSlogan: siteSlogan || null, siteDescription: siteDescription || null,
          siteUrl: siteUrl || null, language: siteLanguage, timezone: siteTimezone,
        })} />
      </Box>
    </Box>
  );

  const renderContact = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Phone size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Informations de contact</Typography>
          <Typography className={styles.sectionSubtitle}>Coordonnées affichées sur le site</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Adresses email</Typography>
      <Box className={styles.contactGrid} sx={{ mb: 3 }}>
        <TextField fullWidth label="Email principal" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <Mail size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
        <TextField fullWidth label="Email support" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <Mail size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
        <TextField fullWidth label="Email no-reply" value={noReplyEmail} onChange={(e) => setNoReplyEmail(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <Mail size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Numéros de téléphone</Typography>
      <Box className={styles.contactGrid} sx={{ mb: 3 }}>
        <TextField fullWidth label="Téléphone principal" value={phoneMain} onChange={(e) => setPhoneMain(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <Phone size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
        <TextField fullWidth label="WhatsApp" value={phoneWhatsapp} onChange={(e) => setPhoneWhatsapp(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <MessageSquare size={16} style={{ color: '#25D366', marginRight: 8 }} /> } }} />
        <TextField fullWidth label="Support téléphonique" value={phoneSupport} onChange={(e) => setPhoneSupport(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <Phone size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Adresse physique</Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField fullWidth label="Adresse complète" value={address} onChange={(e) => setAddress(e.target.value)} size="small"
            slotProps={{ input: { startAdornment: <MapPin size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Ville" value={city} onChange={(e) => setCity(e.target.value)} size="small" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Pays" value={country} onChange={(e) => setCountry(e.target.value)} size="small" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Code postal / BP" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} size="small" />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth label="Horaires d'ouverture" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} size="small"
            slotProps={{ input: { startAdornment: <Clock size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
        </Grid>
      </Grid>

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateContact.isPending} onClick={() => handleSave(updateContact, {
          contactEmail: contactEmail || null, supportEmail: supportEmail || null,
          noReplyEmail: noReplyEmail || null, phoneMain: phoneMain || null,
          phoneWhatsapp: phoneWhatsapp || null, phoneSupport: phoneSupport || null,
          address: address || null, city: city || null, country: country || null,
          postalCode: postalCode || null, businessHours: businessHours || null,
        })} />
      </Box>
    </Box>
  );

  const renderSocial = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Hash size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Réseaux sociaux</Typography>
          <Typography className={styles.sectionSubtitle}>Liens vers vos pages et profils sociaux</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { icon: Facebook, label: 'Facebook', value: facebook, onChange: setFacebook, color: '#1877F2', placeholder: 'https://facebook.com/votre-page' },
          { icon: Instagram, label: 'Instagram', value: instagram, onChange: setInstagram, color: '#E4405F', placeholder: 'https://instagram.com/votre-compte' },
          { icon: Twitter, label: 'X (Twitter)', value: twitter, onChange: setTwitter, color: '#1DA1F2', placeholder: 'https://x.com/votre-compte' },
          { icon: Youtube, label: 'YouTube', value: youtube, onChange: setYoutube, color: '#FF0000', placeholder: 'https://youtube.com/@votre-chaine' },
          { icon: Linkedin, label: 'LinkedIn', value: linkedin, onChange: setLinkedin, color: '#0A66C2', placeholder: 'https://linkedin.com/company/votre-page' },
          { icon: Smartphone, label: 'TikTok', value: tiktok, onChange: setTiktok, color: '#000000', placeholder: 'https://tiktok.com/@votre-compte' },
        ].map((social) => {
          const Icon = social.icon;
          return (
            <Box key={social.label} className={styles.socialField}>
              <Box className={styles.socialIcon} sx={{ bgcolor: `${social.color}15` }}>
                <Icon size={20} color={social.color} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6B7280', mb: 0.3 }}>{social.label}</Typography>
                <InputBase
                  fullWidth value={social.value}
                  onChange={(e) => social.onChange(e.target.value)}
                  placeholder={social.placeholder}
                  sx={{ fontSize: 14 }}
                />
              </Box>
              {social.value && (
                <IconButton size="small" sx={{ color: '#9CA3AF' }}
                  onClick={() => window.open(social.value, '_blank')}>
                  <Eye size={16} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateSocial.isPending} onClick={() => handleSave(updateSocial, {
          facebook: facebook || null, instagram: instagram || null,
          twitter: twitter || null, youtube: youtube || null,
          linkedin: linkedin || null, tiktok: tiktok || null,
        })} />
      </Box>
    </Box>
  );

  const renderAppearance = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Palette size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Apparence</Typography>
          <Typography className={styles.sectionSubtitle}>Personnalisation visuelle du site</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Couleurs du thème</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Couleur primaire', value: primaryColor, onChange: setPrimaryColor, desc: 'Boutons, liens, accents' },
          { label: 'Couleur secondaire', value: secondaryColor, onChange: setSecondaryColor, desc: 'Textes, fonds sombres' },
          { label: 'Couleur d\'accent', value: accentColor, onChange: setAccentColor, desc: 'Succès, validations' },
        ].map((color) => (
          <Grid key={color.label} size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '12px' }}>
              <Box className={styles.colorField}>
                <input
                  type="color" value={color.value}
                  onChange={(e) => color.onChange(e.target.value)}
                  style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
                />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{color.label}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>{color.desc}</Typography>
                  <Chip label={color.value} size="small" sx={{ mt: 0.5, fontSize: 11, fontFamily: 'monospace', height: 22 }} />
                </Box>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Bannière d'accueil</Typography>
      <Box className={styles.logoUpload} sx={{ mb: 0 }}>
        <Box sx={{ width: 160, height: 80, borderRadius: '12px', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 160, overflow: 'hidden' }}>
          {settings?.banner ? <img src={resolveMediaUrl(settings.banner) ?? ''} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Image size={32} color="#9CA3AF" />}
        </Box>
        <Box className={styles.logoInfo}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.5 }}>Image de bannière</Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1.5 }}>Format : JPG ou PNG, 1920x600px recommandé</Typography>
          <MediaUploadField type="banner" currentUrl={settings?.banner} btnOutline={btnOutline} />
        </Box>
      </Box>

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateAppearance.isPending} onClick={() => handleSave(updateAppearance, {
          primaryColor, secondaryColor, accentColor,
        })} />
      </Box>
    </Box>
  );

  const renderCommerce = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><CreditCard size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Commerce</Typography>
          <Typography className={styles.sectionSubtitle}>Configuration des ventes et paiements</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)} size="small" select>
            <MenuItem value="EUR">EUR - Euro</MenuItem>
            <MenuItem value="USD">USD - Dollar US</MenuItem>
            <MenuItem value="GBP">GBP - Livre Sterling</MenuItem>
            <MenuItem value="XOF">XOF - Franc CFA (BCEAO)</MenuItem>
            <MenuItem value="XAF">XAF - Franc CFA (BEAC)</MenuItem>
          </TextField>
        </Grid>
        {/* <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Commission (%)" value={commission} onChange={(e) => setCommission(e.target.value)} size="small" type="number"
            slotProps={{ input: { startAdornment: <Percent size={16} style={{ color: '#9CA3AF', marginRight: 8 }} /> } }} />
        </Grid> */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Montant min. commande (F CFA)" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} size="small" type="number" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Livraison gratuite à partir de (F CFA)" value={freeShipping} onChange={(e) => setFreeShipping(e.target.value)} size="small" type="number" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Taux de TVA (%)" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} size="small" type="number" />
        </Grid>
      </Grid>

      {/* <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 3, mb: 2 }}>Méthodes de paiement</Typography>
      {[
        { label: 'Carte bancaire (Stripe)', desc: 'Visa, Mastercard, etc.', enabled: true },
        { label: 'Mobile Money', desc: 'MTN, Moov, Orange Money', enabled: true },
        { label: 'PayPal', desc: 'Paiement via compte PayPal', enabled: false },
        { label: 'Virement bancaire', desc: 'Paiement par virement', enabled: true },
        { label: 'Paiement à la livraison', desc: 'Cash on delivery', enabled: true },
      ].map((method) => (
        <Box key={method.label} className={styles.toggleRow}>
          <Box className={styles.toggleInfo}>
            <Typography className={styles.toggleLabel}>{method.label}</Typography>
            <Typography className={styles.toggleDesc}>{method.desc}</Typography>
          </Box>
          <Switch defaultChecked={method.enabled} sx={switchSx} />
        </Box>
      ))} */}

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateCommerce.isPending} onClick={() => handleSave(updateCommerce, {
          currency,
          commission: parseFloat(commission) || 10,
          minOrder: parseFloat(minOrder) || 5000,
          freeShippingMin: parseFloat(freeShipping) || 50000,
          taxRate: parseFloat(taxRate) || 18,
        })} />
      </Box>
    </Box>
  );

  const renderShipping = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Truck size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Livraison</Typography>
          <Typography className={styles.sectionSubtitle}>Transporteurs et frais de port</Typography>
        </Box>
      </Box>

      {[
        { label: 'Livraison standard', desc: 'Bénin (3-5 jours)', price: '2 500 F CFA', enabled: true },
        { label: 'Livraison offerte', desc: 'Dès 50 000 F CFA d\'achat', price: 'Gratuit', enabled: true },
        { label: 'Retrait en magasin', desc: 'Click & Collect', price: 'Gratuit', enabled: false },
      ].map((carrier) => (
        <Box key={carrier.label} sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          p: 2, mb: 1, borderRadius: '12px', border: '1px solid #F3F4F6',
          '&:hover': { bgcolor: '#FAFAFA' },
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{carrier.label}</Typography>
            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{carrier.desc}</Typography>
          </Box>
          <Chip label={carrier.price} size="small" sx={{ mr: 2, fontWeight: 600, bgcolor: 'rgba(255, 44, 44,0.08)', color: '#FF2C2C' }} />
          <Switch defaultChecked={carrier.enabled} sx={switchSx} />
        </Box>
      ))}

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateShipping.isPending} onClick={() => handleSave(updateShipping, {
          shippingMethods: [],
        })} />
      </Box>
    </Box>
  );

  const renderNotifications = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Bell size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Notifications</Typography>
          <Typography className={styles.sectionSubtitle}>Alertes et notifications automatiques</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Notifications admin</Typography>
      {[
        { label: 'Nouvelles commandes', desc: 'Email à chaque commande', state: orderNotifications, setter: setOrderNotifications },
        { label: 'Alertes stock', desc: 'Quand un produit passe sous le seuil', state: stockAlerts, setter: setStockAlerts },
        { label: 'Notifications email', desc: 'Activer les emails automatiques', state: emailNotifications, setter: setEmailNotifications },
        { label: 'Notifications push', desc: 'Notifications navigateur', state: pushNotifications, setter: setPushNotifications },
      ].map((notif) => (
        <Box key={notif.label} className={styles.toggleRow}>
          <Box className={styles.toggleInfo}>
            <Typography className={styles.toggleLabel}>{notif.label}</Typography>
            <Typography className={styles.toggleDesc}>{notif.desc}</Typography>
          </Box>
          <Switch checked={notif.state} onChange={() => notif.setter(!notif.state)} sx={switchSx} />
        </Box>
      ))}

      <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 3, mb: 2 }}>Templates email</Typography>
      {[
        'Confirmation de commande', 'Expédition commande', 'Bienvenue nouveau client',
        'Réinitialisation mot de passe', 'Nouveau vendeur approuvé', 'Produit refusé',
      ].map((template) => (
        <Box key={template} sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          p: 1.5, borderRadius: '10px', '&:hover': { bgcolor: '#F9FAFB' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Mail size={16} color="#9CA3AF" />
            <Typography sx={{ fontSize: 14 }}>{template}</Typography>
          </Box>
          <Button size="small" endIcon={<ChevronRight size={14} />}
            sx={{ textTransform: 'none', color: '#FF2C2C', fontSize: 13 }}>
            Modifier
          </Button>
        </Box>
      ))}

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateNotifications.isPending} onClick={() => handleSave(updateNotifications, {
          notifOrders: orderNotifications,
          notifStock: stockAlerts,
          notifEmail: emailNotifications,
          notifPush: pushNotifications,
        })} />
      </Box>
    </Box>
  );

  const renderSeo = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><SearchIcon size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>SEO & Référencement</Typography>
          <Typography className={styles.sectionSubtitle}>Optimisation moteurs de recherche</Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <TextField fullWidth label="Titre méta (title tag)" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} size="small"
            helperText={`${metaTitle.length}/70 caractères recommandés`} />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth label="Description méta" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} size="small" multiline rows={2}
            helperText={`${metaDescription.length}/160 caractères recommandés`} />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth label="Mots-clés (séparés par des virgules)" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} size="small" />
        </Grid>
      </Grid>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5 }}>Aperçu Google</Typography>
      <Box className={styles.seoPreview} sx={{ mb: 3 }}>
        <Typography className={styles.seoPreviewTitle}>{metaTitle || 'Titre de la page'}</Typography>
        <Typography className={styles.seoPreviewUrl}>{siteUrl}</Typography>
        <Typography className={styles.seoPreviewDesc}>{metaDescription || 'Description...'}</Typography>
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Intégrations</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Google Analytics ID" value={googleAnalytics} onChange={(e) => setGoogleAnalytics(e.target.value)} size="small" placeholder="G-XXXXXXXXXX" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Facebook Pixel ID" value={facebookPixel} onChange={(e) => setFacebookPixel(e.target.value)} size="small" placeholder="XXXXXXXXXXXXXXXX" />
        </Grid>
      </Grid>

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateSeo.isPending} onClick={() => handleSave(updateSeo, {
          metaTitle: metaTitle || null, metaDescription: metaDescription || null,
          metaKeywords: metaKeywords || null, googleAnalytics: googleAnalytics || null,
          facebookPixel: facebookPixel || null,
        })} />
      </Box>
    </Box>
  );

  const renderLegal = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><FileText size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Pages légales</Typography>
          <Typography className={styles.sectionSubtitle}>CGU, confidentialité, mentions légales, retours</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {legalPages.map((page, i) => (
          <Chip
            key={page.label} label={page.label} onClick={() => setLegalTab(i)}
            sx={{
              fontWeight: legalTab === i ? 700 : 500, fontSize: 13, cursor: 'pointer',
              bgcolor: legalTab === i ? 'rgba(255, 44, 44,0.1)' : '#F3F4F6',
              color: legalTab === i ? '#FF2C2C' : '#6B7280',
              border: legalTab === i ? '1px solid rgba(255, 44, 44,0.3)' : '1px solid transparent',
              '&:hover': { bgcolor: legalTab === i ? 'rgba(255, 44, 44,0.15)' : '#E5E7EB' },
            }}
          />
        ))}
      </Box>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5 }}>
        {legalPages[legalTab].label}
      </Typography>

      <RichTextEditor
        value={legalPages[legalTab].value}
        onChange={legalPages[legalTab].onChange}
        placeholder={legalPages[legalTab].placeholder}
        minHeight={400}
      />

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" startIcon={<Eye size={16} />} sx={btnOutline}>Prévisualiser</Button>
        <SaveButton saving={updateLegal.isPending} onClick={() => handleSave(updateLegal, {
          cguContent: cguContent || null, privacyContent: privacyContent || null,
          mentionsContent: mentionsContent || null, returnPolicy: returnPolicyContent || null,
        })} />
      </Box>
    </Box>
  );

  const renderAdvanced = () => (
    <Box className={styles.section}>
      <Box className={styles.sectionHeader}>
        <Box className={styles.sectionIcon}><Shield size={20} /></Box>
        <Box>
          <Typography className={styles.sectionTitle}>Paramètres avancés</Typography>
          <Typography className={styles.sectionSubtitle}>Maintenance, modération et système</Typography>
        </Box>
      </Box>

      {[
        { label: 'Mode maintenance', desc: 'Mettre le site hors ligne (admin uniquement)', state: maintenanceMode, setter: setMaintenanceMode, danger: true },
        { label: 'Modération des produits', desc: 'Approbation requise avant publication', state: productModeration, setter: setProductModeration },
        { label: 'Inscription vendeurs', desc: 'Permettre les inscriptions vendeurs', state: sellerRegistration, setter: setSellerRegistration },
        { label: 'Modération des avis', desc: 'Vérification des avis avant publication', state: reviewModeration, setter: setReviewModeration },
      ].map((setting) => (
        <Box key={setting.label} className={styles.toggleRow}>
          <Box className={styles.toggleInfo}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography className={styles.toggleLabel}>{setting.label}</Typography>
              {setting.danger && (
                <Chip label="Attention" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 700 }} />
              )}
            </Box>
            <Typography className={styles.toggleDesc}>{setting.desc}</Typography>
          </Box>
          <Switch checked={setting.state} onChange={() => setting.setter(!setting.state)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: setting.danger ? '#EF4444' : '#FF2C2C' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: setting.danger ? '#EF4444' : '#FF2C2C' },
            }} />
        </Box>
      ))}

      <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 3, mb: 2 }}>Système</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" sx={btnOutline}>Vider le cache</Button>
        <Button variant="outlined" sx={btnOutline}>Regénérer le sitemap</Button>
        <Button variant="outlined" sx={{ ...btnOutline, borderColor: '#FEF2F2', color: '#EF4444' }}>
          Réinitialiser les paramètres
        </Button>
      </Box>

      <Box className={styles.actionsFooter}>
        <Button variant="outlined" sx={btnOutline} onClick={() => settings && populateFromSettings(settings)}>Annuler</Button>
        <SaveButton saving={updateAdvanced.isPending} onClick={() => handleSave(updateAdvanced, {
          maintenanceMode, productModeration, sellerRegistration, reviewModeration,
        })} />
      </Box>
    </Box>
  );

  // ==============================================
  // HOMEPAGE CONTENT
  // ==============================================
  const renderHomepageContent = () => {
    // Helper pour upload inline d'une image (bannières homepage)
    const uploadBannerImage = async (
      file: File,
      onSuccess: (url: string) => void,
    ) => {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post<{ url: string }>('/upload/image', form, {
        headers: { 'Content-Type': undefined },
      });
      onSuccess(data.url);
    };

    const newBanner = (): HomepageBannerConfig => ({
      id: crypto.randomUUID(),
      isActive: true,
      variant: 'primary',
      imageUrl: '',
      badgeText: 'Offre Limitée',
      title: '',
      titleHighlight: '',
      description: '',
      ctaLabel: 'Découvrir',
      ctaLink: '/',
      priceLabel: 'À partir de',
      priceValue: '',
      discountBadge: '-30%',
      feature1: 'Livraison gratuite',
      feature2: 'Garantie 2 ans',
    });

    return (
      <Box className={styles.section}>
        <Box className={styles.sectionHeader}>
          <Box className={styles.sectionIcon}><Home size={20} /></Box>
          <Box>
            <Typography className={styles.sectionTitle}>Contenu Homepage</Typography>
            <Typography className={styles.sectionSubtitle}>
              Bannières, vente flash et section publicitaire — configurez tout depuis ici
            </Typography>
          </Box>
        </Box>

        {/* ── BANNIÈRES PRINCIPALE ────────────────────────── */}
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1, mt: 1 }}>
          Bannières principales (BannerAd)
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 2 }}>
          Bannière 0 = position primaire, Bannière 1 = position secondaire. Si aucune bannière n&apos;est configurée, les valeurs par défaut s&apos;affichent.
        </Typography>

        {homepageBanners.map((banner, idx) => (
          <Box key={banner.id} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Bannière {idx}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Active</Typography>
                <Switch
                  checked={banner.isActive}
                  onChange={(e) => {
                    const u = [...homepageBanners];
                    u[idx] = { ...u[idx], isActive: e.target.checked };
                    setHomepageBanners(u);
                  }}
                  sx={switchSx}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Trash2 size={14} />}
                  onClick={() => setHomepageBanners(homepageBanners.filter((_, i) => i !== idx))}
                  sx={{ ...btnOutline, color: '#EF4444', borderColor: '#FCA5A5', fontSize: 12 }}
                >
                  Supprimer
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* Image */}
              <Grid size={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Image de la bannière</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    sx={{ flex: 1, minWidth: 200 }}
                    placeholder="URL de l'image"
                    value={banner.imageUrl}
                    onChange={(e) => {
                      const u = [...homepageBanners];
                      u[idx] = { ...u[idx], imageUrl: e.target.value };
                      setHomepageBanners(u);
                    }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Upload size={14} />}
                    component="label"
                    sx={{ bgcolor: '#FF2C2C', textTransform: 'none', borderRadius: '10px', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#D41E1E' } }}
                  >
                    Uploader
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadBannerImage(file, (url) => {
                          const u = [...homepageBanners];
                          u[idx] = { ...u[idx], imageUrl: url };
                          setHomepageBanners(u);
                        });
                      }}
                    />
                  </Button>
                </Box>
                {banner.imageUrl && (
                  <Box sx={{ mt: 1 }}>
                    <img src={banner.imageUrl} alt="" style={{ height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                  </Box>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Badge (ex: Offre Limitée)" value={banner.badgeText}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], badgeText: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Badge remise (ex: -30%)" value={banner.discountBadge}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], discountBadge: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Variante" value={banner.variant} select
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], variant: e.target.value as HomepageBannerConfig['variant'] }; setHomepageBanners(u); }}>
                  <MenuItem value="primary">Primaire (fond sombre)</MenuItem>
                  <MenuItem value="secondary">Secondaire (fond orange)</MenuItem>
                  <MenuItem value="gradient">Gradient</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField size="small" fullWidth label="Titre" value={banner.title}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], title: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField size="small" fullWidth label="Mot mis en évidence" value={banner.titleHighlight}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], titleHighlight: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={12}>
                <TextField size="small" fullWidth multiline rows={2} label="Description" value={banner.description}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], description: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Label CTA" value={banner.ctaLabel}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], ctaLabel: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Lien CTA" value={banner.ctaLink}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], ctaLink: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField size="small" fullWidth label="Prix affiché (ex: 21 000 F CFA)" value={banner.priceValue}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], priceValue: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField size="small" fullWidth label="Feature 1 (ex: Livraison gratuite)" value={banner.feature1}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], feature1: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField size="small" fullWidth label="Feature 2 (ex: Garantie 2 ans)" value={banner.feature2}
                  onChange={(e) => { const u = [...homepageBanners]; u[idx] = { ...u[idx], feature2: e.target.value }; setHomepageBanners(u); }} />
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button
          variant="outlined"
          startIcon={<Plus size={16} />}
          onClick={() => setHomepageBanners([...homepageBanners, newBanner()])}
          sx={{ ...btnOutline, mb: 4, mt: 0.5 }}
        >
          Ajouter une bannière
        </Button>

        {/* ── VENTE FLASH ─────────────────────────────────── */}
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>
          Vente Flash — Countdown Timer
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 2 }}>
          Définissez la date de fin réelle de la vente flash. Le timer sur la homepage s&apos;actualisera en temps réel.
        </Typography>

        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Vente Flash active</Typography>
            <Switch
              checked={flashSaleConfig.isActive}
              onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, isActive: e.target.checked })}
              sx={switchSx}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                size="small" fullWidth
                label="Date et heure de fin"
                type="datetime-local"
                value={flashSaleConfig.endDate ? new Date(flashSaleConfig.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFlashSaleConfig({
                  ...flashSaleConfig,
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField size="small" fullWidth label="Code promo" value={flashSaleConfig.promoCode}
                onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, promoCode: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <TextField size="small" fullWidth label="Texte du label promo" value={flashSaleConfig.promoCodeLabel}
                onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, promoCodeLabel: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField size="small" fullWidth type="number" label="Réduction max (%)" value={flashSaleConfig.maxDiscountPercent}
                onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, maxDiscountPercent: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 0, max: 100 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField size="small" fullWidth label="Badge (ex: Exclusif)" value={flashSaleConfig.bannerBadge}
                onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, bannerBadge: e.target.value })} />
            </Grid>
          </Grid>
        </Box>

        {/* ── SECTION PUBLICITAIRE (AdSection) ────────────── */}
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>
          Section Publicitaire (AdSection)
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 2 }}>
          Grande bannière à gauche + 2 petites bannières. La newsletter n&apos;est pas configurable ici.
        </Typography>

        {/* Grande bannière */}
        <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>Grande bannière (Ventes Flash)</Typography>
        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Afficher</Typography>
            <Switch
              checked={adSectionConfig.largeBanner.isActive}
              onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, isActive: e.target.checked } })}
              sx={switchSx}
            />
            <Typography sx={{ fontSize: 13, color: '#6B7280', ml: 2 }}>Afficher le mini-timer</Typography>
            <Switch
              checked={adSectionConfig.largeBanner.showTimer}
              onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, showTimer: e.target.checked } })}
              sx={switchSx}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField size="small" sx={{ flex: 1, minWidth: 200 }} placeholder="URL de l'image" label="Image"
                  value={adSectionConfig.largeBanner.imageUrl}
                  onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, imageUrl: e.target.value } })} />
                <Button size="small" variant="contained" startIcon={<Upload size={14} />} component="label"
                  sx={{ bgcolor: '#FF2C2C', textTransform: 'none', borderRadius: '10px', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#D41E1E' } }}>
                  Uploader
                  <input type="file" hidden accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    await uploadBannerImage(file, (url) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, imageUrl: url } }));
                  }} />
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Badge (ex: Jusqu'à -70%)" value={adSectionConfig.largeBanner.badgeText}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, badgeText: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Titre" value={adSectionConfig.largeBanner.title}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, title: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Mot mis en évidence" value={adSectionConfig.largeBanner.titleHighlight}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, titleHighlight: e.target.value } })} />
            </Grid>
            <Grid size={12}>
              <TextField size="small" fullWidth multiline rows={2} label="Description" value={adSectionConfig.largeBanner.description}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, description: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField size="small" fullWidth label="Label CTA" value={adSectionConfig.largeBanner.ctaLabel}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, ctaLabel: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField size="small" fullWidth label="Lien CTA" value={adSectionConfig.largeBanner.ctaLink}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, largeBanner: { ...adSectionConfig.largeBanner, ctaLink: e.target.value } })} />
            </Grid>
          </Grid>
        </Box>

        {/* Cartes Cadeaux */}
        <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>Petite bannière — Cartes Cadeaux</Typography>
        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Afficher</Typography>
            <Switch
              checked={adSectionConfig.giftCardBanner.isActive}
              onChange={(e) => setAdSectionConfig({ ...adSectionConfig, giftCardBanner: { ...adSectionConfig.giftCardBanner, isActive: e.target.checked } })}
              sx={switchSx}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Titre" value={adSectionConfig.giftCardBanner.title}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, giftCardBanner: { ...adSectionConfig.giftCardBanner, title: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Description" value={adSectionConfig.giftCardBanner.description}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, giftCardBanner: { ...adSectionConfig.giftCardBanner, description: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Lien" value={adSectionConfig.giftCardBanner.ctaLink}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, giftCardBanner: { ...adSectionConfig.giftCardBanner, ctaLink: e.target.value } })} />
            </Grid>
          </Grid>
        </Box>

        {/* Nouveautés */}
        <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>Petite bannière — Nouveautés</Typography>
        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Afficher</Typography>
            <Switch
              checked={adSectionConfig.newArrivalsBanner.isActive}
              onChange={(e) => setAdSectionConfig({ ...adSectionConfig, newArrivalsBanner: { ...adSectionConfig.newArrivalsBanner, isActive: e.target.checked } })}
              sx={switchSx}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField size="small" sx={{ flex: 1, minWidth: 200 }} label="Image" placeholder="URL de l'image"
                  value={adSectionConfig.newArrivalsBanner.imageUrl}
                  onChange={(e) => setAdSectionConfig({ ...adSectionConfig, newArrivalsBanner: { ...adSectionConfig.newArrivalsBanner, imageUrl: e.target.value } })} />
                <Button size="small" variant="contained" startIcon={<Upload size={14} />} component="label"
                  sx={{ bgcolor: '#FF2C2C', textTransform: 'none', borderRadius: '10px', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#D41E1E' } }}>
                  Uploader
                  <input type="file" hidden accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    await uploadBannerImage(file, (url) => setAdSectionConfig({ ...adSectionConfig, newArrivalsBanner: { ...adSectionConfig.newArrivalsBanner, imageUrl: url } }));
                  }} />
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Titre" value={adSectionConfig.newArrivalsBanner.title}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, newArrivalsBanner: { ...adSectionConfig.newArrivalsBanner, title: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Description" value={adSectionConfig.newArrivalsBanner.description}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, newArrivalsBanner: { ...adSectionConfig.newArrivalsBanner, description: e.target.value } })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Lien" value={adSectionConfig.newArrivalsBanner.ctaLink}
                onChange={(e) => setAdSectionConfig({ ...adSectionConfig, newArrivalsBanner: { ...adSectionConfig.newArrivalsBanner, ctaLink: e.target.value } })} />
            </Grid>
          </Grid>
        </Box>

        {/* Actions */}
        <Box className={styles.actionsFooter}>
          <Button variant="outlined" sx={btnOutline}
            onClick={() => { if (settings) populateFromSettings(settings); }}>
            Annuler
          </Button>
          <SaveButton
            saving={updateHomepageContent.isPending}
            onClick={() => handleSave(updateHomepageContent, {
              homepageBanners,
              flashSaleConfig,
              adSectionConfig,
            })}
          />
        </Box>
      </Box>
    );
  };

  const sectionRenderers: Record<SettingsSection, () => React.ReactNode> = {
    general: renderGeneral,
    contact: renderContact,
    social: renderSocial,
    appearance: renderAppearance,
    commerce: renderCommerce,
    shipping: renderShipping,
    notifications: renderNotifications,
    seo: renderSeo,
    legal: renderLegal,
    advanced: renderAdvanced,
    'homepage-content': renderHomepageContent,
  };

  return (
    <>
      <Box className={styles.settingsLayout}>
        <Box className={styles.settingsNav}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Box key={item.id}>
                {(i === 4 || i === 7 || i === 9) && <Box className={styles.navDivider} />}
                <Box
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Box className={styles.navIcon}><Icon size={18} /></Box>
                  <span className={styles.navLabel}>{item.label}</span>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box className={styles.settingsContent}>
          {sectionRenderers[activeSection]()}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
