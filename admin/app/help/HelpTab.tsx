'use client';

import { useState } from 'react';
import {
  Box, Typography, InputBase, Chip, Accordion, AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  HelpCircle, Search, BookOpen, Video, MessageSquare,
  ChevronDown, ExternalLink, FileText, Users, ShoppingCart,
  CreditCard, Settings, Shield, Package, Truck,
  BarChart3, Mail,
} from 'lucide-react';
import styles from '@/src/styles/pages.module.scss';

const helpCategories = [
  { icon: BookOpen, title: 'Démarrage', description: 'Guide de prise en main rapide', color: '#0F5C4A', bg: 'rgba(15, 92, 74, 0.1)', articles: 8 },
  { icon: Users, title: 'Utilisateurs', description: 'Gestion des comptes et rôles', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', articles: 12 },
  { icon: ShoppingCart, title: 'Commandes', description: 'Traitement et suivi des commandes', color: '#10B981', bg: 'rgba(16,185,129,0.1)', articles: 15 },
  { icon: Package, title: 'Produits', description: 'Catalogue et gestion produits', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', articles: 10 },
  { icon: CreditCard, title: 'Paiements', description: 'Configuration paiements et factures', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', articles: 7 },
  { icon: Truck, title: 'Livraisons', description: 'Transporteurs et expéditions', color: '#EC4899', bg: 'rgba(236,72,153,0.1)', articles: 6 },
  { icon: BarChart3, title: 'Analytiques', description: 'Comprendre vos statistiques', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', articles: 9 },
  { icon: Shield, title: 'Sécurité', description: 'Protection et conformité', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', articles: 11 },
];

const faqs = [
  { question: 'Comment ajouter un nouveau vendeur ?', answer: 'Allez dans l\'onglet "Vendeurs", cliquez sur "Ajouter un vendeur", remplissez le formulaire avec les informations de la boutique (nom, email, description, catégories), puis validez. Le vendeur recevra un email pour finaliser son inscription.' },
  { question: 'Comment gérer un litige de commande ?', answer: 'Dans l\'onglet "Commandes", trouvez la commande concernée et cliquez sur "Voir détails". Utilisez le bouton "Ouvrir un litige" pour initier la procédure. Vous pouvez communiquer avec le vendeur et l\'acheteur via la messagerie intégrée.' },
  { question: 'Comment configurer les méthodes de paiement ?', answer: 'Rendez-vous dans "Paramètres > Paiements". Vous pouvez activer/désactiver les méthodes de paiement (carte bancaire, PayPal, virement), configurer les clés API des providers, et définir les devises acceptées.' },
  { question: 'Comment exporter les données ?', answer: 'Chaque section dispose d\'un bouton "Exporter". Vous pouvez exporter en CSV ou PDF. Pour des rapports détaillés, utilisez l\'onglet "Rapports" qui permet de planifier des exports automatiques.' },
  { question: 'Comment modérer les produits ?', answer: 'Les nouveaux produits sont automatiquement placés en attente de modération si l\'option est activée dans Paramètres. Accédez à "Produits > En attente" pour les examiner, approuver ou rejeter avec un commentaire.' },
  { question: 'Comment activer l\'authentification 2FA ?', answer: 'Dans "Sécurité > Paramètres", activez "Authentification à deux facteurs". Chaque admin devra scanner un QR code avec une application comme Google Authenticator lors de sa prochaine connexion.' },
];

export default function HelpTab() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | false>(false);

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(search.toLowerCase()) ||
    faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Search hero */}
      <Box sx={{
        bgcolor: 'rgba(15, 92, 74, 0.04)', borderRadius: '16px', p: 4, mb: 3,
        textAlign: 'center',
      }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#1A1A2E', mb: 1 }}>
          Comment pouvons-nous vous aider ?
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#6B7280', mb: 3 }}>
          Recherchez dans notre base de connaissances ou parcourez les catégories
        </Typography>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, maxWidth: 500, mx: 'auto',
          bgcolor: '#fff', borderRadius: '14px', px: 2, py: 1.2,
          border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <Search size={20} style={{ color: '#9CA3AF' }} />
          <InputBase
            placeholder="Rechercher un article, une question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: 15 }}
          />
        </Box>
      </Box>

      {/* Categories grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {helpCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Box
              key={cat.title}
              sx={{
                p: 2.5, borderRadius: '14px', border: '1px solid #F3F4F6',
                cursor: 'pointer', transition: 'all 0.2s',
                '&:hover': { borderColor: '#0F5C4A', bgcolor: 'rgba(15, 92, 74, 0.02)', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
              }}
            >
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px', bgcolor: cat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
              }}>
                <Icon size={22} color={cat.color} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.3 }}>{cat.title}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1 }}>{cat.description}</Typography>
              <Chip label={`${cat.articles} articles`} size="small" sx={{ fontSize: 11, height: 22, bgcolor: '#F3F4F6' }} />
            </Box>
          );
        })}
      </Box>

      {/* FAQ */}
      <Box className={styles.card}>
        <Box className={styles.cardHeader}>
          <Typography className={styles.cardTitle}>Questions fréquentes</Typography>
        </Box>

        {filteredFaqs.map((faq, i) => (
          <Accordion
            key={i}
            expanded={expanded === i}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? i : false)}
            sx={{
              boxShadow: 'none', border: '1px solid #F3F4F6', borderRadius: '12px !important',
              mb: 1, '&:before': { display: 'none' },
              '&.Mui-expanded': { borderColor: '#0F5C4A', bgcolor: 'rgba(15, 92, 74, 0.02)' },
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown size={18} />}
              sx={{ fontWeight: 600, fontSize: 14, py: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <HelpCircle size={18} color={expanded === i ? '#0F5C4A' : '#9CA3AF'} />
                {faq.question}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pl: 5.5 }}>
              <Typography sx={{ fontSize: 14, color: '#4B5563', lineHeight: 1.7 }}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Contact */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 3 }}>
        {[
          { icon: Mail, title: 'Email support', desc: 'contact@chezprecious.com', action: 'Envoyer un email', color: '#0F5C4A' },
          { icon: MessageSquare, title: 'Chat en direct', desc: 'Disponible 9h-18h', action: 'Démarrer le chat', color: '#10B981' },
          { icon: FileText, title: 'Documentation', desc: 'Guide complet en ligne', action: 'Consulter', color: '#3B82F6' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Box
              key={item.title}
              className={styles.card}
              sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: item.color } }}
            >
              <Box sx={{
                width: 48, height: 48, borderRadius: '14px', bgcolor: `${item.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5,
              }}>
                <Icon size={24} color={item.color} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.3 }}>{item.title}</Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 1.5 }}>{item.desc}</Typography>
              <Chip
                label={item.action} size="small"
                sx={{ fontWeight: 600, color: item.color, bgcolor: `${item.color}10`, cursor: 'pointer' }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
