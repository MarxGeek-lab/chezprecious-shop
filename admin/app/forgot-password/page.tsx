'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, InputAdornment,
} from '@mui/material';
import { Mail, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { useRequestPasswordReset } from '@/src/hooks/useTeam';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const resetMutation = useRequestPasswordReset();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetMutation.mutate(email, {
      onSuccess: () => setSent(true),
    });
  };

  if (sent) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid #E5E7EB', textAlign: 'center' }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <CheckCircle size={28} color="#10B981" />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Email envoyé</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            Si un compte administrateur existe avec l&apos;adresse <strong>{email}</strong>, un lien de réinitialisation a été envoyé.
          </Typography>
          <Button fullWidth variant="outlined" onClick={() => router.push('/login')}
            sx={{ py: 1.2, borderColor: '#E5E7EB', color: '#6B7280', textTransform: 'none', fontWeight: 600 }}>
            Retour à la connexion
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <ShieldCheck size={28} color="#D45D00" />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#1A1A2E' }}>
            Mot de passe oublié
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Mail size={18} color="#9CA3AF" /></InputAdornment>,
            }}
          />
          <Button type="submit" fullWidth variant="contained" disabled={resetMutation.isPending || !email}
            sx={{ py: 1.5, bgcolor: '#D45D00', '&:hover': { bgcolor: '#A34800' }, fontSize: 15, fontWeight: 600, mb: 2 }}>
            {resetMutation.isPending ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Envoyer le lien'}
          </Button>
        </form>

        <Button fullWidth startIcon={<ArrowLeft size={16} />} onClick={() => router.push('/login')}
          sx={{ textTransform: 'none', color: '#6B7280', fontSize: 14 }}>
          Retour à la connexion
        </Button>
      </Paper>
    </Box>
  );
}
