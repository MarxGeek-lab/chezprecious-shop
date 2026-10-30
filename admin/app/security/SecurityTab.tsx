'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Switch, Tabs, Tab, LinearProgress, Pagination,
  CircularProgress, Button, Snackbar, Alert,
} from '@mui/material';
import {
  Shield, Lock, Key, AlertTriangle, CheckCircle,
  Globe, Clock, UserX, Activity, Monitor, Fingerprint,
  ShieldCheck, ShieldAlert, Save,
} from 'lucide-react';
import { useActivityLogs, useSecurityStats } from '@/src/hooks/useAdminData';
import { useSettings, useUpdateSecurity } from '@/src/hooks/useSettings';
import styles from '@/src/styles/pages.module.scss';

const ACTION_STATUS: Record<string, { color: string; icon: React.ElementType }> = {
  LOGIN:                { color: '#10B981', icon: CheckCircle },
  DELETE_USER:          { color: '#EF4444', icon: AlertTriangle },
  DELETE_PRODUCT:       { color: '#EF4444', icon: AlertTriangle },
  DELETE_ADMIN:         { color: '#EF4444', icon: AlertTriangle },
  DELETE_CATEGORY:      { color: '#EF4444', icon: AlertTriangle },
  REJECT_SELLER:        { color: '#EF4444', icon: AlertTriangle },
  REJECT_BOOST:         { color: '#EF4444', icon: AlertTriangle },
  TOGGLE_USER_ACTIVE:   { color: '#F59E0B', icon: ShieldAlert },
  TOGGLE_SELLER_ACTIVE: { color: '#F59E0B', icon: ShieldAlert },
  TOGGLE_ADMIN_ACTIVE:  { color: '#F59E0B', icon: ShieldAlert },
  UPDATE_SETTINGS:      { color: '#3B82F6', icon: Activity },
  UPDATE_USER:          { color: '#3B82F6', icon: Activity },
  UPDATE_PRODUCT_STATUS:{ color: '#3B82F6', icon: Activity },
  APPROVE_SELLER:       { color: '#10B981', icon: CheckCircle },
  APPROVE_BOOST:        { color: '#10B981', icon: CheckCircle },
  INVITE_ADMIN:         { color: '#8B5CF6', icon: Monitor },
  SEND_MESSAGE:         { color: '#8B5CF6', icon: Monitor },
};

function getActionStatus(action: string) {
  return ACTION_STATUS[action] ?? { color: '#6B7280', icon: Activity };
}

