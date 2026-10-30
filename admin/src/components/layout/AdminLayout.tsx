'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AdminLayout.module.scss';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box className={styles.layout}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box className={styles.main}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Box className={styles.content}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
