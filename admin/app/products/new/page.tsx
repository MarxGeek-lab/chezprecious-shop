'use client';

// ==============================================
// PAGE AJOUT PRODUIT PRO - DASHBOARD SELLER
// ==============================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useAdminCreateProduct, useCategories } from '@/src/hooks/useAdminData';
import type { AxiosError } from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Tooltip,
  Divider,
  Rating,
} from '@mui/material';
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Package,
  Tag,
  Truck,
  Info,
  DollarSign,
  Image as ImageIcon,
  Layers,
  Film,
  Link2,
  Star,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import styles from '../product.module.scss';

// ==============================================
// TYPES
// ==============================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface VideoSlot {
  type: 'file' | 'url';
  file?: File;
  url?: string;
}

interface VariantOption {
  name: string;
  values: string[];
}

interface Variant {
  id: string;
  combination: Record<string, string>;
  price: string;
  stock: string;
  sku: string;
  active: boolean;
}

// ==============================================
// SUB-COMPONENTS
// ==============================================

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function ImagePreview({ file, onRemove, isMain, onSetMain }: {
  file: File;
  onRemove: () => void;
  isMain: boolean;
  onSetMain: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Box className={styles.mediaItem}>
      {isMain && <Box className={styles.mediaMainBadge}>Principale</Box>}
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={file.name} />
      )}
      <Box className={styles.mediaOverlay}>
        {!isMain && (
          <Tooltip title="Définir comme principale">
            <IconButton className={styles.mediaSetMainBtn} onClick={onSetMain} size="small">
              <Star size={14} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Supprimer">
          <IconButton className={styles.mediaRemoveBtn} onClick={onRemove} size="small">
            <X size={14} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// Video preview with object URL
function VideoFilePreview({ file }: { file: File }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!videoUrl) return null;

  return (
    <video
      src={videoUrl}
      controls
      className={styles.videoPlayer}
      preload="metadata"
    />
  );
}

// Live Preview: image slider for the sidebar
function PreviewImageSlider({ images }: { images: File[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const newUrls = images.map((f) => URL.createObjectURL(f));
    setUrls(newUrls);
    return () => newUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  useEffect(() => {
    if (currentIndex >= images.length) setCurrentIndex(0);
  }, [images.length, currentIndex]);

  if (urls.length === 0) return null;

  return (
    <>
      <Box className={styles.previewImageArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[currentIndex] || urls[0]} alt="Aperçu" className={styles.previewImage} />
        {urls.length > 1 && (
          <>
            <IconButton
              className={`${styles.previewArrow} ${styles.previewArrowLeft}`}
              onClick={() => setCurrentIndex((i) => (i === 0 ? urls.length - 1 : i - 1))}
              size="small"
            >
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton
              className={`${styles.previewArrow} ${styles.previewArrowRight}`}
              onClick={() => setCurrentIndex((i) => (i === urls.length - 1 ? 0 : i + 1))}
              size="small"
            >
              <ChevronRight size={18} />
            </IconButton>
            <Box className={styles.previewDots}>
              {urls.map((_, i) => (
                <Box
                  key={i}
                  className={`${styles.previewDot} ${i === currentIndex ? styles.activeDot : ''}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
      {urls.length > 1 && (
        <Box className={styles.previewThumbs}>
          {urls.map((url, i) => (
            <Box
              key={i}
              className={`${styles.previewThumb} ${i === currentIndex ? styles.previewThumbActive : ''}`}
              onClick={() => setCurrentIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Miniature ${i + 1}`} />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}

// Devises supportées
const currencies = [
  { code: 'XOF', label: 'F CFA (XOF)', symbol: 'F CFA' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'USD', label: 'Dollar US (USD)', symbol: '$' },
  { code: 'GBP', label: 'Livre Sterling (GBP)', symbol: '£' },
  { code: 'XAF', label: 'F CFA CEMAC (XAF)', symbol: 'F CFA' },
  { code: 'NGN', label: 'Naira (NGN)', symbol: '₦' },
  { code: 'GHS', label: 'Cedi (GHS)', symbol: '₵' },
  { code: 'MAD', label: 'Dirham (MAD)', symbol: 'DH' },
];

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function NewProductPage() {
  const { setActiveTab } = useAdminTab();
  const createProduct = useAdminCreateProduct();
  const { data: apiCategories } = useCategories();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // --- Tab state ---
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // --- General info ---
  const [productName, setProductName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('new');
  const [warranty, setWarranty] = useState('');
  const [originCountry, setOriginCountry] = useState('');

  // --- Media ---
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<(VideoSlot | null)[]>([null, null]);
  const [videoModes, setVideoModes] = useState<('file' | 'url')[]>(['file', 'file']);

  // --- Pricing ---
  const [currency, setCurrency] = useState('XOF');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [cost, setCost] = useState('');
  const [taxRate, setTaxRate] = useState('20');
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);

  // --- Variants ---
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState<Record<number, string>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // --- Shipping ---
  const [weight, setWeight] = useState('');
  const [dlength, setDlength] = useState('');
  const [dwidth, setDwidth] = useState('');
  const [dheight, setDheight] = useState('');

  // --- Metadata ---
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Computed: currency symbol
  const currencySymbol = useMemo(() => {
    return currencies.find((c) => c.code === currency)?.symbol || currency || 'F CFA';
  }, [currency]);

  // Computed: categories and sub-categories from API
  const categoryOptions = useMemo(() => {
    return (apiCategories || []).map((cat) => ({ value: cat.slug, label: cat.name }));
  }, [apiCategories]);

  const subCategoryOptions = useMemo(() => {
    if (!category || !apiCategories) return [];
    const cat = apiCategories.find((c) => c.slug === category);
    return (cat?.subCategories || []).map((sub) => ({ value: sub.slug, label: sub.name }));
  }, [category, apiCategories]);

  // ==============================================
  // HANDLERS
  // ==============================================

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setProductName(value);
    setSlug(generateSlug(value));
  };

  // --- Images ---
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    setImages((prev) => [...prev, ...validFiles].slice(0, 8));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetMainImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [moved] = newImages.splice(index, 1);
      newImages.unshift(moved);
      return newImages;
    });
  };

  // --- Videos ---
  const handleVideoFileChange = (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 50 * 1024 * 1024) return;
    setVideos((prev) => {
      const next = [...prev];
      next[slotIndex] = { type: 'file', file };
      return next;
    });
    if (videoInputRefs[slotIndex].current) videoInputRefs[slotIndex].current!.value = '';
  };

  const handleVideoUrlChange = (slotIndex: number, url: string) => {
    setVideos((prev) => {
      const next = [...prev];
      next[slotIndex] = url ? { type: 'url', url } : null;
      return next;
    });
  };

  const handleVideoRemove = (slotIndex: number) => {
    setVideos((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleVideoModeChange = (slotIndex: number, mode: 'file' | 'url') => {
    setVideoModes((prev) => {
      const next = [...prev];
      next[slotIndex] = mode;
      return next;
    });
    handleVideoRemove(slotIndex);
  };

  // --- Tags ---
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // --- Variants ---
  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    if (variantOptions.some((o) => o.name.toLowerCase() === newOptionName.trim().toLowerCase())) return;
    setVariantOptions([...variantOptions, { name: newOptionName.trim(), values: [] }]);
    setNewOptionName('');
  };

  const handleRemoveOption = (index: number) => {
    setVariantOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOptionValue = (optionIndex: number) => {
    const value = newOptionValues[optionIndex]?.trim();
    if (!value) return;
    if (variantOptions[optionIndex].values.includes(value)) return;
    setVariantOptions((prev) => {
      const next = [...prev];
      next[optionIndex] = { ...next[optionIndex], values: [...next[optionIndex].values, value] };
      return next;
    });
    setNewOptionValues((prev) => ({ ...prev, [optionIndex]: '' }));
  };

  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    setVariantOptions((prev) => {
      const next = [...prev];
      next[optionIndex] = {
        ...next[optionIndex],
        values: next[optionIndex].values.filter((_, i) => i !== valueIndex),
      };
      return next;
    });
  };

  const generateVariants = useCallback(() => {
    const options = variantOptions.filter((o) => o.values.length > 0);
    if (options.length === 0) {
      setVariants([]);
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((a) => curr.map((v) => [...a, v])),
        [[]]
      );
    };

    const combinations = cartesian(options.map((o) => o.values));
    const newVariants: Variant[] = combinations.map((combo, idx) => {
      const combination: Record<string, string> = {};
      options.forEach((opt, i) => {
        combination[opt.name] = combo[i];
      });

      const existing = variants.find(
        (v) => JSON.stringify(v.combination) === JSON.stringify(combination)
      );

      return existing || {
        id: `var-${idx}-${Date.now()}`,
        combination,
        price: price || '',
        stock: '',
        sku: sku ? `${sku}-${combo.join('-').toUpperCase()}` : '',
        active: true,
      };
    });

    setVariants(newVariants);
  }, [variantOptions, variants, price, sku]);

  useEffect(() => {
    if (hasVariants) {
      generateVariants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantOptions, hasVariants]);

  const handleVariantChange = (variantId: string, field: keyof Variant, value: string | boolean) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
    );
  };

  const handleBulkApply = () => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        ...(bulkPrice ? { price: bulkPrice } : {}),
        ...(bulkStock ? { stock: bulkStock } : {}),
      }))
    );
  };

  // --- Computed ---
  const margin = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    const costNum = parseFloat(cost) || 0;
    if (priceNum && costNum) {
      return (((priceNum - costNum) / priceNum) * 100).toFixed(1);
    }
    return '0';
  }, [price, cost]);

  const discount = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    const comparePriceNum = parseFloat(comparePrice) || 0;
    if (priceNum && comparePriceNum && comparePriceNum > priceNum) {
      return (((comparePriceNum - priceNum) / comparePriceNum) * 100).toFixed(0);
    }
    return '0';
  }, [price, comparePrice]);

  const conditionLabels: Record<string, string> = {
    new: 'Neuf',
    refurbished: 'Reconditionné',
    used: 'Occasion',
  };

  const handleSave = (asDraft = false) => {
    if (!productName.trim()) {
      setSnackbar({ open: true, message: 'Le nom du produit est obligatoire', severity: 'error' });
      setCurrentTab(0);
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setSnackbar({ open: true, message: 'Le prix est obligatoire et doit être supérieur à 0', severity: 'error' });
      setCurrentTab(1);
      return;
    }

    // Construire le FormData (multipart pour les fichiers)
    const formData = new FormData();

    // Ajouter les images
    images.forEach((file) => formData.append('images', file));

    // Ajouter les vidéos fichier
    const videoUrls: { url: string; title?: string }[] = [];
    videos.forEach((slot) => {
      if (!slot) return;
      if (slot.type === 'file' && slot.file) {
        formData.append('videos', slot.file);
      } else if (slot.type === 'url' && slot.url) {
        videoUrls.push({ url: slot.url });
      }
    });

    // Construire les variantes pour l'API
    const variantsPayload = hasVariants && variants.length > 0
      ? variants.filter((v) => v.active).map((v) => ({
          combination: v.combination,
          price: parseFloat(v.price) || parseFloat(price),
          stock: parseInt(v.stock) || 0,
          sku: v.sku || null,
          isActive: v.active,
        }))
      : undefined;

    // Données JSON dans le champ "data"
    const jsonData = {
      name: productName.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDesc.trim() || null,
      description: description.trim() || null,
      category: category || null,
      subCategory: subCategory || null,
      brand: brand.trim() || null,
      condition: condition.toUpperCase(),
      warranty: warranty.trim() || null,
      originCountry: originCountry.trim() || null,
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      cost: cost ? parseFloat(cost) : null,
      taxRate: parseFloat(taxRate) || 20,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      trackInventory,
      allowBackorder,
      weight: weight ? parseFloat(weight) : null,
      dimensionLength: dlength ? parseFloat(dlength) : null,
      dimensionWidth: dwidth ? parseFloat(dwidth) : null,
      dimensionHeight: dheight ? parseFloat(dheight) : null,
      tags,
      status: asDraft ? 'DRAFT' : (isActive ? 'ACTIVE' : 'DRAFT'),
      isFeatured,
      variants: variantsPayload,
      videoUrls: videoUrls.length > 0 ? videoUrls : undefined,
    };

    formData.append('data', JSON.stringify(jsonData));

    createProduct.mutate(formData, {
      onSuccess: (data) => {
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        setTimeout(() => setActiveTab('products'), 1500);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        setSnackbar({ open: true, message: axiosErr.response?.data?.message || 'Erreur lors de la création du produit', severity: 'error' });
      },
    });
  };

  // ==============================================
  // RENDER
  // ==============================================

  return (
    <Box className={styles.dashboard}>
      {/* Page Header */}
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <IconButton sx={{ ml: -1 }} onClick={() => setActiveTab('products')}>
              <ArrowLeft size={20} />
            </IconButton>
            <Typography variant="h1">Nouveau produit</Typography>
          </Box>
          <Typography>Ajoutez un nouveau produit à votre catalogue</Typography>
        </Box>
        <Box className={styles.pageActions}>
          <Button
            variant="outlined"
            startIcon={<Save size={18} />}
            className={styles.outlineButton}
            onClick={() => handleSave(true)}
            disabled={createProduct.isPending}
          >
            Brouillon
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            className={styles.primaryButton}
            onClick={() => handleSave(false)}
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? 'Enregistrement...' : 'Publier'}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Main Grid Layout */}
      <Grid container spacing={3}>
        {/* ===== LEFT: Form ===== */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className={styles.productFormCard}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              className={styles.productTabs}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<Package size={18} />} iconPosition="start" label="Informations" />
              <Tab icon={<DollarSign size={18} />} iconPosition="start" label="Prix & Stock" />
              <Tab icon={<Layers size={18} />} iconPosition="start" label="Variantes" />
              <Tab icon={<Truck size={18} />} iconPosition="start" label="Livraison" />
              <Tab icon={<Tag size={18} />} iconPosition="start" label="Métadonnées" />
            </Tabs>

            {/* ============================================ */}
            {/* Tab 0: Informations générales */}
            {/* ============================================ */}
            <TabPanel value={currentTab} index={0}>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  Détails du produit
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField fullWidth label="Nom du produit" placeholder="Ex: iPhone 15 Pro Max 256GB" value={productName} onChange={(e) => handleNameChange(e.target.value)} required helperText="Le nom de votre produit tel qu'il apparaîtra sur votre boutique" />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth label="URL (slug)" value={slug} helperText="Généré automatiquement à partir du nom"
                      slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start">/products/</InputAdornment> } }}
                      sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover' } }} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth label="Description courte" placeholder="Une brève description du produit..." value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} multiline rows={2}
                      helperText={`${shortDesc.length}/160 caractères`} inputProps={{ maxLength: 160 }} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth label="Description complète" placeholder="Décrivez en détail les caractéristiques de votre produit..." value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={6} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Catégorie</InputLabel>
                      <Select value={category} label="Catégorie" onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }}>
                        {categoryOptions.map((cat) => (
                          <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth disabled={!category || subCategoryOptions.length === 0}>
                      <InputLabel>Sous-catégorie</InputLabel>
                      <Select value={subCategory} label="Sous-catégorie" onChange={(e) => setSubCategory(e.target.value)}>
                        {subCategoryOptions.map((sub) => (
                          <MenuItem key={sub.value} value={sub.value}>{sub.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Marque" placeholder="Ex: Apple" value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Condition</InputLabel>
                      <Select value={condition} label="Condition" onChange={(e) => setCondition(e.target.value)}>
                        <MenuItem value="new">Neuf</MenuItem>
                        <MenuItem value="refurbished">Reconditionné</MenuItem>
                        <MenuItem value="used">Occasion</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Garantie" placeholder="Ex: 2 ans constructeur" value={warranty} onChange={(e) => setWarranty(e.target.value)} helperText="Durée et type de garantie" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Pays d'origine" placeholder="Ex: France" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} />
                  </Grid>
                </Grid>
              </Box>

              {/* Images Section */}
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  <ImageIcon size={20} />
                  Images du produit
                  <Chip label={`${images.length}/8`} size="small" color={images.length > 0 ? 'primary' : 'default'} variant="outlined" sx={{ ml: 'auto' }} />
                </Typography>

                <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={handleImageAdd} />

                {images.length > 0 ? (
                  <Box className={styles.mediaGrid}>
                    {images.map((file, index) => (
                      <ImagePreview
                        key={`${file.name}-${file.size}-${index}`}
                        file={file}
                        isMain={index === 0}
                        onRemove={() => handleImageRemove(index)}
                        onSetMain={() => handleSetMainImage(index)}
                      />
                    ))}
                    {images.length < 8 && (
                      <Box className={styles.mediaAddButton} onClick={() => imageInputRef.current?.click()}>
                        <Plus size={24} />
                        <span>Ajouter</span>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box className={styles.imageUploadArea} onClick={() => imageInputRef.current?.click()}>
                    <ImageIcon size={48} />
                    <Typography variant="h6">Glissez vos images ici ou cliquez pour sélectionner</Typography>
                    <Typography variant="body2" color="text.secondary">PNG, JPG ou WEBP (max. 5MB par image, 8 images max)</Typography>
                    <Button variant="outlined" startIcon={<Upload size={18} />} sx={{ mt: 2 }}>Choisir des fichiers</Button>
                  </Box>
                )}

                {images.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    La première image sera l&#39;image principale. Survolez pour définir comme principale ou supprimer.
                  </Typography>
                )}
              </Box>

              {/* Videos Section */}
              {/* <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>
                  <Film size={20} />
                  Vidéos du produit
                  <Chip label="Max 2" size="small" variant="outlined" sx={{ ml: 'auto' }} />
                </Typography>

                <Grid container spacing={2}>
                  {[0, 1].map((slotIndex) => (
                    <Grid key={slotIndex} size={{ xs: 12, sm: 6 }}>
                      <Box className={styles.videoSlot}>
                        <Box className={styles.videoSlotHeader}>
                          <Typography className={styles.videoSlotTitle}><Film size={16} /> Vidéo {slotIndex + 1}</Typography>
                          {videos[slotIndex] && (
                            <IconButton size="small" onClick={() => handleVideoRemove(slotIndex)}><X size={16} /></IconButton>
                          )}
                        </Box>
                        <Box className={styles.videoToggle}>
                          <Button className={`${styles.videoToggleBtn} ${videoModes[slotIndex] === 'file' ? styles.active : ''}`} onClick={() => handleVideoModeChange(slotIndex, 'file')} startIcon={<Upload size={14} />}>Fichier</Button>
                          <Button className={`${styles.videoToggleBtn} ${videoModes[slotIndex] === 'url' ? styles.active : ''}`} onClick={() => handleVideoModeChange(slotIndex, 'url')} startIcon={<Link2 size={14} />}>URL</Button>
                        </Box>
                        <input ref={videoInputRefs[slotIndex]} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => handleVideoFileChange(slotIndex, e)} />
                        {videos[slotIndex] ? (
                          <Box className={styles.videoSlotPreview}>
                            {videos[slotIndex]!.type === 'file' && videos[slotIndex]!.file ? (
                              <VideoFilePreview file={videos[slotIndex]!.file!} />
                            ) : (
                              <Box className={styles.videoSlotUrlPreview}>
                                <Box className={styles.videoSlotIcon}><Link2 size={24} /></Box>
                                <Box className={styles.videoSlotInfo}>
                                  <Typography className={styles.videoSlotName}>{videos[slotIndex]!.url}</Typography>
                                  <Typography className={styles.videoSlotSize}>URL externe</Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        ) : videoModes[slotIndex] === 'file' ? (
                          <Box className={styles.videoSlotEmpty} onClick={() => videoInputRefs[slotIndex].current?.click()}>
                            <Upload size={24} />
                            <Typography variant="body2">MP4 ou WEBM (max. 50MB)</Typography>
                          </Box>
                        ) : (
                          <TextField fullWidth size="small" placeholder="https://youtube.com/watch?v=..." onChange={(e) => handleVideoUrlChange(slotIndex, e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Link2 size={16} /></InputAdornment> }} helperText="YouTube, Vimeo ou lien direct" />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box> */}
            </TabPanel>

            {/* ============================================ */}
            {/* Tab 1: Prix & Stock */}
            {/* ============================================ */}
            <TabPanel value={currentTab} index={1}>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>Tarification</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Devise</InputLabel>
                      <Select value={currency} label="Devise" onChange={(e) => setCurrency(e.target.value)}>
                        {currencies.map((c) => (
                          <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Prix de vente" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                      InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }} helperText="Prix TTC affiché au client" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Prix barré (optionnel)" type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }}
                      helperText={discount !== '0' ? `Remise de ${discount}%` : 'Ancien prix pour montrer la réduction'} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Coût de revient" type="number" value={cost} onChange={(e) => setCost(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }}
                      helperText={margin !== '0' ? `Marge: ${margin}%` : "Votre coût d'achat"} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Taux de TVA</InputLabel>
                      <Select value={taxRate} label="Taux de TVA" onChange={(e) => setTaxRate(e.target.value)}>
                        <MenuItem value="0">0% - Exonéré</MenuItem>
                        <MenuItem value="5.5">5.5% - Taux réduit</MenuItem>
                        <MenuItem value="10">10% - Taux intermédiaire</MenuItem>
                        <MenuItem value="20">20% - Taux normal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                {price && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Prix HT:</strong> {currencySymbol} {(parseFloat(price) / (1 + parseFloat(taxRate) / 100)).toFixed(2)}{' '}
                    | <strong>TVA:</strong> {currencySymbol} {(parseFloat(price) - parseFloat(price) / (1 + parseFloat(taxRate) / 100)).toFixed(2)}
                  </Alert>
                )}
              </Box>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>Inventaire</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="SKU" placeholder="Ex: IPH15PM-256-BLK" value={sku} onChange={(e) => setSku(e.target.value)} helperText="Code unique du produit" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Code-barres" placeholder="Ex: 1234567890123" value={barcode} onChange={(e) => setBarcode(e.target.value)} helperText="EAN, UPC ou ISBN" />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel control={<Switch checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} />} label="Suivre les stocks pour ce produit" />
                  </Grid>
                  {trackInventory && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Quantité en stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required helperText="Quantité disponible à la vente" />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Seuil de stock faible" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} helperText="Alerte quand le stock descend sous ce seuil" />
                      </Grid>
                      <Grid size={12}>
                        <FormControlLabel control={<Switch checked={allowBackorder} onChange={(e) => setAllowBackorder(e.target.checked)} />} label="Autoriser les précommandes si rupture de stock" />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </TabPanel>

            {/* ============================================ */}
            {/* Tab 2: Variantes */}
            {/* ============================================ */}
            <TabPanel value={currentTab} index={2}>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}><Layers size={20} /> Variantes du produit</Typography>
                <FormControlLabel control={<Switch checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />} label="Ce produit a des variantes (taille, couleur, etc.)" />
                {!hasVariants && (
                  <Alert severity="info" sx={{ mt: 2 }}>Activez les variantes si votre produit existe en plusieurs versions (ex: différentes tailles, couleurs, ou capacités de stockage).</Alert>
                )}
              </Box>
              {hasVariants && (
                <>
                  <Box className={styles.formSection}>
                    <Typography variant="h6" className={styles.sectionTitle}>Options</Typography>
                    <Box className={styles.variantsSection}>
                      {variantOptions.map((option, optIndex) => (
                        <Box key={optIndex} className={styles.variantOptionCard}>
                          <Box className={styles.variantOptionHeader}>
                            <Typography className={styles.variantOptionName}>{option.name}</Typography>
                            <IconButton size="small" onClick={() => handleRemoveOption(optIndex)} color="error"><Trash2 size={16} /></IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField size="small" placeholder={`Ajouter une valeur (ex: ${option.name === 'Couleur' ? 'Rouge' : 'M'})`}
                              value={newOptionValues[optIndex] || ''} onChange={(e) => setNewOptionValues((prev) => ({ ...prev, [optIndex]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptionValue(optIndex); } }} sx={{ flex: 1 }} />
                            <Button variant="outlined" size="small" onClick={() => handleAddOptionValue(optIndex)} sx={{ minWidth: 'auto', px: 2 }}><Plus size={16} /></Button>
                          </Box>
                          {option.values.length > 0 && (
                            <Box className={styles.variantValues}>
                              {option.values.map((val, valIndex) => (
                                <Chip key={val} label={val} onDelete={() => handleRemoveOptionValue(optIndex, valIndex)} deleteIcon={<X size={14} />} color="primary" variant="outlined" size="small" />
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField size="small" placeholder="Nom de l'option (ex: Taille, Couleur, Matière...)" value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }} sx={{ flex: 1 }} />
                        <Button variant="contained" size="small" onClick={handleAddOption} className={styles.primaryButton} startIcon={<Plus size={16} />} disabled={!newOptionName.trim()}>Ajouter</Button>
                      </Box>
                    </Box>
                  </Box>
                  {variants.length > 0 && (
                    <Box className={styles.formSection}>
                      <Typography variant="h6" className={styles.sectionTitle}>Combinaisons ({variants.length})</Typography>
                      <Box className={styles.variantBulkActions} sx={{ mb: 2 }}>
                        <Typography className={styles.variantBulkLabel}>Appliquer à tous :</Typography>
                        <TextField size="small" placeholder="Prix" type="number" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)}
                          InputProps={{ startAdornment: <InputAdornment position="start">F CFA</InputAdornment> }} sx={{ width: 130 }} />
                        <TextField size="small" placeholder="Stock" type="number" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} sx={{ width: 100 }} />
                        <Button variant="outlined" size="small" onClick={handleBulkApply} startIcon={<Copy size={14} />} disabled={!bulkPrice && !bulkStock}>Appliquer</Button>
                      </Box>
                      <TableContainer className={styles.variantTable}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Variante</TableCell>
                              <TableCell sx={{ width: 130 }}>Prix (F CFA)</TableCell>
                              <TableCell sx={{ width: 100 }}>Stock</TableCell>
                              <TableCell sx={{ width: 160 }}>SKU</TableCell>
                              <TableCell sx={{ width: 70 }} align="center">Actif</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {variants.map((variant) => (
                              <TableRow key={variant.id}>
                                <TableCell>
                                  <Box className={styles.variantCombination}>
                                    {Object.entries(variant.combination).map(([key, val]) => (<Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" type="number" value={variant.price} onChange={(e) => handleVariantChange(variant.id, 'price', e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">F CFA</InputAdornment> }} sx={{ '& input': { py: 0.5 } }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" type="number" value={variant.stock} onChange={(e) => handleVariantChange(variant.id, 'stock', e.target.value)} sx={{ '& input': { py: 0.5 } }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" value={variant.sku} onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)} sx={{ '& input': { py: 0.5, fontSize: 12 } }} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox checked={variant.active} onChange={(e) => handleVariantChange(variant.id, 'active', e.target.checked)} size="small" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </TabPanel>

            {/* ============================================ */}
            {/* Tab 3: Livraison */}
            {/* ============================================ */}
            <TabPanel value={currentTab} index={3}>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>Dimensions & Poids</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>Ces informations sont utilisées pour calculer les frais de livraison</Alert>
                <Grid container spacing={2}>
                  <Grid size={12}><TextField fullWidth label="Poids" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }} helperText="Poids du produit emballé" /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Longueur" type="number" value={dlength} onChange={(e) => setDlength(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Largeur" type="number" value={dwidth} onChange={(e) => setDwidth(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Hauteur" type="number" value={dheight} onChange={(e) => setDheight(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }} /></Grid>
                </Grid>
              </Box>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>Options de livraison</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel control={<Switch defaultChecked />} label="Livraison standard disponible" />
                  <FormControlLabel control={<Switch defaultChecked />} label="Livraison express disponible" />
                  <FormControlLabel control={<Switch />} label="Retrait en magasin disponible" />
                </Box>
              </Box>
            </TabPanel>

            {/* ============================================ */}
            {/* Tab 4: Métadonnées */}
            {/* ============================================ */}
            <TabPanel value={currentTab} index={4}>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>Tags & Recherche</Typography>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField fullWidth label="Ajouter des tags" placeholder="Ex: nouveau, tendance, promo..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={handleAddTag}><Plus size={18} /></IconButton></InputAdornment> }}
                      helperText="Appuyez sur Entrée ou cliquez sur + pour ajouter" />
                  </Grid>
                  {tags.length > 0 && (
                    <Grid size={12}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {tags.map((tag) => (<Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} deleteIcon={<X size={14} />} color="primary" variant="outlined" />))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
              <Box className={styles.formSection}>
                <Typography variant="h6" className={styles.sectionTitle}>SEO & Référencement</Typography>
                <Grid container spacing={2}>
                  <Grid size={12}><TextField fullWidth label="Titre SEO" placeholder="Titre optimisé pour les moteurs de recherche" helperText="60 caractères maximum recommandé" inputProps={{ maxLength: 60 }} /></Grid>
                  <Grid size={12}><TextField fullWidth label="Meta description" placeholder="Description qui apparaît dans les résultats de recherche" multiline rows={2} helperText="155 caractères maximum recommandé" inputProps={{ maxLength: 155 }} /></Grid>
                </Grid>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        {/* ===== RIGHT: Sidebar ===== */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ position: { lg: 'sticky' }, top: { lg: 80 } }}>
          {/* Live Preview Card */}
          <Paper className={styles.sidebarCard} sx={{  }}>
            <Typography variant="h6" className={styles.sidebarTitle}><Eye size={18} /> Aperçu en direct</Typography>

            <Box className={styles.previewCard}>
              {images.length > 0 ? (
                <PreviewImageSlider images={images} />
              ) : (
                <Box className={styles.previewImageArea}>
                  <Box className={styles.previewPlaceholder}>
                    <ImageIcon size={32} />
                    <Typography variant="caption" color="text.secondary">Ajoutez des images</Typography>
                  </Box>
                </Box>
              )}

              <Box className={styles.previewInfo}>
                <Typography className={styles.previewCategory}>
                  {category ? categoryOptions.find((c) => c.value === category)?.label || category : 'Catégorie'}
                </Typography>
                <Typography className={styles.previewName}>
                  {productName || 'Nom du produit'}
                </Typography>
                <Box className={styles.previewRating}>
                  <Rating value={0} size="small" readOnly icon={<Star size={14} fill="currentColor" />} emptyIcon={<Star size={14} />} />
                </Box>
                <Box className={styles.previewPriceRow}>
                  <Typography className={styles.previewPrice}>
                    {price ? `${currencySymbol} ${parseFloat(price).toLocaleString()}` : `${currencySymbol} 0`}
                  </Typography>
                  {comparePrice && parseFloat(comparePrice) > parseFloat(price || '0') && (
                    <Typography className={styles.previewOriginalPrice}>
                      {currencySymbol} {parseFloat(comparePrice).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Informations</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { label: 'Marque', value: brand },
                { label: 'Condition', value: conditionLabels[condition] },
                { label: 'Garantie', value: warranty },
                { label: 'Origine', value: originCountry },
                { label: 'SKU', value: sku },
              ].filter((item) => item.value).map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="caption" fontWeight={500}>{item.value}</Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Résumé</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { label: 'Images', value: `${images.length}/8`, color: images.length > 0 ? 'primary' as const : 'default' as const },
                { label: 'Vidéos', value: `${videos.filter(Boolean).length}/2`, color: 'default' as const },
                ...(hasVariants ? [{ label: 'Variantes', value: `${variants.length}`, color: 'secondary' as const }] : []),
                { label: 'Tags', value: `${tags.length}`, color: 'default' as const },
                ...(price && margin !== '0' ? [{ label: 'Marge', value: `${margin}%`, color: parseFloat(margin) > 20 ? 'success' as const : 'default' as const }] : []),
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Chip label={item.value} size="small" color={item.color} variant="outlined" sx={{ height: 22 }} />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Status Card */}
          <Paper className={styles.sidebarCard} sx={{  mt: 2 }}>
            <Typography variant="h6" className={styles.sidebarTitle}><Info size={18} /> Statut</Typography>
            <Box className={styles.sidebarContent}>
              <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Produit actif" />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>Le produit sera visible sur votre boutique</Typography>
              <FormControlLabel control={<Switch checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />} label="Produit à la une" sx={{ mt: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>Mise en avant sur la page d&#39;accueil</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
