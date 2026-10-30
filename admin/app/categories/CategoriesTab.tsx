'use client';

// ==============================================
// CATÉGORIES - Données réelles API
// ==============================================

import { useState } from 'react';
import {
  Box, Typography, Button, Avatar, IconButton, InputBase,
  Tooltip, Switch, Skeleton, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert,
  ToggleButton, ToggleButtonGroup,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Search, Plus, Edit2, Trash2, FolderTree, Package, Tag,
  Smile, Image as ImageIcon, X, FolderOpen,
} from 'lucide-react';
import {
  useAdminCategories, useToggleCategoryActive,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateSubCategory, useUpdateSubCategory, useDeleteSubCategory,
  type AdminCategory,
} from '@/src/hooks/useAdminData';
import { useSnackbar } from '@/src/context/SnackbarContext';
import styles from '@/src/styles/pages.module.scss';

interface SubCategoryForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Modal Ajouter / Modifier ────────────────────────────────────

function CategoryFormModal({
  category,
  onClose,
}: {
  category?: AdminCategory;
  onClose: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit = !!category;

  const [name, setName]               = useState(category?.name ?? '');
  const [slug, setSlug]               = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [icon, setIcon]               = useState(category?.icon ?? '');
  const [image, setImage]             = useState(category?.image ?? '');
  const [iconType, setIconType]       = useState<'icon' | 'image'>(category?.image ? 'image' : 'icon');
  const [subCategories, setSubCategories] = useState<SubCategoryForm[]>(
    (category?.subCategories ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description ?? '',
      icon: s.icon ?? '',
    }))
  );
  const [error, setError] = useState('');

  const createCategory    = useCreateCategory();
  const updateCategory    = useUpdateCategory();
  const createSubCategory = useCreateSubCategory();
  const updateSubCategory = useUpdateSubCategory();
  const deleteSubCategory = useDeleteSubCategory();
  const { showSuccess, showError } = useSnackbar();

  const isPending =
    createCategory.isPending || updateCategory.isPending ||
    createSubCategory.isPending || updateSubCategory.isPending || deleteSubCategory.isPending;

  const handleAddSub = () => {
    setSubCategories([...subCategories, { name: '', slug: '', description: '', icon: '' }]);
  };

  const handleRemoveSub = (index: number) => {
    setSubCategories(subCategories.filter((_, i) => i !== index));
  };

  const handleSubChange = (index: number, field: keyof SubCategoryForm, value: string) => {
    const updated = [...subCategories];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'name' && !updated[index].id) {
      updated[index].slug = generateSlug(value);
    }
    setSubCategories(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    setError('');
    try {
      const categoryData = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name.trim()),
        description: description.trim() || undefined,
        icon: iconType === 'icon' ? (icon.trim() || undefined) : undefined,
        image: iconType === 'image' ? (image.trim() || undefined) : undefined,
      };

      if (isEdit) {
        await updateCategory.mutateAsync({ id: category.id, ...categoryData });

        const existingSubIds = new Set(category.subCategories.map((s) => s.id));
        const currentSubIds  = new Set(subCategories.filter((s) => s.id).map((s) => s.id!));

        // Delete removed sub-categories
        for (const sub of category.subCategories) {
          if (!currentSubIds.has(sub.id)) {
            await deleteSubCategory.mutateAsync(sub.id);
          }
        }

        // Update or create sub-categories
        for (const sub of subCategories) {
          if (sub.id && existingSubIds.has(sub.id)) {
            await updateSubCategory.mutateAsync({
              id: sub.id,
              name: sub.name,
              slug: sub.slug || generateSlug(sub.name),
              description: sub.description || undefined,
              icon: sub.icon || undefined,
            });
          } else if (!sub.id && sub.name.trim()) {
            await createSubCategory.mutateAsync({
              categoryId: category.id,
              name: sub.name,
              slug: sub.slug || generateSlug(sub.name),
              description: sub.description || undefined,
              icon: sub.icon || undefined,
            });
          }
        }

        showSuccess(`Catégorie "${name}" mise à jour.`);
      } else {
        const result = await createCategory.mutateAsync(categoryData);
        const newId  = (result.data as any)?.category?.id;

        if (newId) {
          for (const sub of subCategories) {
            if (sub.name.trim()) {
              await createSubCategory.mutateAsync({
                categoryId: newId,
                name: sub.name,
                slug: sub.slug || generateSlug(sub.name),
                description: sub.description || undefined,
                icon: sub.icon || undefined,
              });
            }
          }
        }

        showSuccess(`Catégorie "${name}" créée.`);
      }

      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Erreur lors de l\'enregistrement.';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
        {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Avatar preview + icon type toggle */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontSize: 12, color: 'text.secondary' }}>
              Prévisualisation
            </Typography>
            <Avatar
              src={iconType === 'image' ? image : undefined}
              variant="rounded"
              sx={{ width: 64, height: 64, bgcolor: 'rgba(255, 44, 44,0.15)' }}
            >
              {iconType === 'icon' && (
                icon ? (
                  <span style={{ fontSize: 32 }}>{icon}</span>
                ) : (
                  <FolderOpen size={32} color="#FF2C2C" />
                )
              )}
            </Avatar>
          </Box>

          <Box sx={{ flex: 1 }}>
            <ToggleButtonGroup
              value={iconType}
              exclusive
              onChange={(_, v) => v && setIconType(v)}
              size="small"
              sx={{ mb: 1.5 }}
            >
              <ToggleButton value="icon">
                <Smile size={15} style={{ marginRight: 6 }} />
                Emoji
              </ToggleButton>
              <ToggleButton value="image">
                <ImageIcon size={15} style={{ marginRight: 6 }} />
                Image URL
              </ToggleButton>
            </ToggleButtonGroup>

            {iconType === 'icon' ? (
              <TextField
                label="Icône emoji"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📦"
                helperText="Emoji (optionnel)"
                fullWidth
                size="small"
                inputProps={{ maxLength: 2, style: { fontSize: 28, textAlign: 'center' } }}
              />
            ) : (
              <TextField
                label="URL de l'image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://exemple.com/image.png"
                helperText="URL complète de l'image"
                fullWidth
                size="small"
              />
            )}
          </Box>
        </Box>

        <TextField
          label="Nom *"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!isEdit) setSlug(generateSlug(e.target.value));
          }}
          size="small"
          fullWidth
          autoFocus
        />

        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          size="small"
          fullWidth
          helperText="Généré automatiquement depuis le nom"
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="small"
          fullWidth
          multiline
          rows={2}
        />

        <Divider />

        {/* Sub-categories */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Sous-catégories</Typography>
            <Button size="small" startIcon={<Plus size={14} />} onClick={handleAddSub}>
              Ajouter
            </Button>
          </Box>

          {subCategories.map((sub, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex', gap: 1, mb: 1.5, p: 1.5,
                border: '1px solid #e5e7eb', borderRadius: 1, alignItems: 'center',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              {/* Emoji preview + input */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255, 44, 44,0.1)', fontSize: 18 }}>
                  {sub.icon || '📋'}
                </Avatar>
                <TextField
                  placeholder="📋"
                  value={sub.icon}
                  onChange={(e) => handleSubChange(index, 'icon', e.target.value)}
                  sx={{ width: 52 }}
                  inputProps={{ maxLength: 2, style: { fontSize: 18, textAlign: 'center', padding: '4px' } }}
                  size="small"
                />
              </Box>

              <TextField
                label="Nom"
                value={sub.name}
                onChange={(e) => handleSubChange(index, 'name', e.target.value)}
                size="small"
                fullWidth
                required
              />

              <TextField
                label="Slug"
                value={sub.slug}
                onChange={(e) => handleSubChange(index, 'slug', e.target.value)}
                size="small"
                sx={{ width: 140 }}
              />

              <IconButton color="error" size="small" onClick={() => handleRemoveSub(index)}>
                <X size={16} />
              </IconButton>
            </Box>
          ))}

          {subCategories.length === 0 && (
            <Typography sx={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', py: 1 }}>
              Aucune sous-catégorie. Cliquez sur "Ajouter" pour en créer une.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Annuler</Button>
        <Button
          variant="contained" size="small" onClick={handleSave}
          disabled={isPending || !name.trim()}
          startIcon={isPending ? <CircularProgress size={14} /> : undefined}
          sx={{ bgcolor: '#FF2C2C', '&:hover': { bgcolor: '#B34D00' } }}
        >
          {isEdit ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Modal Suppression ────────────────────────────────────────────

function DeleteCategoryModal({ category, onClose }: { category: AdminCategory; onClose: () => void }) {
  const deleteCategory = useDeleteCategory();
  const { showSuccess, showError } = useSnackbar();

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      showSuccess(`Catégorie "${category.name}" supprimée.`);
      onClose();
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: '#EF4444' }}>Supprimer la catégorie</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14 }}>
          Supprimer <strong>"{category.name}"</strong> ?<br />
          <Typography component="span" sx={{ fontSize: 12, color: '#9CA3AF' }}>
            Les sous-catégories seront supprimées. Les produits liés perdront leur catégorie.
          </Typography>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Annuler</Button>
        <Button
          variant="contained" color="error" size="small" onClick={handleDelete}
          disabled={deleteCategory.isPending}
          startIcon={deleteCategory.isPending ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
        >
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────

export default function CategoriesTab() {
  const { showSuccess, showError } = useSnackbar();
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(() => {
      setDebounced(v);
    }, 350);
  };

  const { data, isLoading } = useAdminCategories({
    search: debouncedSearch || undefined,
  });

  const toggleActive = useToggleCategoryActive();

  const categories = data?.data ?? [];
  const meta       = data?.meta;

  const handleToggle = (cat: AdminCategory) => {
    toggleActive.mutate(cat.id, {
      onSuccess: () => showSuccess(cat.isActive ? `"${cat.name}" désactivée.` : `"${cat.name}" activée.`),
      onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur.'),
    });
  };

  return (
    <Box>
      {/* Modals */}
      {(showForm || editTarget) && (
        <CategoryFormModal
          category={editTarget ?? undefined}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteCategoryModal category={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}

      {/* Stats */}
      <Box className={styles.statsRow}>
        {[
          { icon: FolderTree, label: 'Catégories',   value: meta?.total        ?? '—', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: FolderTree, label: 'Actives',       value: meta?.active       ?? '—', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: FolderTree, label: 'Inactives',     value: (meta?.total != null && meta?.active != null) ? meta.total - meta.active : '—', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { icon: Tag,        label: 'Produits liés', value: meta?.totalProducts ?? '—', color: '#FF2C2C', bg: 'rgba(255, 44, 44,0.1)' },
        ].map((stat) => (
          <Box key={stat.label} className={styles.statCard}>
            <Box className={styles.statIcon} sx={{ background: stat.bg, color: stat.color }}>
              <stat.icon size={20} />
            </Box>
            <Box>
              <Typography className={styles.statValue}>{Number(stat.value).toLocaleString('fr-FR')}</Typography>
              <Typography className={styles.statLabel}>{stat.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box className={styles.card}>
        {/* Toolbar */}
        <Box className={styles.toolbar}>
          <Box className={styles.searchBox}>
            <Search size={18} style={{ color: '#9CA3AF' }} />
            <InputBase
              placeholder="Rechercher une catégorie..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            size="small"
            onClick={() => setShowForm(true)}
            sx={{ bgcolor: '#FF2C2C', '&:hover': { bgcolor: '#B34D00' } }}
          >
            Ajouter
          </Button>
        </Box>

        {/* Table */}
        <Box className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Slug</th>
                <th>Produits</th>
                <th>Sous-catégories</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><Skeleton variant="text" width="80%" /></td>
                    ))}
                  </tr>
                ))
                : categories.map((cat) => (
                  <tr key={cat.id}>
                    {/* Nom */}
                    <td>
                      <Box className={styles.userCell}>
                        <Avatar
                          src={cat.image ?? undefined}
                          variant="rounded"
                          sx={{ width: 40, height: 40, bgcolor: 'rgba(255, 44, 44,0.1)', color: '#FF2C2C', fontSize: 18 }}
                        >
                          {cat.icon ?? <FolderTree size={18} />}
                        </Avatar>
                        <Typography className={styles.userCellName}>{cat.name}</Typography>
                      </Box>
                    </td>

                    {/* Slug */}
                    <td>
                      <Chip
                        label={cat.slug}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: 11 }}
                      />
                    </td>

                    {/* Produits */}
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Package size={13} style={{ color: '#9CA3AF' }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {cat.productCount}
                        </Typography>
                      </Box>
                    </td>

                    {/* Sous-catégories */}
                    <td style={{ fontSize: 13, color: '#6B7280' }}>
                      {cat.subCategoryCount > 0
                        ? <Chip label={cat.subCategoryCount} size="small" sx={{ bgcolor: '#F3F4F6', fontSize: 11 }} />
                        : <Typography sx={{ fontSize: 12, color: '#D1D5DB' }}>—</Typography>
                      }
                    </td>

                    {/* Toggle actif */}
                    <td>
                      <Switch
                        checked={cat.isActive}
                        size="small"
                        onChange={() => handleToggle(cat)}
                        disabled={toggleActive.isPending}
                        color="success"
                      />
                    </td>

                    {/* Actions */}
                    <td>
                      <Box className={styles.actionsCell}>
                        <Tooltip title="Modifier">
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => setEditTarget(cat)}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            className={styles.actionBtn}
                            sx={{ color: '#EF4444' }}
                            onClick={() => setDeleteTarget(cat)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Box>

        {meta && (
          <Box className={styles.pagination}>
            <Typography className={styles.paginationInfo}>
              {meta.total} catégorie{meta.total !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
