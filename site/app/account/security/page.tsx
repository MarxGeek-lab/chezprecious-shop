'use client';

// ==============================================
// PAGE SÉCURITÉ - DASHBOARD UTILISATEUR
// ==============================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Eye,
  EyeOff,
  Key,
  Clock,
  Shield,
} from 'lucide-react';
import { useUpdateUserPassword } from '@/app/hooks/useUser';
import { useAuth } from '@/app/context/AuthContext';
import styles from '../account.module.scss';

export default function SecurityPage() {
  const { user } = useAuth();
  const updatePassword = useUpdateUserPassword();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  const passwordsMatch = confirmPassword === '' || confirmPassword === newPassword;
  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const newPasswordWeak = newPassword.length >= 8 && !complexityRegex.test(newPassword);
  const isSameAsCurrentWarning = newPassword.length > 0 && newPassword === currentPassword;
  const canSubmit =
    currentPassword &&
    newPassword.length >= 8 &&
    complexityRegex.test(newPassword) &&
    newPassword !== currentPassword &&
    confirmPassword === newPassword;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword === currentPassword) {
      setAlert({ type: 'error', message: 'Le nouveau mot de passe doit être différent de l\'actuel.' });
      return;
    }
    try {
      await updatePassword.mutateAsync({ currentPassword, newPassword });
      setAlert({ type: 'success', message: 'Mot de passe mis à jour. Vous allez être déconnecté...' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.';
      setAlert({ type: 'error', message: msg });
    }
  };

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Sécurité</Typography>
          <Typography>Protégez votre compte</Typography>
        </Box>
      </Box>

      <Snackbar
        open={!!alert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setAlert(null)}
        autoHideDuration={alert?.type === 'success' ? null : 5000}
      >
        <Alert severity={alert?.type} onClose={() => setAlert(null)} sx={{ minWidth: 320 }}>
          {alert?.message}
        </Alert>
      </Snackbar>

      {/* Account Info */}
      <Paper className={styles.card} sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Shield size={20} />
            <Typography className={styles.sectionTitle} sx={{ mb: '0 !important' }}>
              Informations du compte
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Email :</strong> {user?.email}
            </Typography>
            <Typography variant="body2">
              <strong>Email vérifié :</strong>{' '}
              {user?.isEmailVerified ? (
                <span style={{ color: '#10B981' }}>Oui</span>
              ) : (
                <span style={{ color: '#EF4444' }}>Non</span>
              )}
            </Typography>
            <Typography variant="body2">
              <strong>Compte actif :</strong>{' '}
              {user?.isActive ? (
                <span style={{ color: '#10B981' }}>Oui</span>
              ) : (
                <span style={{ color: '#EF4444' }}>Non</span>
              )}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Change Password */}
      <Paper className={styles.card} sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Box className={styles.formSection}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Key size={20} />
              <Typography className={styles.sectionTitle} sx={{ mb: '0 !important' }}>
                Changer le mot de passe
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 500 }}>
              <TextField
                fullWidth
                label="Mot de passe actuel"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end">
                          {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Nouveau mot de passe"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={newPasswordTooShort || newPasswordWeak || isSameAsCurrentWarning}
                helperText={
                  isSameAsCurrentWarning
                    ? 'Doit être différent du mot de passe actuel'
                    : newPasswordTooShort
                    ? 'Minimum 8 caractères'
                    : newPasswordWeak
                    ? 'Doit contenir une majuscule, une minuscule et un chiffre'
                    : 'Minimum 8 car. avec majuscule, minuscule et chiffre'
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew(!showNew)} edge="end">
                          {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirmer le nouveau mot de passe"
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!passwordsMatch}
                helperText={!passwordsMatch ? 'Les mots de passe ne correspondent pas' : ''}
              />
              <Box>
                <Button
                  variant="contained"
                  className={styles.primaryButton}
                  onClick={handleChangePassword}
                  disabled={!canSubmit || updatePassword.isPending}
                  startIcon={updatePassword.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  {updatePassword.isPending ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Security Tips */}
      <Paper className={styles.card}>
        <Box className={styles.cardHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={20} />
            <Typography className={styles.cardTitle}>Conseils de sécurité</Typography>
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          {[
            'Utilisez un mot de passe unique pour chaque site',
            'Votre mot de passe doit contenir au moins 8 caractères',
            'Mélangez lettres majuscules, minuscules, chiffres et symboles',
            'Ne partagez jamais votre mot de passe avec qui que ce soit',
            'Changez votre mot de passe régulièrement',
          ].map((tip, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#0F5C4A',
                    mt: 0.8,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" color="text.secondary">{tip}</Typography>
              </Box>
              {index < 4 && <Divider />}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
