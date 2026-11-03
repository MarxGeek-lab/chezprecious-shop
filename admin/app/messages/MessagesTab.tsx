'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Avatar, InputBase, IconButton, CircularProgress, Tooltip, Chip,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  MessageSquare, Search, Send, RefreshCw, Clock, Users, Inbox, Store, ArrowLeft,
} from 'lucide-react';
import {
  useAdminConversations,
  useAdminMessageStats,
  useAdminMessageThread,
  useAdminSendMessage,
  AdminConversation,
} from '@/src/hooks/useAdminData';
import { useAdminAuth } from '@/src/context/AdminAuthContext';

// ── Helpers ─────────────────────────────────────

function fmtTime(d: string) {
  const date = new Date(d);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000)     return 'À l\'instant';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * 86_400_000) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

// ── User avatar ──────────────────────────────────

function UserAvatar({
  src, name, email, size = 40, radius = '50%',
}: { src?: string | null; name: string | null; email: string; size?: number; radius?: string }) {
  const initials = getInitials(name, email);
  if (src) {
    return (
      <Avatar
        src={src}
        sx={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <Avatar
      sx={{
        width: size, height: size, borderRadius: radius,
        bgcolor: 'rgba(15, 92, 74, 0.15)', color: '#0F5C4A',
        fontSize: size * 0.38, fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  );
}

// ── Conversation list item ───────────────────────

function ConvItem({ conv, active, onClick }: {
  conv: AdminConversation; active: boolean; onClick: () => void;
}) {
  const { user } = conv;
  const displayName = user.fullName ?? user.email;
  const isSeller = user.role === 'SELLER';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: 1.5, cursor: 'pointer',
        bgcolor: active ? 'rgba(15, 92, 74, 0.06)' : 'transparent',
        borderLeft: active ? '3px solid #0F5C4A' : '3px solid transparent',
        transition: 'all 0.15s',
        '&:hover': { bgcolor: active ? 'rgba(15, 92, 74, 0.06)' : '#F9FAFB' },
      }}
    >
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar src={user.avatar} name={user.fullName} email={user.email} size={42} />
        {/* Role badge */}
        <Box sx={{
          position: 'absolute', bottom: -2, right: -2,
          width: 16, height: 16, borderRadius: '50%',
          bgcolor: isSeller ? '#0F5C4A' : '#6366F1',
          border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isSeller
            ? <Store size={8} color="#fff" />
            : <Users size={8} color="#fff" />}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
          <Typography sx={{ fontWeight: conv.unreadByAdmin > 0 ? 700 : 500, fontSize: 13, color: '#111827' }} noWrap>
            {displayName}
          </Typography>
          {conv.lastMessageAt && (
            <Typography sx={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, ml: 1 }}>
              {fmtTime(conv.lastMessageAt)}
            </Typography>
          )}
        </Box>
        {isSeller && user.store && (
          <Typography sx={{ fontSize: 11, color: '#0F5C4A', fontWeight: 500 }} noWrap>
            🏪 {user.store.name}
          </Typography>
        )}
        {!isSeller && (
          <Typography sx={{ fontSize: 11, color: '#6B7280' }} noWrap>
            {user.email}
          </Typography>
        )}
        <Typography sx={{ fontSize: 12, color: '#9CA3AF', mt: 0.2 }} noWrap>
          {conv.lastMessage
            ? <>{conv.senderRole === 'admin' ? 'Vous : ' : ''}{conv.lastMessage}</>
            : <span style={{ fontStyle: 'italic' }}>Aucun message</span>
          }
        </Typography>
      </Box>

      {conv.unreadByAdmin > 0 && (
        <Box sx={{
          minWidth: 20, height: 20, borderRadius: '50%', bgcolor: '#0F5C4A',
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {conv.unreadByAdmin}
        </Box>
      )}
    </Box>
  );
}

// ── Chat panel ───────────────────────────────────

function ChatPanel({
  userId, onRefetchList, onBack, showBack,
}: {
  userId: string; onRefetchList: () => void; onBack?: () => void; showBack?: boolean;
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { admin } = useAdminAuth();
  const sendMut = useAdminSendMessage();

  const { data, isLoading, refetch } = useAdminMessageThread(userId);
  const messages  = data?.data?.messages ?? [];
  const chatUser  = data?.data?.user;
  const isSeller  = chatUser?.role === 'SELLER';
  const displayName = chatUser?.fullName ?? chatUser?.email ?? '…';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => { setText(''); }, [userId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sendMut.isPending) return;
    setText('');
    try {
      await sendMut.mutateAsync({ userId, body: trimmed });
      refetch();
      onRefetchList();
    } catch {
      setText(trimmed);
    }
  }, [text, sendMut, userId, refetch, onRefetchList]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showBack && (
            <IconButton size="small" onClick={onBack} sx={{ mr: 0.5 }}>
              <ArrowLeft size={18} />
            </IconButton>
          )}
          {chatUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <UserAvatar src={chatUser.avatar} name={chatUser.fullName} email={chatUser.email} size={38} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                    {displayName}
                  </Typography>
                  <Chip
                    label={isSeller ? 'Vendeur' : 'Client'}
                    size="small"
                    sx={{
                      fontSize: 10, height: 18,
                      bgcolor: isSeller ? 'rgba(15, 92, 74, 0.1)' : 'rgba(99,102,241,0.1)',
                      color:   isSeller ? '#0F5C4A' : '#6366F1',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                  {chatUser.email}
                  {isSeller && chatUser.store ? ` · ${chatUser.store.name}` : ''}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box />
          )}
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton size="small" onClick={() => refetch()}><RefreshCw size={15} /></IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box sx={{
        flex: 1, overflowY: 'auto', px: 2.5, py: 2,
        display: 'flex', flexDirection: 'column', gap: 1.5,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#E5E7EB', borderRadius: 4 },
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#0F5C4A' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: '#9CA3AF' }}>
            <MessageSquare size={44} opacity={0.25} />
            <Typography sx={{ fontSize: 13 }}>Aucun message — commencez la conversation !</Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.senderRole === 'admin';
            return (
              <Box key={msg.id} sx={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 1 }}>
                {/* Avatar utilisateur à gauche */}
                {!isAdmin && chatUser && (
                  <UserAvatar src={chatUser.avatar} name={chatUser.fullName} email={chatUser.email} size={28} />
                )}

                <Box sx={{ maxWidth: '72%' }}>
                  <Box sx={{
                    px: 1.5, py: 1, borderRadius: '14px',
                    bgcolor: isAdmin ? '#0F5C4A' : '#F3F4F6',
                    color: isAdmin ? '#fff' : '#111827',
                    borderBottomRightRadius: isAdmin ? 4 : 14,
                    borderBottomLeftRadius: isAdmin ? 14 : 4,
                  }}>
                    <Typography sx={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.body}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10, color: '#9CA3AF', mt: 0.3, textAlign: isAdmin ? 'right' : 'left', px: 0.5 }}>
                    {fmtTime(msg.createdAt)}
                    {isAdmin && <span style={{ marginLeft: 4 }}>{msg.isReadByUser ? '✓✓' : '✓'}</span>}
                  </Typography>
                </Box>

                {/* Avatar admin à droite */}
                {isAdmin && admin && (
                  <UserAvatar src={admin.avatar} name={admin.fullName} email={admin.email} size={28} />
                )}
              </Box>
            );
          })
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, px: 2, py: 1.5, borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
        <InputBase
          multiline maxRows={4}
          placeholder={`Écrire à ${displayName}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            flex: 1, bgcolor: '#F3F4F6', borderRadius: '12px',
            px: 2, py: 1, fontSize: 13.5,
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!text.trim() || sendMut.isPending}
          sx={{
            bgcolor: '#0F5C4A', color: '#fff', width: 40, height: 40, flexShrink: 0,
            '&:hover': { bgcolor: '#0A4638' },
            '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
          }}
        >
          {sendMut.isPending
            ? <CircularProgress size={16} sx={{ color: '#fff' }} />
            : <Send size={17} />}
        </IconButton>
      </Box>
    </Box>
  );
}

// ── Contacts list panel ──────────────────────────

function ContactsPanel({
  conversations, isLoading, activeUserId, search, page, meta,
  onSelect, onSearch, onPageChange, onRefetch,
}: {
  conversations: AdminConversation[];
  isLoading: boolean;
  activeUserId: string | null;
  search: string;
  page: number;
  meta: { totalPages: number } | undefined;
  onSelect: (id: string) => void;
  onSearch: (v: string) => void;
  onPageChange: (p: number) => void;
  onRefetch: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Search */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F3F4F6', borderRadius: '10px', px: 1.5, py: 0.8, flex: 1 }}>
          <Search size={14} color="#9CA3AF" />
          <InputBase
            placeholder="Rechercher un contact…"
            value={search}
            onChange={(e) => { onSearch(e.target.value); onPageChange(1); }}
            sx={{ flex: 1, fontSize: 13 }}
          />
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton size="small" onClick={onRefetch}><RefreshCw size={15} /></IconButton>
        </Tooltip>
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#E5E7EB', borderRadius: 4 },
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#0F5C4A' }} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1, color: '#9CA3AF' }}>
            <MessageSquare size={36} opacity={0.3} />
            <Typography sx={{ fontSize: 13 }}>Aucune conversation</Typography>
          </Box>
        ) : (
          conversations.map((conv) => (
            <ConvItem
              key={conv.userId}
              conv={conv}
              active={activeUserId === conv.userId}
              onClick={() => onSelect(conv.userId)}
            />
          ))
        )}
      </Box>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1, borderTop: '1px solid #F3F4F6' }}>
          <IconButton size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <Typography sx={{ fontSize: 18, lineHeight: 1 }}>‹</Typography>
          </IconButton>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{page} / {meta.totalPages}</Typography>
          <IconButton size="small" disabled={page >= meta.totalPages} onClick={() => onPageChange(page + 1)}>
            <Typography sx={{ fontSize: 18, lineHeight: 1 }}>›</Typography>
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

// ── Main tab ─────────────────────────────────────

export default function MessagesTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDeb]   = useState('');
  const [page, setPage]             = useState(1);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    const t = setTimeout(() => setDeb(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: statsData } = useAdminMessageStats();
  const stats = statsData?.data;

  const { data, isLoading, refetch } = useAdminConversations({
    search: debouncedSearch || undefined,
    page,
    limit: 30,
  });
  const conversations = data?.data?.conversations ?? [];
  const meta          = data?.data?.meta;

  // Default to first conversation with message on desktop only
  useEffect(() => {
    if (conversations.length > 0 && !activeUserId && !isMobile) {
      const withMsg = conversations.find((c) => c.lastMessage !== null);
      setActiveUserId((withMsg ?? conversations[0]).userId);
    }
  }, [conversations, activeUserId, isMobile]);

  const handleSelectConv = (userId: string) => {
    setActiveUserId(userId);
    if (isMobile) setMobilePanel('chat');
  };

  const kpis = [
    { icon: MessageSquare, label: 'Total messages',    value: stats?.totalMessages      ?? '—', color: '#0F5C4A', bg: 'rgba(15, 92, 74, 0.1)'   },
    { icon: Users,         label: 'Conversations',     value: stats?.totalConversations ?? '—', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
    { icon: Inbox,         label: 'Non lus',           value: stats?.unreadByAdmin      ?? '—', color: '#D97706', bg: 'rgba(245,158,11,0.1)' },
    { icon: Clock,         label: 'Temps de réponse',  value: '< 5 min',                       color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* KPI strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {kpis.map((k) => (
          <Box key={k.label} sx={{
            bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
            p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <k.icon size={20} color={k.color} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {k.label}
              </Typography>
              <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                {k.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Chat layout */}
      <Box sx={{
        bgcolor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex', height: { xs: 'calc(100vh - 280px)', md: '68vh' },
        minHeight: { xs: 400, md: 500 },
        overflow: 'hidden',
      }}>
        {isMobile ? (
          // Mobile: show one panel at a time
          mobilePanel === 'list' ? (
            <ContactsPanel
              conversations={conversations}
              isLoading={isLoading}
              activeUserId={activeUserId}
              search={search}
              page={page}
              meta={meta}
              onSelect={handleSelectConv}
              onSearch={setSearch}
              onPageChange={setPage}
              onRefetch={refetch}
            />
          ) : (
            activeUserId ? (
              <ChatPanel
                userId={activeUserId}
                onRefetchList={refetch}
                showBack
                onBack={() => setMobilePanel('list')}
              />
            ) : null
          )
        ) : (
          // Desktop: side-by-side
          <>
            {/* Left — contacts */}
            <Box sx={{ width: 320, borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <ContactsPanel
                conversations={conversations}
                isLoading={isLoading}
                activeUserId={activeUserId}
                search={search}
                page={page}
                meta={meta}
                onSelect={handleSelectConv}
                onSearch={setSearch}
                onPageChange={setPage}
                onRefetch={refetch}
              />
            </Box>

            {/* Right — chat */}
            {activeUserId ? (
              <ChatPanel userId={activeUserId} onRefetchList={refetch} />
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#9CA3AF' }}>
                <MessageSquare size={56} opacity={0.2} />
                <Typography sx={{ fontSize: 15, fontWeight: 500 }}>Sélectionnez un contact</Typography>
                <Typography sx={{ fontSize: 13 }}>Cliquez sur un utilisateur pour démarrer ou continuer une conversation</Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
