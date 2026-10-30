'use client';

// ==============================================
// SNACKBAR CONTEXT — Notifications globales
// ==============================================

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

// ─── Types ──────────────────────────────────────

interface SnackbarMessage {
  id: number;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface SnackbarContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError:   (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo:    (message: string, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// ─── Slide transition ────────────────────────────

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

// ─── Provider ───────────────────────────────────

let counter = 0;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SnackbarMessage[]>([]);

  const push = useCallback((message: string, severity: AlertColor, duration = 3500) => {
    const id = ++counter;
    setQueue((prev) => [...prev, { id, message, severity, duration }]);
  }, []);

  const handleClose = useCallback((id: number) => {
    setQueue((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const showSuccess = useCallback((msg: string, d?: number) => push(msg, 'success', d), [push]);
  const showError   = useCallback((msg: string, d?: number) => push(msg, 'error', d ?? 5000), [push]);
  const showWarning = useCallback((msg: string, d?: number) => push(msg, 'warning', d), [push]);
  const showInfo    = useCallback((msg: string, d?: number) => push(msg, 'info', d), [push]);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}

      {/* Affichage des snackbars empilées (max 3 visibles) */}
      {queue.slice(0, 3).map((item, index) => (
        <Snackbar
          key={item.id}
          open
          autoHideDuration={item.duration}
          onClose={() => handleClose(item.id)}
          TransitionComponent={SlideUp}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: `${24 + index * 72}px !important` }}
        >
          <Alert
            onClose={() => handleClose(item.id)}
            severity={item.severity}
            variant="filled"
            sx={{
              minWidth: 300,
              maxWidth: 480,
              fontWeight: 500,
              fontSize: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              borderRadius: 2,
              '& .MuiAlert-icon': { fontSize: 20 },
            }}
          >
            {item.message}
          </Alert>
        </Snackbar>
      ))}
    </SnackbarContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar doit être utilisé dans SnackbarProvider');
  return ctx;
}
