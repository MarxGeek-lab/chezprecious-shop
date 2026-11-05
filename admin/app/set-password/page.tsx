'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useVerifyToken, useSetPassword } from '@/src/hooks/useTeam';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const verifyToken = useVerifyToken();
  const setPasswordMutation = useSetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!token) return;
    verifyToken.mutate(token, {
      onSuccess: (data) => {
        setEmail(data.email || '');
        setFullName(data.fullName || '');
      },
      onError: () => {
        setError('Ce lien est invalide ou a expiré.');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
        <Alert severity="error">Aucun token fourni. Vérifiez votre lien.</Alert>
      </Box>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setPasswordMutation.mutate(
      { token, password },
      {
        onSuccess: () => setSuccess(true),
        onError: () => setError('Erreur lors de la définition du mot de passe. Le lien a peut-être expiré.'),
      },
    );
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid #E5E7EB', textAlign: 'center' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <CheckCircle size={28} color="#10B981" />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Mot de passe défini</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.
          </Typography>
          <Button fullWidth variant="contained" onClick={() => router.push('/login')}
            sx={{ py: 1.5, bgcolor: '#0F5C4A', '&:hover': { bgcolor: '#0A4638' }, fontWeight: 600 }}>
            Se connecter
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box component="img" src="/logo.png" alt="Golden Precious" sx={{ display: 'block', height: 64, width: 'auto', mx: 'auto', mb: 3 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: '#1A1A2E' }}>
            Définir votre mot de passe
          </Typography>
          {email && (
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
              {fullName ? `Bienvenue ${fullName} !` : email}
            </Typography>
          )}
        </Box>

        {verifyToken.isPending && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#0F5C4A' }} size={36} />
            <Typography sx={{ color: '#6B7280', fontSize: 14, mt: 2 }}>Vérification du lien...</Typography>
          </Box>
        )}

        {verifyToken.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Ce lien est invalide ou a expiré. Veuillez contacter un administrateur.
          </Alert>
        )}

        {verifyToken.isSuccess && (
          <>
            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Nouveau mot de passe" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock size={18} color="#9CA3AF" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth label="Confirmer le mot de passe" type={showPassword ? 'text' : 'password'}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock size={18} color="#9CA3AF" /></InputAdornment>,
                }}
              />
              <Button type="submit" fullWidth variant="contained" disabled={setPasswordMutation.isPending}
                sx={{ py: 1.5, bgcolor: '#0F5C4A', '&:hover': { bgcolor: '#0A4638' }, fontSize: 15, fontWeight: 600 }}>
                {setPasswordMutation.isPending ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Définir le mot de passe'}
              </Button>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5' }}>
        <CircularProgress sx={{ color: '#0F5C4A' }} />
      </Box>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