export default function SecurityTab() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const { data: siteSettings, isLoading: settingsLoading } = useSettings();
  const updateSecurity = useUpdateSecurity();

  const [require2fa,        setRequire2fa]        = useState(false);
  const [lockAfterAttempts, setLockAfterAttempts] = useState(true);
  const [sessionTimeout,    setSessionTimeout]    = useState(true);
  const [ipRestriction,     setIpRestriction]     = useState(false);
  const [advancedLogging,   setAdvancedLogging]   = useState(true);
  const [bruteForceProtect, setBruteForceProtect] = useState(true);

  useEffect(() => {
    if (!siteSettings) return;
    setRequire2fa(siteSettings.require2fa ?? false);
    setLockAfterAttempts(siteSettings.lockAfterAttempts ?? true);
    setSessionTimeout(siteSettings.sessionTimeout ?? true);
    setIpRestriction(siteSettings.ipRestriction ?? false);
    setAdvancedLogging(siteSettings.advancedLogging ?? true);
    setBruteForceProtect(siteSettings.bruteForceProtect ?? true);
  }, [siteSettings]);

  const { data: logsData, isLoading: logsLoading } = useActivityLogs({ page, limit: 15 });
  const { data: secStats } = useSecurityStats();

  const securitySettings = [
    { key: 'require2fa',        label: 'Authentification à deux facteurs (2FA)', description: 'Exiger 2FA pour tous les comptes admin',                       icon: Fingerprint, state: require2fa,        setter: setRequire2fa },
    { key: 'lockAfterAttempts', label: 'Verrouillage après tentatives',          description: 'Verrouiller après 5 tentatives échouées pendant 30 min',       icon: Lock,        state: lockAfterAttempts, setter: setLockAfterAttempts },
    { key: 'sessionTimeout',    label: 'Session timeout',                        description: "Déconnexion automatique après 30 minutes d'inactivité",        icon: Clock,       state: sessionTimeout,    setter: setSessionTimeout },
    // { key: 'ipRestriction',     label: 'Restriction IP',                         description: "Limiter l'accès admin à des IPs spécifiques",                  icon: Globe,       state: ipRestriction,     setter: setIpRestriction },
    // { key: 'advancedLogging',   label: 'Journalisation avancée',                 description: 'Logger toutes les actions admin en détail',                    icon: Activity,    state: advancedLogging,   setter: setAdvancedLogging },
    // { key: 'bruteForceProtect', label: 'Protection anti-brute force',            description: "Rate limiting sur les endpoints d'authentification",           icon: ShieldCheck, state: bruteForceProtect, setter: setBruteForceProtect },
  ];

  const enabledCount = securitySettings.filter((s) => s.state).length;
  const securityScore = Math.round((enabledCount / securitySettings.length) * 100);

  function handleReset() {
    if (!siteSettings) return;
    setRequire2fa(siteSettings.require2fa ?? false);
    setLockAfterAttempts(siteSettings.lockAfterAttempts ?? true);
    setSessionTimeout(siteSettings.sessionTimeout ?? true);
    setIpRestriction(siteSettings.ipRestriction ?? false);
    setAdvancedLogging(siteSettings.advancedLogging ?? true);
    setBruteForceProtect(siteSettings.bruteForceProtect ?? true);
  }

  async function handleSave() {
    try {
      await updateSecurity.mutateAsync({
        require2fa, lockAfterAttempts, sessionTimeout,
        ipRestriction, advancedLogging, bruteForceProtect,
      });
      setSnackbar({ open: true, message: 'Paramètres de sécurité enregistrés', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde', severity: 'error' });
    }
  }

  return (
    <Box>
      <Box className={styles.statsRow}>
        {[
          { icon: Shield,        label: 'Score sécurité',       value: `${securityScore}/100`,                                  color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: AlertTriangle, label: 'Échecs login (24h)',   value: String(secStats?.failedLogins24h ?? '—'),                color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
          { icon: UserX,         label: 'Comptes verrouillés',  value: String(secStats?.lockedAdmins ?? '—'),                   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { icon: Key,           label: '2FA activé',           value: require2fa ? 'Activé' : 'Non',                          color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        ].map((stat) => (
          <Box key={stat.label} className={styles.statCard}>
            <Box className={styles.statIcon} sx={{ bgcolor: stat.bg }}>
              <stat.icon size={20} color={stat.color} />
            </Box>
            <Box>
              <Typography className={styles.statValue}>{stat.value}</Typography>
              <Typography className={styles.statLabel}>{stat.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box className={styles.card}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7B1E3A' }, '& .MuiTabs-indicator': { bgcolor: '#7B1E3A' } }}
        >
          <Tab label="Paramètres" />
          <Tab label="Journal d'activité" />
          <Tab label="Score de sécurité" />
        </Tabs>

        {/* ── TAB 0 : Paramètres ── */}
        {tab === 0 && (
          settingsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#7B1E3A' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {securitySettings.map((setting) => {
                const Icon = setting.icon;
                return (
                  <Box
                    key={setting.key}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2, p: 2,
                      borderRadius: '12px', border: '1px solid #F3F4F6',
                      '&:hover': { bgcolor: '#FAFAFA' },
                    }}
                  >
                    <Box sx={{
                      width: 40, height: 40, minWidth: 40, borderRadius: '10px',
                      bgcolor: setting.state ? 'rgba(16,185,129,0.1)' : '#F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} color={setting.state ? '#10B981' : '#9CA3AF'} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{setting.label}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{setting.description}</Typography>
                    </Box>
                    <Switch
                      checked={setting.state}
                      onChange={() => setting.setter(!setting.state)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10B981' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10B981' },
                      }}
                    />
                  </Box>
                );
              })}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ textTransform: 'none', borderRadius: '10px', borderColor: '#E5E7EB', color: '#6B7280' }}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  startIcon={updateSecurity.isPending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save size={16} />}
                  disabled={updateSecurity.isPending}
                  onClick={handleSave}
                  sx={{ bgcolor: '#7B1E3A', '&:hover': { bgcolor: '#5A1229' }, textTransform: 'none', borderRadius: '10px' }}
                >
                  {updateSecurity.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Box>
            </Box>
          )
        )}

        {/* ── TAB 1 : Journal d'activité ── */}
        {tab === 1 && (
          logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#7B1E3A' }} />
            </Box>
          ) : (
            <>
              <Box className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Admin</th>
                      <th>Rôle</th>
                      <th>Entité</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsData?.data.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>
                          Aucune activité enregistrée
                        </td>
                      </tr>
                    )}
                    {logsData?.data.map((log) => {
                      const { color, icon: StatusIcon } = getActionStatus(log.action);
                      return (
                        <tr key={log.id}>
                          <td>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StatusIcon size={16} color={color} />
                              <Typography sx={{ fontSize: 13 }}>{log.action}</Typography>
                            </Box>
                          </td>
                          <td><Typography sx={{ fontSize: 13 }}>{log.adminEmail ?? '—'}</Typography></td>
                          <td><Typography sx={{ fontSize: 12, color: '#6B7280' }}>{log.adminRole ?? '—'}</Typography></td>
                          <td>
                            <Typography sx={{ fontSize: 13 }}>
                              {log.entity ? `${log.entity}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}` : '—'}
                            </Typography>
                          </td>
                          <td>
                            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                              {new Date(log.createdAt).toLocaleString('fr-FR')}
                            </Typography>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>

              {logsData && logsData.meta.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={logsData.meta.totalPages} page={page}
                    onChange={(_, v) => setPage(v)}
                    shape="rounded"
                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#7B1E3A', color: '#fff' } }}
                  />
                </Box>
              )}
            </>
          )
        )}

        {/* ── TAB 2 : Score de sécurité ── */}
        {tab === 2 && (
          <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
            <Box sx={{
              width: 120, height: 120, borderRadius: '50%', mx: 'auto', mb: 3,
              background: `conic-gradient(#10B981 ${securityScore}%, #F3F4F6 ${securityScore}%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box sx={{
                width: 100, height: 100, borderRadius: '50%', bgcolor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{securityScore}</Typography>
                <Typography sx={{ fontSize: 12, color: '#6B7280' }}>/ 100</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1 }}>
              {securityScore >= 80 ? 'Bon niveau de sécurité' : securityScore >= 50 ? 'Niveau de sécurité moyen' : 'Niveau de sécurité faible'}
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#6B7280', mb: 3 }}>
              {enabledCount} sur {securitySettings.length} protections activées.
            </Typography>

            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {securitySettings.map((s) => (
                <Box key={s.key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: s.state ? '#10B981' : '#EF4444' }}>
                      {s.state ? 'Activé' : 'Désactivé'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate" value={s.state ? 100 : 0}
                    sx={{
                      height: 6, borderRadius: 3, bgcolor: '#F3F4F6',
                      '& .MuiLinearProgress-bar': { bgcolor: s.state ? '#10B981' : '#EF4444', borderRadius: 3 },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
