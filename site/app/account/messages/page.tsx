'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Send, MessageSquare, Clock } from 'lucide-react';
import {
  useCustomerThread,
  useCustomerSendMessage,
} from '@/app/hooks/useMessages';
import styles from '../account.module.scss';

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Hier';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function CustomerMessagesPage() {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threadData, isLoading } = useCustomerThread();
  const threadMessages = threadData?.messages ?? [];
  const sendMessage = useCustomerSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  async function handleSend() {
    const body = messageText.trim();
    if (!body) return;
    setMessageText('');
    await sendMessage.mutateAsync({ body });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: 2 }}>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Messages</Typography>
          <Typography>Votre conversation avec le service client</Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E5E7EB',
          borderRadius: 3,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAFA',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#FFF7ED', color: '#D45D00', width: 40, height: 40, fontWeight: 700 }}>
              SC
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                Service Client
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                Chez Precious — Réponse sous 24h
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<Clock size={12} />}
            label="Notifié par email"
            size="small"
            variant="outlined"
            sx={{ fontSize: 11, color: '#6B7280', borderColor: '#E5E7EB' }}
          />
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            background: '#FAFAFA',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
              <CircularProgress size={28} sx={{ color: '#D45D00' }} />
            </Box>
          ) : threadMessages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <MessageSquare size={40} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
              <Typography variant="body2">Aucun message</Typography>
              <Typography variant="caption" color="text.secondary">
                Envoyez votre premier message au service client
              </Typography>
            </Box>
          ) : (
            threadMessages.map((msg: any) => {
              const isOwn = msg.senderRole === 'user';
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}
                >
                  {!isOwn && (
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: '#FFF7ED',
                        color: '#D45D00',
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      SC
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '70%',
                      px: 2,
                      py: 1,
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: isOwn ? '#D45D00' : 'white',
                      border: isOwn ? 'none' : '1px solid #E5E7EB',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: isOwn ? 'white' : '#111827', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {msg.body}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: isOwn ? 'rgba(255,255,255,0.7)' : '#9CA3AF', mt: 0.5, textAlign: 'right' }}>
                      {formatRelative(msg.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: 1,
            background: 'white',
          }}
        >
          <TextField
            fullWidth
            placeholder="Écrivez votre message… (Entrée pour envoyer)"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            multiline
            maxRows={4}
            variant="outlined"
            size="small"
            disabled={sendMessage.isPending}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            sx={{
              minWidth: 44,
              width: 44,
              height: 40,
              p: 0,
              bgcolor: '#D45D00',
              alignSelf: 'flex-end',
              borderRadius: 2,
              '&:hover': { bgcolor: '#B34D00' },
              '&:disabled': { bgcolor: '#E5E7EB' },
              flexShrink: 0,
            }}
          >
            {sendMessage.isPending ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
