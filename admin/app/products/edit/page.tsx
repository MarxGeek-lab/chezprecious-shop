'use client';

// ==============================================
// PAGE ÉDITION PRODUIT - DASHBOARD SELLER
// ==============================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAdminTab } from '@/src/context/AdminTabContext';
import {
  useAdminProductForEdit,
  useAdminUpdateProduct,
  useAdminDeleteProductImage,
  useAdminDeleteProductVideo,
  useAdminSetMainImage,
  useCategories,
} from '@/src/hooks/useAdminData';
import { getAssetUrl } from '@/src/lib/api';
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
  Skeleton,
} from '@mui/material';
import {
  ArrowLeft,
  Save,
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
// HELPERS
// ==============================================

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3, px: 3 }}>{children}</Box> : null;
}

function ImagePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

function VideoFilePreview({ file }: { file: File }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!videoUrl) return null;
  return <video src={videoUrl} controls className={styles.videoPlayer} preload="metadata" />;
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

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// ==============================================
// COMPONENT
// ==============================================

export default function ProductEditPage() {
  const { setActiveTab, params } = useAdminTab();
  const productId = params?.productId as string | undefined;
  const { data: product, isLoading: isLoadingProduct } = useAdminProductForEdit(productId);
  const updateProduct = useAdminUpdateProduct(productId || '');
  const deleteImage = useAdminDeleteProductImage();
  const deleteVideo = useAdminDeleteProductVideo();
  const setMainImage = useAdminSetMainImage();
  const { data: apiCategories } = useCategories();

  const [initialized, setInitialized] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'REFURBISHED' | 'USED'>('NEW');
  const [warranty, setWarranty] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Pricing
  const [currency, setCurrency] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [cost, setCost] = useState('');
  const [taxRate, setTaxRate] = useState('0');

  // Stock
  const [stock, setStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);

  // Shipping
  const [weight, setWeight] = useState('');
  const [dimensionLength, setDimensionLength] = useState('');
  const [dimensionWidth, setDimensionWidth] = useState('');
  const [dimensionHeight, setDimensionHeight] = useState('');

  // Media
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string; isPrimary: boolean; position: number }>>([]);
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [existingVideos, setExistingVideos] = useState<Array<{ id: string; url: string; title: string | null; position: number }>>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState<Record<number, string>>({});

  // Status
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('DRAFT');

  // Submission
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Preview
  const [previewIndex, setPreviewIndex] = useState(0);

  // Initialize form from loaded product
  useEffect(() => {
    if (product && !initialized) {
      setName(product.name || '');
      setSlug(product.slug || '');
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setCategory(product.category || '');
      setSubCategory(product.subCategory || '');
      setBrand(product.brand || '');
      setCondition(product.condition || 'NEW');
      setWarranty(product.warranty || '');
      setOriginCountry(product.originCountry || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setTags(product.tags || []);
      setPrice(String(product.price || ''));
      setComparePrice(product.comparePrice ? String(product.comparePrice) : '');
      setCost(product.cost ? String(product.cost) : '');
      setTaxRate(String(product.taxRate || 0));
      setStock(String(product.stock || 0));
      setLowStockThreshold(String(product.lowStockThreshold || 5));
      setTrackInventory(product.trackInventory);
      setAllowBackorder(product.allowBackorder);
      setWeight(product.weight ? String(product.weight) : '');
      setDimensionLength(product.dimensionLength ? String(product.dimensionLength) : '');
      setDimensionWidth(product.dimensionWidth ? String(product.dimensionWidth) : '');
      setDimensionHeight(product.dimensionHeight ? String(product.dimensionHeight) : '');
      setExistingImages(product.images || []);
      setExistingVideos(product.videos || []);
      setIsFeatured(product.isFeatured);
      setStatus(product.status === 'ARCHIVED' ? 'INACTIVE' : product.status);

      // Load variants
      if (product.variants && product.variants.length > 0) {
        setHasVariants(true);
        // Reconstruct variant options from combinations
        const optionsMap = new Map<string, Set<string>>();
        product.variants.forEach((v: any) => {
          Object.entries(v.combination).forEach(([key, val]: [any, any]) => {
            if (!optionsMap.has(key)) optionsMap.set(key, new Set());
            optionsMap.get(key)!.add(val);
          });
        });
        setVariantOptions(
          Array.from(optionsMap.entries()).map(([name, values]) => ({
            name,
            values: Array.from(values),
          }))
        );
        setVariants(
          product.variants.map((v: any) => ({
            id: v.id,
            combination: v.combination,
            price: String(v.price),
            stock: String(v.stock),
            sku: v.sku || '',
            active: v.isActive,
          }))
        );
      }

      setInitialized(true);
    }
  }, [product, initialized]);

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

  // Handle name change → auto slug
  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  // Tag management
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  // Image management
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 8) {
      setSnackbar({ open: true, message: 'Maximum 8 images autorisées', severity: 'error' });
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = (imageId: string) => {
    if (!productId) return;
    deleteImage.mutate({ productId, imageId }, {
      onSuccess: () => {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      },
    });
  };

  const handleSetMainImage = (imageId: string) => {
    if (!productId) return;
    setMainImage.mutate({ productId, imageId }, {
      onSuccess: () => {
        setExistingImages((prev) =>
          prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
        );
      },
    });
  };

  // Video management
  const handleVideoFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = [...videoSlots];
    updated[index] = { type: 'file', file };
    setVideoSlots(updated);
    e.target.value = '';
  };

  const handleVideoUrlChange = (index: number, url: string) => {
    const updated = [...videoSlots];
    updated[index] = { type: 'url', url };
    setVideoSlots(updated);
  };

  const handleRemoveVideoSlot = (index: number) => {
    setVideoSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingVideo = (videoId: string) => {
    if (!productId) return;
    deleteVideo.mutate({ productId, videoId }, {
      onSuccess: () => {
        setExistingVideos((prev) => prev.filter((v) => v.id !== videoId));
      },
    });
  };

  // Variant management
  const handleAddVariantOption = () => {
    if (!newOptionName.trim()) return;
    setVariantOptions([...variantOptions, { name: newOptionName.trim(), values: [] }]);
    setNewOptionName('');
  };

  const handleAddVariantValue = (optionIndex: number) => {
    const value = newOptionValues[optionIndex]?.trim();
    if (!value) return;
    const updated = [...variantOptions];
    if (!updated[optionIndex].values.includes(value)) {
      updated[optionIndex].values.push(value);
      setVariantOptions(updated);
    }
    setNewOptionValues({ ...newOptionValues, [optionIndex]: '' });
  };

  const handleRemoveVariantValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...variantOptions];
    updated[optionIndex].values.splice(valueIndex, 1);
    setVariantOptions(updated);
  };

  const handleRemoveVariantOption = (index: number) => {
    setVariantOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate variants from options
  const generatedVariants = useMemo(() => {
    const options = variantOptions.filter((o) => o.values.length > 0);
    if (options.length === 0) return [];

    const cartesian = (arrays: string[][]): string[][] => {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restCombinations = cartesian(rest);
      return first.flatMap((val) => restCombinations.map((combo) => [val, ...combo]));
    };

    const combos = cartesian(options.map((o) => o.values));
    return combos.map((combo, i) => {
      const combination: Record<string, string> = {};
      options.forEach((opt, j) => {
        combination[opt.name] = combo[j];
      });
      const existing = variants.find((v) =>
        JSON.stringify(v.combination) === JSON.stringify(combination)
      );
      return existing || {
        id: `new-${i}`,
        combination,
        price: price || '0',
        stock: '0',
        sku: '',
        active: true,
      };
    });
  }, [variantOptions, variants, price]);

  const handleVariantChange = useCallback((id: string, field: keyof Variant, value: string | boolean) => {
    setVariants((prev) => {
      const existing = prev.find((v) => v.id === id);
      if (existing) {
        return prev.map((v) => v.id === id ? { ...v, [field]: value } : v);
      }
      const generated = generatedVariants.find((v) => v.id === id);
      if (generated) {
        return [...prev, { ...generated, [field]: value }];
      }
      return prev;
    });
  }, [generatedVariants]);

  const displayVariants = generatedVariants.length > 0 ? generatedVariants : variants;

  // All preview images (existing + new)
  const allPreviewImages = useMemo(() => {
    const existing = existingImages.map((img) => ({ type: 'existing' as const, url: getAssetUrl(img.url) ?? img.url, id: img.id }));
    const newImgs = newImages.map((file, i) => ({ type: 'new' as const, file, index: i }));
    return [...existing, ...newImgs];
  }, [existingImages, newImages]);

  // Margins
  const margin = useMemo(() => {
    if (!price || !cost) return '';
    const p = parseFloat(price);
    const c = parseFloat(cost);
    if (p > 0 && c > 0) {
      return (((p - c) / p) * 100).toFixed(1);
    }
    return '';
  }, [price, cost]);

  // Save handler
  const handleSave = (asDraft?: boolean) => {
    if (!productId) return;

    if (!name.trim()) {
      setSnackbar({ open: true, message: 'Le nom du produit est obligatoire', severity: 'error' });
      setActiveTabIndex(0);
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setSnackbar({ open: true, message: 'Le prix doit être supérieur à 0', severity: 'error' });
      setActiveTabIndex(1);
      return;
    }

    const formData = new FormData();

    // Add new images
    newImages.forEach((file) => formData.append('images', file));

    // Add new videos
    videoSlots.forEach((slot) => {
      if (slot.type === 'file' && slot.file) {
        formData.append('videos', slot.file);
      }
    });

    // Build JSON data
    const videoUrls = videoSlots
      .filter((s) => s.type === 'url' && s.url)
      .map((s) => s.url!);

    const data: Record<string, unknown> = {
      name: name.trim(),
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      category: category || null,
      subCategory: subCategory || null,
      brand: brand.trim() || null,
      condition,
      warranty: warranty.trim() || null,
      originCountry: originCountry.trim() || null,
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      cost: cost ? parseFloat(cost) : null,
      taxRate: parseFloat(taxRate) || 0,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      trackInventory,
      allowBackorder,
      weight: weight ? parseFloat(weight) : null,
      dimensionLength: dimensionLength ? parseFloat(dimensionLength) : null,
      dimensionWidth: dimensionWidth ? parseFloat(dimensionWidth) : null,
      dimensionHeight: dimensionHeight ? parseFloat(dimensionHeight) : null,
      tags,
      status: asDraft ? 'DRAFT' : status,
      isFeatured,
      videoUrls,
    };

    if (hasVariants && displayVariants.length > 0) {
      data.variants = displayVariants.map((v) => ({
        combination: v.combination,
        price: parseFloat(v.price) || parseFloat(price),
        stock: parseInt(v.stock) || 0,
        sku: v.sku || null,
        isActive: v.active,
      }));
    }

    formData.append('data', JSON.stringify(data));

    updateProduct.mutate(formData, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Produit mis à jour avec succès !', severity: 'success' });
        setNewImages([]);
        setVideoSlots([]);
        setTimeout(() => setActiveTab('products'), 1500);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        setSnackbar({ open: true, message: axiosErr.response?.data?.message || 'Erreur lors de la mise à jour', severity: 'error' });
      },
    });
  };

  // Loading state
  if (!productId) {
    return (
      <Box className={styles.dashboard}>
        <Alert severity="error">Aucun produit sélectionné</Alert>
        <Button onClick={() => setActiveTab('products')} startIcon={<ArrowLeft size={18} />} sx={{ mt: 2 }}>
          Retour aux produits
        </Button>
      </Box>
    );
  }

  if (isLoadingProduct) {
    return (
      <Box className={styles.dashboard}>
        <Box className={styles.pageHeader}>
          <Skeleton width={300} height={40} />
        </Box>
        <Skeleton variant="rounded" height={600} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box className={styles.dashboard}>
        <Alert severity="error">Produit introuvable</Alert>
        <Button onClick={() => setActiveTab('products')} startIcon={<ArrowLeft size={18} />} sx={{ mt: 2 }}>
          Retour aux produits
        </Button>
      </Box>
    );
  }

  return (
    <Box className={styles.dashboard}>
      {/* Header */}
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => setActiveTab('products')}
            sx={{ mb: 1, color: 'text.secondary' }}
          >
            Retour aux produits
          </Button>
          <Typography variant="h1">Modifier le produit</Typography>
          <Typography>{name || 'Sans titre'}</Typography>
        </Box>
        <Box className={styles.pageActions}>
          <Button
            variant="outlined"
            className={styles.outlineButton}
            onClick={() => handleSave(true)}
            disabled={updateProduct.isPending}
          >
            Brouillon
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            className={styles.primaryButton}
            onClick={() => handleSave(false)}
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending ? 'Enregistrement...' : 'Enregistrer'}
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

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className={styles.productFormCard}>
            <Tabs value={activeTabIndex} onChange={(_, v) => setActiveTabIndex(v)} className={styles.productTabs}>
              <Tab icon={<Package size={16} />} iconPosition="start" label="Informations" />
              <Tab icon={<DollarSign size={16} />} iconPosition="start" label="Prix & Stock" />
              <Tab icon={<Layers size={16} />} iconPosition="start" label="Variantes" />
              <Tab icon={<Truck size={16} />} iconPosition="start" label="Livraison" />
              <Tab icon={<Tag size={16} />} iconPosition="start" label="Métadonnées" />
            </Tabs>

            {/* Tab 0 - Informations */}
            <TabPanel value={activeTabIndex} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Media */}
                <Box>
                  <Typography className={styles.sectionTitle}>
                    <ImageIcon size={20} /> Images du produit
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {existingImages.length + newImages.length}/8 images — PNG, JPG, WEBP (max 5MB)
                  </Typography>
                  <input
                    type="file"
                    ref={imageInputRef}
                    hidden
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                  />
                  <Box className={styles.mediaGrid}>
                    {/* Existing images */}
                    {existingImages.map((img) => (
                      <Box key={img.id} className={styles.mediaItem}>
                        {img.isPrimary && <Box className={styles.mediaMainBadge}>Principale</Box>}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getAssetUrl(img.url)} alt={'product'} />
                        <Box className={styles.mediaOverlay}>
                          {!img.isPrimary && (
                            <Tooltip title="Définir comme principale">
                              <IconButton className={styles.mediaSetMainBtn} onClick={() => handleSetMainImage(img.id)} size="small">
                                <Star size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Supprimer">
                            <IconButton className={styles.mediaRemoveBtn} onClick={() => handleDeleteExistingImage(img.id)} size="small">
                              <X size={14} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {/* New images */}
                    {newImages.map((file, i) => (
                      <Box key={`new-${i}`} className={styles.mediaItem}>
                        {existingImages.length === 0 && i === 0 && <Box className={styles.mediaMainBadge}>Principale</Box>}
                        <ImagePreview file={file} />
                        <Box className={styles.mediaOverlay}>
                          <Tooltip title="Supprimer">
                            <IconButton className={styles.mediaRemoveBtn} onClick={() => handleRemoveNewImage(i)} size="small">
                              <X size={14} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {/* Add button */}
                    {existingImages.length + newImages.length < 8 && (
                      <Box className={styles.mediaAddButton} onClick={() => imageInputRef.current?.click()}>
                        <Plus size={24} />
                        <span>Ajouter</span>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Videos */}
                <Box>
                  <Typography className={styles.sectionTitle}>
                    <Film size={20} /> Vidéos
                  </Typography>
                  {/* Existing videos */}
                  {existingVideos.length > 0 && (
                    <Box className={styles.videoSlotsGrid} sx={{ mb: 2 }}>
                      {existingVideos.map((video: any) => (
                        <Box key={video.id} className={styles.videoSlot}>
                          <Box className={styles.videoSlotHeader}>
                            <Typography className={styles.videoSlotTitle}>
                              <Film size={16} /> {video.title || (video.source === 'upload' ? 'Vidéo uploadée' : 'Vidéo URL')}
                            </Typography>
                            <IconButton size="small" onClick={() => handleDeleteExistingVideo(video.id)} color="error">
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                          {video.source === 'upload' ? (
                            <Box className={styles.videoSlotPreview}>
                              <video src={getAssetUrl(video.url)} controls className={styles.videoPlayer} preload="metadata" />
                            </Box>
                          ) : (
                            <Box className={styles.videoSlotUrlPreview}>
                              <Box className={styles.videoSlotIcon}><Link2 size={20} /></Box>
                              <Box className={styles.videoSlotInfo}>
                                <Typography className={styles.videoSlotName}>{video.url}</Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                  {/* New video slots */}
                  {existingVideos.length + videoSlots.length < 2 && (
                    <Box className={styles.videoSlotsGrid}>
                      {videoSlots.map((slot, i) => (
                        <Box key={i} className={styles.videoSlot}>
                          <Box className={styles.videoSlotHeader}>
                            <Typography className={styles.videoSlotTitle}>
                              <Film size={16} /> Nouvelle vidéo {i + 1}
                            </Typography>
                            <IconButton size="small" onClick={() => handleRemoveVideoSlot(i)} color="error">
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                          <Box className={styles.videoToggle}>
                            <Button
                              className={`${styles.videoToggleBtn} ${slot.type === 'file' ? styles.active : ''}`}
                              onClick={() => {
                                const updated = [...videoSlots];
                                updated[i] = { type: 'file' };
                                setVideoSlots(updated);
                              }}
                            >
                              <Upload size={14} style={{ marginRight: 4 }} /> Uploader
                            </Button>
                            <Button
                              className={`${styles.videoToggleBtn} ${slot.type === 'url' ? styles.active : ''}`}
                              onClick={() => {
                                const updated = [...videoSlots];
                                updated[i] = { type: 'url', url: '' };
                                setVideoSlots(updated);
                              }}
                            >
                              <Link2 size={14} style={{ marginRight: 4 }} /> URL
                            </Button>
                          </Box>
                          {slot.type === 'file' ? (
                            slot.file ? (
                              <Box className={styles.videoSlotPreview}>
                                <VideoFilePreview file={slot.file} />
                              </Box>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  ref={videoInputRefs[i]}
                                  hidden
                                  accept="video/mp4,video/webm"
                                  onChange={(e) => handleVideoFileUpload(i, e)}
                                />
                                <Box className={styles.videoSlotEmpty} onClick={() => videoInputRefs[i]?.current?.click()}>
                                  <Upload size={24} />
                                  <Typography variant="body2">Cliquer pour uploader</Typography>
                                  <Typography variant="caption" color="text.secondary">MP4, WEBM — Max 50MB</Typography>
                                </Box>
                              </>
                            )
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="https://youtube.com/watch?v=..."
                              value={slot.url || ''}
                              onChange={(e) => handleVideoUrlChange(i, e.target.value)}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start"><Link2 size={16} /></InputAdornment>
                                  ),
                                },
                              }}
                            />
                          )}
                        </Box>
                      ))}
                      {videoSlots.length < 2 - existingVideos.length && (
                        <Box
                          className={styles.videoSlotEmpty}
                          onClick={() => setVideoSlots([...videoSlots, { type: 'file' }])}
                          sx={{ minHeight: 120 }}
                        >
                          <Plus size={24} />
                          <Typography variant="body2">Ajouter une vidéo</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Basic info */}
                <TextField label="Nom du produit *" value={name} onChange={(e) => handleNameChange(e.target.value)} fullWidth />
                <TextField
                  label="Slug"
                  value={slug}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f5f5f5' } }}
                  helperText="Généré automatiquement depuis le nom"
                />
                <TextField label="Description courte" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} fullWidth multiline rows={2} />
                <TextField label="Description détaillée" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={4} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Catégorie</InputLabel>
                      <Select value={category} label="Catégorie" onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }}>
                        {categoryOptions.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth disabled={!category || subCategoryOptions.length === 0}>
                      <InputLabel>Sous-catégorie</InputLabel>
                      <Select value={subCategory} label="Sous-catégorie" onChange={(e) => setSubCategory(e.target.value)}>
                        {subCategoryOptions.map((sc) => <MenuItem key={sc.value} value={sc.value}>{sc.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Marque" value={brand} onChange={(e) => setBrand(e.target.value)} fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Condition</InputLabel>
                      <Select value={condition} label="Condition" onChange={(e) => setCondition(e.target.value as 'NEW' | 'REFURBISHED' | 'USED')}>
                        <MenuItem value="NEW">Neuf</MenuItem>
                        <MenuItem value="REFURBISHED">Reconditionné</MenuItem>
                        <MenuItem value="USED">Occasion</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Garantie" value={warranty} onChange={(e) => setWarranty(e.target.value)} fullWidth placeholder="Ex: 2 ans constructeur" />
                  </Grid>
                </Grid>

                <TextField label="Pays d'origine" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} fullWidth />
              </Box>
            </TabPanel>

            {/* Tab 1 - Prix & Stock */}
            <TabPanel value={activeTabIndex} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography className={styles.sectionTitle}>
                  <DollarSign size={20} /> Tarification
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Devise</InputLabel>
                      <Select value={currency} label="Devise" onChange={(e) => setCurrency(e.target.value)}>
                        {currencies.map((c) => (
                          <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Prix de vente *" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth type="number"
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Prix barré" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} fullWidth type="number"
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Coût d'achat" value={cost} onChange={(e) => setCost(e.target.value)} fullWidth type="number"
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment> } }} />
                  </Grid>
                </Grid>
                {margin && (
                  <Chip label={`Marge : ${margin}%`} color={parseFloat(margin) > 20 ? 'success' as const : 'default' as const} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                )}
                <TextField label="Taux de taxe (%)" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} type="number" fullWidth />

                <Divider />

                <Typography className={styles.sectionTitle}>
                  <Package size={20} /> Inventaire
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Stock disponible" value={stock} onChange={(e) => setStock(e.target.value)} fullWidth type="number" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Seuil d'alerte stock" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} fullWidth type="number" />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Code-barres" value={barcode} onChange={(e) => setBarcode(e.target.value)} fullWidth />
                  </Grid>
                </Grid>
                <FormControlLabel control={<Switch checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} />} label="Suivre l'inventaire" />
                <FormControlLabel control={<Switch checked={allowBackorder} onChange={(e) => setAllowBackorder(e.target.checked)} />} label="Autoriser les précommandes" />
              </Box>
            </TabPanel>

            {/* Tab 2 - Variantes */}
            <TabPanel value={activeTabIndex} index={2}>
              <Box className={styles.variantsSection}>
                <FormControlLabel
                  control={<Switch checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />}
                  label="Ce produit a des variantes"
                />
                {hasVariants && (
                  <>
                    {/* Options */}
                    {variantOptions.map((option, oi) => (
                      <Box key={oi} className={styles.variantOptionCard}>
                        <Box className={styles.variantOptionHeader}>
                          <Typography className={styles.variantOptionName}>{option.name}</Typography>
                          <IconButton size="small" onClick={() => handleRemoveVariantOption(oi)} color="error">
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Ajouter une valeur..."
                            value={newOptionValues[oi] || ''}
                            onChange={(e) => setNewOptionValues({ ...newOptionValues, [oi]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVariantValue(oi)}
                          />
                          <Button variant="outlined" size="small" onClick={() => handleAddVariantValue(oi)}>
                            <Plus size={16} />
                          </Button>
                        </Box>
                        <Box className={styles.variantValues}>
                          {option.values.map((val, vi) => (
                            <Chip key={vi} label={val} onDelete={() => handleRemoveVariantValue(oi, vi)} size="small" />
                          ))}
                        </Box>
                      </Box>
                    ))}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Nom de l'option (ex: Taille, Couleur...)"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddVariantOption()}
                      />
                      <Button variant="outlined" onClick={handleAddVariantOption} startIcon={<Plus size={16} />}>
                        Ajouter
                      </Button>
                    </Box>

                    {/* Variants table */}
                    {displayVariants.length > 0 && (
                      <TableContainer component={Paper} className={styles.variantTable}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Variante</TableCell>
                              <TableCell>Prix</TableCell>
                              <TableCell>Stock</TableCell>
                              <TableCell>SKU</TableCell>
                              <TableCell align="center">Actif</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {displayVariants.map((variant) => (
                              <TableRow key={variant.id}>
                                <TableCell>
                                  <Box className={styles.variantCombination}>
                                    {Object.entries(variant.combination).map(([key, val]) => (
                                      <Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" value={variant.price} onChange={(e) => handleVariantChange(variant.id, 'price', e.target.value)} type="number" sx={{ width: 100 }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" value={variant.stock} onChange={(e) => handleVariantChange(variant.id, 'stock', e.target.value)} type="number" sx={{ width: 80 }} />
                                </TableCell>
                                <TableCell>
                                  <TextField size="small" value={variant.sku} onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)} sx={{ width: 120 }} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox checked={variant.active} onChange={(e) => handleVariantChange(variant.id, 'active', e.target.checked)} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Tab 3 - Livraison */}
            <TabPanel value={activeTabIndex} index={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography className={styles.sectionTitle}>
                  <Truck size={20} /> Expédition
                </Typography>
                <TextField label="Poids (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} fullWidth type="number" />
                <Typography variant="subtitle2" color="text.secondary">Dimensions (cm)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Longueur" value={dimensionLength} onChange={(e) => setDimensionLength(e.target.value)} fullWidth type="number" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Largeur" value={dimensionWidth} onChange={(e) => setDimensionWidth(e.target.value)} fullWidth type="number" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Hauteur" value={dimensionHeight} onChange={(e) => setDimensionHeight(e.target.value)} fullWidth type="number" />
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Tab 4 - Métadonnées */}
            <TabPanel value={activeTabIndex} index={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography className={styles.sectionTitle}>
                  <Tag size={20} /> Tags & SEO
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Ajouter un tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    fullWidth
                    size="small"
                  />
                  <Button variant="outlined" onClick={handleAddTag}>
                    <Plus size={16} />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {tags.map((tag, i) => (
                    <Chip key={i} label={tag} onDelete={() => setTags(tags.filter((_, j) => j !== i))} size="small" />
                  ))}
                </Box>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Status */}
          <Box className={styles.sidebarCard}>
            <Typography className={styles.sidebarTitle}>
              <Info size={18} /> Statut
            </Typography>
            <Box className={styles.sidebarContent}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={status} label="Statut" onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'INACTIVE')}>
                  <MenuItem value="DRAFT">Brouillon</MenuItem>
                  <MenuItem value="ACTIVE">Actif (publié)</MenuItem>
                  <MenuItem value="INACTIVE">Inactif</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Switch checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />}
                label="Produit en vedette"
              />
            </Box>
          </Box>

          {/* Live Preview */}
          <Box className={styles.previewCard}>
            <Box className={styles.previewImageArea}>
              {allPreviewImages.length > 0 ? (
                <>
                  {allPreviewImages[previewIndex]?.type === 'existing' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={allPreviewImages[previewIndex].url}
                      alt="preview"
                      className={styles.previewImage}
                    />
                  ) : allPreviewImages[previewIndex]?.type === 'new' ? (
                    <ImagePreview file={(allPreviewImages[previewIndex] as { type: 'new'; file: File }).file} />
                  ) : null}
                  {comparePrice && parseFloat(comparePrice) > parseFloat(price) && (
                    <Chip label={`-${Math.round((1 - parseFloat(price) / parseFloat(comparePrice)) * 100)}%`} className={styles.previewBadge} size="small" />
                  )}
                  <IconButton className={styles.previewWishlist} size="small"><Heart size={16} /></IconButton>
                  {allPreviewImages.length > 1 && (
                    <>
                      <IconButton
                        className={`${styles.previewArrow} ${styles.previewArrowLeft}`}
                        onClick={() => setPreviewIndex((prev) => (prev - 1 + allPreviewImages.length) % allPreviewImages.length)}
                        size="small"
                      >
                        <ChevronLeft size={16} />
                      </IconButton>
                      <IconButton
                        className={`${styles.previewArrow} ${styles.previewArrowRight}`}
                        onClick={() => setPreviewIndex((prev) => (prev + 1) % allPreviewImages.length)}
                        size="small"
                      >
                        <ChevronRight size={16} />
                      </IconButton>
                      <Box className={styles.previewDots}>
                        {allPreviewImages.map((_, i) => (
                          <Box
                            key={i}
                            className={`${styles.previewDot} ${i === previewIndex ? styles.activeDot : ''}`}
                            onClick={() => setPreviewIndex(i)}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </>
              ) : (
                <Box className={styles.previewPlaceholder}>
                  <ImageIcon size={48} />
                  <Typography variant="body2">Aperçu du produit</Typography>
                </Box>
              )}
            </Box>
            <Box className={styles.previewInfo}>
              {category && <Typography className={styles.previewCategory}>{category}</Typography>}
              <Typography className={styles.previewName}>{name || 'Nom du produit'}</Typography>
              <Box className={styles.previewRating}>
                <Rating value={4.5} precision={0.5} size="small" readOnly />
                <Typography variant="caption" color="text.secondary">(0)</Typography>
              </Box>
              <Box className={styles.previewPriceRow}>
                <Typography className={styles.previewPrice}>{price ? `${parseFloat(price).toLocaleString('fr-FR')} ${currencySymbol}` : `0 ${currencySymbol}`}</Typography>
                {comparePrice && parseFloat(comparePrice) > parseFloat(price) && (
                  <Typography className={styles.previewOriginalPrice}>{parseFloat(comparePrice).toLocaleString('fr-FR')} {currencySymbol}</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
