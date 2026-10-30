'use client';

// ==============================================
// PAGE MON PROFIL - DASHBOARD UTILISATEUR
// ==============================================

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Save, Upload } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useUpdateUserProfile, useUpdateUserAvatar } from '@/app/hooks/useUser';
import api from '@/app/lib/api';
import styles from '../account.module.scss';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api-backend').replace(/\/api$/, '');

function resolveAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  console.log(`${API_BASE}${url}`)
  return `${API_BASE}${url}`;
}

export default function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateUserProfile();
  const updateAvatar = useUpdateUserAvatar();

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ fullName, phone });
      setAlert({ type: 'success', message: 'Vos informations ont été mises à jour avec succès !' });
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la mise à jour du profil.' });
    }
    setTimeout(() => setAlert(null), 4000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post<{ url: string }>('/upload/image', form, {
        headers: { 'Content-Type': undefined },
      });
      await updateAvatar.mutateAsync(data.url);
      setAlert({ type: 'success', message: 'Photo de profil mise à jour !' });
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors du téléchargement de la photo.' });
    } finally {
      setUploadingAvatar(false);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  console.log("User data in ProfilePage:", user); // Debug log to check user data
  const avatarSrc = resolveAvatarUrl(user?.avatar);
  const avatarInitials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Mon profil</Typography>
          <Typography>Gérez vos informations personnelles</Typography>
        </Box>
        <Box className={styles.pageActions}>
          <Button
            variant="contained"
            startIcon={updateProfile.isPending ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            Enregistrer
          </Button>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <Paper className={styles.card}>
        <Box sx={{ p: 3 }}>
          {/* Avatar */}
          <Box className={styles.formSection}>
            <Typography className={styles.sectionTitle}>Photo de profil</Typography>
            <Box className={styles.avatarSection} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <Avatar className={styles.profileAvatar} src={user?.avatar as any}>
                {!avatarSrc && avatarInitials}
              </Avatar>
              <Box>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="outlined"
                  startIcon={uploadingAvatar ? <CircularProgress size={16} /> : <Upload size={18} />}
                  className={styles.outlineButton}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Téléchargement...' : 'Changer la photo'}
                </Button>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  JPG, PNG ou GIF. Max 2MB.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Personal Info */}
          <Box className={styles.formSection}>
            <Typography className={styles.sectionTitle}>Informations personnelles</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 600 }}>
              <TextField
                fullWidth
                label="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
                helperText="L'email ne peut pas être modifié"
              />
              <TextField
                fullWidth
                label="Téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
