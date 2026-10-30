/**
 * exportReport.ts
 * Utilitaire d'export de rapport vendeur — CSV + PDF (print)
 * Zéro dépendance externe.
 */

import type { ApiOrder } from './api';

export interface ExportData {
  period?: string;
  storeName?: string;
  kpis: { label: string; value: string }[];
  orders: ApiOrder[];
  topProducts: { name: string; qty: number; revenue: number; currency: string }[];
  currency: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toCsvRow(cells: string[]): string {
  return cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
}

function fmt(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'En attente',
  PAID:       'Payée',
  PROCESSING: 'En cours',
  SHIPPED:    'Expédiée',
  DELIVERED:  'Livrée',
  CANCELLED:  'Annulée',
};

// ── CSV ──────────────────────────────────────────────────────────────────────

export function exportReportCSV(data: ExportData, filename = 'rapport-vendeur'): void {
  const lines: string[] = [];
  const BOM = '\uFEFF'; // UTF-8 BOM pour Excel

  // En-tête
  lines.push(toCsvRow(['RAPPORT VENDEUR', data.storeName ?? '']));
  if (data.period) lines.push(toCsvRow(['Période', data.period]));
  lines.push(toCsvRow(['Généré le', new Date().toLocaleDateString('fr-FR')]));
  lines.push('');

  // ── KPIs ──
  lines.push(toCsvRow(['INDICATEURS CLÉS', '']));
  lines.push(toCsvRow(['Indicateur', 'Valeur']));
  data.kpis.forEach((k) => lines.push(toCsvRow([k.label, k.value])));
  lines.push('');

  // ── Commandes ──
  lines.push(toCsvRow(['COMMANDES', '', '', '', '', '', '']));
  lines.push(toCsvRow(['N° Commande', 'Client', 'Email', 'Téléphone', 'Statut', 'Total', 'Date']));
  data.orders.forEach((o) =>
    lines.push(
      toCsvRow([
        o.orderNumber,
        `${o.customerFirstName} ${o.customerLastName}`,
        o.customerEmail,
        o.customerPhone ?? '',
        STATUS_LABELS[o.status] ?? o.status,
        fmt(parseFloat(o.total), o.currency),
        fmtDate(o.createdAt),
      ])
    )
  );
  lines.push('');

  // ── Top produits ──
  if (data.topProducts.length > 0) {
    lines.push(toCsvRow(['TOP PRODUITS', '', '']));
    lines.push(toCsvRow(['Produit', 'Qté vendue', 'Revenu']));
    data.topProducts.forEach((p) =>
      lines.push(
        toCsvRow([p.name, String(p.qty), fmt(p.revenue, p.currency)])
      )
    );
  }

  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF (via window.print) ────────────────────────────────────────────────────

export function exportReportPDF(data: ExportData, filename = 'rapport-vendeur'): void {
  const periodLine = data.period ? `<p class="meta">Période : <strong>${data.period}</strong></p>` : '';
  const storeLine = data.storeName ? `<p class="meta">Boutique : <strong>${data.storeName}</strong></p>` : '';

  const kpiRows = data.kpis
    .map((k) => `<tr><td>${k.label}</td><td class="val">${k.value}</td></tr>`)
    .join('');

  const orderRows = data.orders
    .map(
      (o) => `<tr>
        <td>${o.orderNumber}</td>
        <td>${o.customerFirstName} ${o.customerLastName}</td>
        <td>${o.customerEmail}</td>
        <td><span class="badge status-${o.status.toLowerCase()}">${STATUS_LABELS[o.status] ?? o.status}</span></td>
        <td class="val">${fmt(parseFloat(o.total), o.currency)}</td>
        <td>${fmtDate(o.createdAt)}</td>
      </tr>`
    )
    .join('');

  const topRows = data.topProducts
    .map(
      (p, i) => `<tr>
        <td class="rank">#${i + 1}</td>
        <td>${p.name}</td>
        <td class="val">${p.qty}</td>
        <td class="val">${fmt(p.revenue, p.currency)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; padding: 32px; }

    /* Header */
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #D45D00; padding-bottom: 16px; margin-bottom: 24px; }
    .report-title { font-size: 22px; font-weight: 800; color: #D45D00; }
    .report-sub { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .meta { font-size: 11px; color: #6B7280; margin-top: 2px; }
    .meta strong { color: #1a1a2e; }
    .generated { font-size: 11px; color: #9CA3AF; text-align: right; }

    /* Section titles */
    .section-title {
      font-size: 13px; font-weight: 700; color: #D45D00;
      border-left: 4px solid #D45D00; padding-left: 10px;
      margin: 24px 0 12px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #FFF4EC; }
    th { padding: 8px 10px; text-align: left; font-weight: 700; color: #D45D00; border-bottom: 2px solid #F5E6D5; }
    td { padding: 7px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #FAFAFA; }
    .val { text-align: right; font-weight: 600; }
    .rank { font-weight: 800; color: #D45D00; text-align: center; width: 36px; }

    /* KPI table */
    .kpi-table td:first-child { color: #6B7280; }
    .kpi-table td.val { color: #1a1a2e; font-size: 13px; font-weight: 700; }

    /* Status badges */
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
    .status-pending    { background: #FEF3C7; color: #92400E; }
    .status-paid       { background: #DBEAFE; color: #1E40AF; }
    .status-processing { background: #EDE9FE; color: #5B21B6; }
    .status-shipped    { background: #FFF4EC; color: #D45D00; }
    .status-delivered  { background: #D1FAE5; color: #065F46; }
    .status-cancelled  { background: #FEE2E2; color: #991B1B; }

    /* Footer */
    .report-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }

    @media print {
      body { padding: 0; }
      @page { margin: 20mm 15mm; size: A4 portrait; }
      .section-title { break-before: avoid; }
      table { break-inside: avoid; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-title">Rapport Vendeur</div>
      <div class="report-sub">Tableau de bord — export complet</div>
      ${storeLine}
      ${periodLine}
    </div>
    <div class="generated">Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>

  <!-- KPIs -->
  <div class="section-title">Indicateurs clés</div>
  <table class="kpi-table">
    <thead><tr><th>Indicateur</th><th style="text-align:right">Valeur</th></tr></thead>
    <tbody>${kpiRows}</tbody>
  </table>

  <!-- Commandes -->
  <div class="section-title">Liste des commandes (${data.orders.length})</div>
  ${
    data.orders.length === 0
      ? '<p style="color:#9CA3AF;font-size:11px;padding:12px 0">Aucune commande sur cette période.</p>'
      : `<table>
          <thead><tr><th>N° Commande</th><th>Client</th><th>Email</th><th>Statut</th><th style="text-align:right">Total</th><th>Date</th></tr></thead>
          <tbody>${orderRows}</tbody>
        </table>`
  }

  <!-- Top produits -->
  ${
    data.topProducts.length > 0
      ? `<div class="section-title">Top produits vendus</div>
         <table>
           <thead><tr><th style="text-align:center">#</th><th>Produit</th><th style="text-align:right">Qté vendue</th><th style="text-align:right">Revenu</th></tr></thead>
           <tbody>${topRows}</tbody>
         </table>`
      : ''
  }

  <div class="report-footer">
    Rapport généré automatiquement · ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  // Laisser le temps au navigateur de rendre avant d'imprimer
  setTimeout(() => {
    win.print();
    win.close();
  }, 500);
}
