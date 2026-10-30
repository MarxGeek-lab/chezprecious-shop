'use client';

// ==============================================
// PAGE MES ADRESSES - DASHBOARD UTILISATEUR
// ==============================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Skeleton,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/app/hooks/useAddresses';
import type { ApiAddress, CreateAddressPayload } from '@/app/lib/api';
import styles from '../account.module.scss';

const emptyForm = (): CreateAddressPayload => ({
  label: '',
  fullName: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: 'Bénin',
  isDefault: false,
});

export default function AddressesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ApiAddress | null>(null);
  const [form, setForm] = useState<CreateAddressPayload>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<ApiAddress | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const addresses = data?.addresses ?? [];

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleOpen = (address?: ApiAddress) => {
    if (address) {
      setEditingAddress(address);
      setForm({
        label: address.label,
        fullName: address.fullName,
        phone: address.phone || '',
        street: address.street,
        city: address.city,
        postalCode: address.postalCode || '',
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setForm(emptyForm());
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingAddress(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        phone: form.phone || undefined,
        postalCode: form.postalCode || undefined,
      };
      if (editingAddress) {
        await updateAddress.mutateAsync({ id: editingAddress.id, data: payload });
        showAlert('success', 'Adresse mise à jour avec succès !');
      } else {
        await createAddress.mutateAsync(payload);
        showAlert('success', 'Adresse ajoutée avec succès !');
      }
      handleClose();
    } catch {
      showAlert('error', 'Erreur lors de la sauvegarde de l\'adresse.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAddress.mutateAsync(deleteTarget.id);
      showAlert('success', 'Adresse supprimée.');
      setDeleteTarget(null);
    } catch {
      showAlert('error', 'Erreur lors de la suppression.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
    } catch {
      showAlert('error', 'Erreur lors de la mise à jour.');
    }
  };

  const field = (key: keyof CreateAddressPayload) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const isSaving = createAddress.isPending || updateAddress.isPending;
  const canSave = form.label && form.fullName && form.street && form.city;

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Mes adresses</Typography>
          <Typography>Gérez vos adresses de livraison</Typography>
        </Box>
        <Box className={styles.pageActions}>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            className={styles.primaryButton}
            onClick={() => handleOpen()}
          >
            Nouvelle adresse
          </Button>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : (
        <Box className={styles.addressesGrid}>
          {addresses.map((address) => (
            <Box
              key={address.id}
              className={`${styles.addressCard} ${address.isDefault ? styles.defaultAddress : ''}`}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapPin size={18} />
                  <Typography className={styles.addressName}>{address.label}</Typography>
                </Box>
                {address.isDefault && (
                  <Chip label="Par défaut" size="small" color="primary" variant="outlined" />
                )}
              </Box>

              <Typography className={styles.addressLine}>{address.fullName}</Typography>
              <Typography className={styles.addressLine}>{address.street}</Typography>
              <Typography className={styles.addressLine}>
                {address.postalCode ? `${address.postalCode} ` : ''}{address.city}
              </Typography>
              <Typography className={styles.addressLine}>{address.country}</Typography>
              {address.phone && (
                <Typography className={styles.addressLine} sx={{ mt: 1 }}>
                  {address.phone}
                </Typography>
              )}

              <Box className={styles.addressActions}>
                <Tooltip title="Modifier">
                  <IconButton size="small" onClick={() => handleOpen(address)}>
                    <Edit size={18} />
                  </IconButton>
                </Tooltip>
                {!address.isDefault && (
                  <Tooltip title="Définir par défaut">
                    <IconButton
                      size="small"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={setDefault.isPending}
                    >
                      <Star size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                {!address.isDefault && (
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(address)}
                      sx={{ color: 'error.main' }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          ))}

          {/* Add Card */}
          <Box className={styles.addAddressCard} onClick={() => handleOpen()}>
            <Plus size={32} />
            <Typography variant="body2" color="text.secondary">
              Ajouter une adresse
            </Typography>
          </Box>
        </Box>
      )}

      {/* Dialog créer / modifier */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Libellé (ex: Domicile, Bureau)" required {...field('label')} />
            <TextField fullWidth label="Nom complet du destinataire" required {...field('fullName')} />
            <TextField fullWidth label="Adresse (rue)" required {...field('street')} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField fullWidth label="Code postal" sx={{ flex: { xs: '1 1 100%', sm: 1 } }} {...field('postalCode')} />
              <TextField fullWidth label="Ville" required sx={{ flex: { xs: '1 1 100%', sm: 1 } }} {...field('city')} />
            </Box>
            <TextField fullWidth label="Pays" {...field('country')} />
            <TextField fullWidth label="Téléphone" {...field('phone')} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
              }
              label="Définir comme adresse par défaut"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSaving}>Annuler</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!canSave || isSaving}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {editingAddress ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog suppression */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer cette adresse ?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            L'adresse <strong>{deleteTarget?.label}</strong> ({deleteTarget?.street}, {deleteTarget?.city}) sera définitivement supprimée.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteAddress.isPending}
            startIcon={deleteAddress.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
