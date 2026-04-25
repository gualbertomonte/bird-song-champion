import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bird, CriadorProfile } from '@/types/bird';
import type { BirdLoan } from '@/types/loan';
import type { Torneio, ClassificacaoItem } from '@/types/torneio';

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const sexoLabel = (s?: string) => s === 'M' ? 'Macho' : s === 'F' ? 'Fêmea' : 'A definir';

// Cache em memória do logo convertido em base64 (evita refetch a cada página)
const _logoCache: Record<string, string | null> = {};
async function loadLogoBase64(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url in _logoCache) return _logoCache[url];
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Falha ao buscar logo');
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    _logoCache[url] = dataUrl;
    return dataUrl;
  } catch (e) {
    console.warn('[pdf] logo do criadouro não pôde ser carregada:', e);
    _logoCache[url] = null;
    return null;
  }
}

// Paleta Aviário Premium (RGB)
const C_FOREST = [10, 46, 34] as [number, number, number];        // #0A2E22
const C_FOREST_DEEP = [8, 36, 27] as [number, number, number];    // mais escuro
const C_GOLD = [201, 169, 97] as [number, number, number];        // #C9A961
const C_GOLD_SOFT = [184, 147, 90] as [number, number, number];   // #B8935A
const C_CREAM = [245, 241, 232] as [number, number, number];      // #F5F1E8
const C_CREAM_ALT = [250, 247, 239] as [number, number, number];  // zebra
const C_TEXT = [30, 38, 34] as [number, number, number];
const C_MUTED = [120, 130, 124] as [number, number, number];

async function header(doc: jsPDF, profile: CriadorProfile, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.getWidth();

  // Faixa principal verde-floresta
  doc.setFillColor(...C_FOREST);
  doc.rect(0, 0, w, 26, 'F');

  // Linha dourada inferior na faixa
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.6);
  doc.line(0, 26, w, 26);

  // Tenta carregar a logo do criadouro
  const logo = await loadLogoBase64(profile.logo_url);
  const textOffsetX = logo ? 36 : 14;

  if (logo) {
    // Selo branco circular para a logo
    doc.setFillColor(245, 241, 232);
    doc.circle(22, 13, 9.5, 'F');
    doc.setDrawColor(...C_GOLD);
    doc.setLineWidth(0.5);
    doc.circle(22, 13, 9.5, 'S');
    try {
      // Detecta formato pela data URL
      const fmt = logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logo, fmt, 14, 5, 16, 16, undefined, 'FAST');
    } catch (e) {
      console.warn('[pdf] addImage logo falhou:', e);
    }
  }

  // Logo / nome do criadouro
  doc.setTextColor(...C_GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(profile.nome_criadouro || 'MeuPlantelPro', textOffsetX, 12);

  // Metadados
  doc.setTextColor(...C_CREAM);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const meta: string[] = [];
  if (profile.codigo_criadouro) meta.push(`Cód. ${profile.codigo_criadouro}`);
  if (profile.registro_ctf) meta.push(`CTF/IBAMA ${profile.registro_ctf}`);
  if (profile.cpf) meta.push(`CPF ${profile.cpf}`);
  if (meta.length) doc.text(meta.join('  ·  '), textOffsetX, 19);

  // Selo "MeuPlantelPro" no canto direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C_GOLD);
  doc.text('MEUPLANTELPRO', w - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C_CREAM);
  doc.text('Plantel Premium', w - 14, 17, { align: 'right' });

  // Título do documento
  doc.setTextColor(...C_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 38);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C_MUTED);
    doc.text(subtitle, 14, 44);
  }
  // Linha dourada decorativa
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.3);
  doc.line(14, 47, w - 14, 47);
  doc.setTextColor(...C_TEXT);
}

function footer(doc: jsPDF, profile?: CriadorProfile) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const criador = profile?.nome_criadouro?.trim();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Linha dourada
    doc.setDrawColor(...C_GOLD);
    doc.setLineWidth(0.3);
    doc.line(14, h - 12, w - 14, h - 12);
    // Texto
    doc.setFontSize(8);
    doc.setTextColor(...C_MUTED);
    const left = criador
      ? `${criador} · MeuPlantelPro · ${new Date().toLocaleDateString('pt-BR')}`
      : `MeuPlantelPro · Gerado em ${new Date().toLocaleDateString('pt-BR')}`;
    doc.text(left, 14, h - 7);
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 7, { align: 'right' });
  }
}

const tableTheme = {
  headStyles: {
    fillColor: C_FOREST,
    textColor: C_GOLD,
    fontStyle: 'bold' as const,
    fontSize: 9,
    cellPadding: 3,
  },
  bodyStyles: {
    fontSize: 9,
    textColor: C_TEXT,
    cellPadding: 2.5,
  },
  alternateRowStyles: { fillColor: C_CREAM_ALT },
  styles: { lineColor: C_GOLD, lineWidth: 0.1 },
};

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C_FOREST);
  doc.text(text, 14, y);
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.2);
  doc.line(14, y + 1.5, 14 + doc.getTextWidth(text) + 4, y + 1.5);
  doc.setTextColor(...C_TEXT);
}

/* ─────────── Recibo de Empréstimo ─────────── */
export async function generateLoanReceiptPDF(loan: BirdLoan, profile: CriadorProfile) {
  const doc = new jsPDF();
  const snap = (loan.bird_snapshot || {}) as any;
  await header(doc, profile, 'Recibo de Empréstimo de Ave', `Documento Nº ${loan.id.slice(0, 8).toUpperCase()}`);

  let y = 56;
  sectionTitle(doc, 'Partes envolvidas', y); y += 6;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    ...tableTheme,
    body: [
      [{ content: 'Cedente (proprietário)', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, loan.owner_email || '—'],
      [{ content: 'Recebedor', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, `${loan.borrower_email}${loan.borrower_codigo_criadouro ? ` (cód. ${loan.borrower_codigo_criadouro})` : ''}`],
    ],
    columnStyles: { 0: { cellWidth: 55 } },
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  sectionTitle(doc, 'Dados da ave', y); y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    ...tableTheme,
    body: [
      [{ content: 'Nome', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, snap.nome || '—', { content: 'Anilha', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, snap.codigo_anilha || '—'],
      [{ content: 'Espécie', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, { content: snap.nome_cientifico || '—', styles: { fontStyle: 'italic' } }, { content: 'Sexo', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, sexoLabel(snap.sexo)],
      [{ content: 'Nascimento', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, fmtDate(snap.data_nascimento), { content: 'Diâmetro', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, snap.diametro_anilha || '—'],
      [{ content: 'Tipo anilha', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, snap.tipo_anilha || '—', { content: 'Estado', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, snap.estado || '—'],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  sectionTitle(doc, 'Condições do empréstimo', y); y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    ...tableTheme,
    body: [
      [{ content: 'Data do empréstimo', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, fmtDate(loan.data_emprestimo)],
      [{ content: 'Prazo previsto', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, fmtDate(loan.prazo_devolucao)],
      [{ content: 'Status atual', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, loan.status.replace('_', ' ')],
      [{ content: 'Observações', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, loan.observacoes || '—'],
    ],
    columnStyles: { 0: { cellWidth: 55 } },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Termo legal
  doc.setFillColor(...C_CREAM);
  doc.roundedRect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 26, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...C_TEXT);
  doc.setFont('helvetica', 'italic');
  const termo =
    'Declaramos que a ave acima descrita foi cedida em empréstimo para fins de reprodução, ' +
    'permanecendo a propriedade do cedente. O recebedor compromete-se a zelar pelo bem-estar ' +
    'da ave e devolvê-la conforme combinado. Filhotes gerados durante o empréstimo pertencem ao recebedor.';
  doc.text(doc.splitTextToSize(termo, 175), 18, y + 2);
  doc.setFont('helvetica', 'normal');

  y += 38;
  doc.setDrawColor(...C_GOLD_SOFT);
  doc.setLineWidth(0.4);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  doc.setFontSize(8);
  doc.setTextColor(...C_FOREST);
  doc.setFont('helvetica', 'bold');
  doc.text('Cedente', 55, y + 5, { align: 'center' });
  doc.text('Recebedor', 155, y + 5, { align: 'center' });

  footer(doc, profile);
  doc.save(`recibo_emprestimo_${loan.id.slice(0, 8)}.pdf`);
}

/* ─────────── Relatório de Plantel (formato SISPASS-like) ─────────── */
export async function generatePlantelReportPDF(birds: Bird[], profile: CriadorProfile) {
  const doc = new jsPDF({ orientation: 'landscape' });
  await header(
    doc,
    profile,
    'Relatório de Plantel',
    `Total de aves: ${birds.length}  ·  Emitido em ${new Date().toLocaleDateString('pt-BR')}`
  );

  autoTable(doc, {
    startY: 54,
    theme: 'grid',
    ...tableTheme,
    head: [['Anilha', 'SISPASS', 'Nome', 'Espécie', 'Sexo', 'Nasc.', 'Tipo', 'Diâm.', 'Status', 'Estado']],
    body: birds.map(b => [
      b.codigo_anilha || '—',
      b.anilha_sispass ? 'Sim' : 'Não',
      b.nome,
      b.nome_cientifico || '—',
      sexoLabel(b.sexo),
      fmtDate(b.data_nascimento),
      b.tipo_anilha || '—',
      b.diametro_anilha || '—',
      b.status,
      b.estado || '—',
    ]),
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 16 },
      3: { cellWidth: 45, fontStyle: 'italic' },
    },
  });

  // Resumo
  let y = (doc as any).lastAutoTable.finalY + 10;
  if (y > 175) { doc.addPage(); y = 24; }
  const counts = {
    ativos: birds.filter(b => b.status === 'Ativo').length,
    bercario: birds.filter(b => b.status === 'Berçário').length,
    vendidos: birds.filter(b => b.status === 'Vendido').length,
    falecidos: birds.filter(b => b.status === 'Falecido').length,
    machos: birds.filter(b => b.sexo === 'M').length,
    femeas: birds.filter(b => b.sexo === 'F').length,
  };
  sectionTitle(doc, 'Resumo do plantel', y); y += 4;
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    ...tableTheme,
    body: [
      [{ content: 'Ativos', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, String(counts.ativos), { content: 'Berçário', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, String(counts.bercario)],
      [{ content: 'Vendidos', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, String(counts.vendidos), { content: 'Falecidos', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, String(counts.falecidos)],
      [{ content: 'Machos', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, String(counts.machos), { content: 'Fêmeas', styles: { fontStyle: 'bold', fillColor: C_CREAM } }, String(counts.femeas)],
    ],
  });

  footer(doc, profile);
  doc.save(`plantel_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ─────────── Relatório de Torneio ─────────── */
export async function gerarRelatorioTorneio(
  torneio: Torneio,
  classificacao: ClassificacaoItem[],
  profile: CriadorProfile,
  criadores?: Record<string, string>,
) {
  const doc = new jsPDF();
  await header(doc, profile, torneio.nome, `Torneio · ${new Date(torneio.data).toLocaleDateString('pt-BR')}`);

  let y = 56;
  if (torneio.regulamento) {
    sectionTitle(doc, 'Regulamento', y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C_TEXT);
    const lines = doc.splitTextToSize(torneio.regulamento, 180);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 6;
  }

  sectionTitle(doc, 'Classificação Final', y); y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    ...tableTheme,
    head: [['Pos.', 'Ave', 'Proprietário', 'Anilha', 'Estaca', 'Total']],
    body: classificacao.map(c => [
      `${c.posicao}º`,
      c.inscricao.bird_snapshot?.nome || '—',
      criadores?.[c.inscricao.participante_user_id] || '—',
      c.inscricao.bird_snapshot?.codigo_anilha || '—',
      c.inscricao.estacao ? `#${c.inscricao.estacao}` : '—',
      c.totalPontos.toFixed(2),
    ]),
    columnStyles: { 0: { cellWidth: 16, fontStyle: 'bold' }, 5: { halign: 'right', fontStyle: 'bold' } },
  });

  footer(doc);
  doc.save(`torneio_${torneio.nome.replace(/\s+/g, '_').toLowerCase()}_${torneio.id.slice(0, 8)}.pdf`);
}
