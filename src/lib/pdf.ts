import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import type { Bird, CriadorProfile } from '@/types/bird';
import type { BirdLoan } from '@/types/loan';
import type { Torneio, ClassificacaoItem } from '@/types/torneio';

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const sexoLabel = (s?: string) => s === 'M' ? 'Macho' : s === 'F' ? 'Fêmea' : 'A definir';

// Zonas de layout (mm) — fonte única de verdade
const LAYOUT = {
  HEADER_BOTTOM: 26,     // header minimalista (nome + título + linha dourada)
  FOOTER_TOP_OFFSET: 14, // footer começa em (h - 14)
  WATERMARK_RATIO: 0.7,
  BACKPLATE_INSET: 4,    // margem entre logo de fundo e área protegida do texto
} as const;

// Modo de visualização do fundo (intensidade da logo do criadouro)
export type PdfBackgroundMode = 'destaque' | 'sutil' | 'leitura';
const BG_OPACITY: Record<PdfBackgroundMode, number> = {
  destaque: 0.18,
  sutil: 0.08,
  leitura: 0.03,
};
// Cache do modo escolhido por cada doc (para o backplate saber se precisa ser opaco)
const _docBgMode = new WeakMap<jsPDF, PdfBackgroundMode>();


// Cache em memória do logo convertido em base64 (evita refetch a cada página)
const _logoCache: Record<string, string | null> = {};

/**
 * Remove fundo branco/claro de uma ImageData (chroma-key simples).
 * Pixels muito brancos viram transparentes; pixels intermediários ganham
 * alpha proporcional para suavizar bordas (anti-aliasing).
 */
function removeWhiteBackground(imgData: ImageData, threshold = 240) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const minC = Math.min(r, g, b);
    if (minC >= 250) {
      d[i + 3] = 0; // branco puro → transparente
    } else if (minC >= threshold) {
      // borda suave: alpha proporcional
      const fade = (minC - threshold) / (250 - threshold);
      d[i + 3] = Math.round(d[i + 3] * (1 - fade));
    }
  }
}

/**
 * Carrega a logo do criadouro como PNG base64 com fundo transparente.
 * Usa <img crossOrigin> + <canvas> (mais robusto que fetch com CORS).
 */
async function loadLogoBase64(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url in _logoCache) return _logoCache[url];
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 768; // resolução maior = mais nitidez no PDF
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Canvas transparente — sem fundo creme. O selo circular do PDF aparece atrás.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Desenha a logo com "contain" centralizado
        const r = Math.min(size / img.width, size / img.height) * 0.92;
        const w = img.width * r;
        const h = img.height * r;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        // Remove fundo branco
        const imgData = ctx.getImageData(0, 0, size, size);
        removeWhiteBackground(imgData, 240);
        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        _logoCache[url] = dataUrl;
        resolve(dataUrl);
      } catch (e) {
        console.warn('[pdf] canvas tainted ao gerar logo base64:', e);
        _logoCache[url] = null;
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('[pdf] não foi possível carregar a logo do criadouro:', url);
      _logoCache[url] = null;
      resolve(null);
    };
    img.src = url + (url.includes('?') ? '&' : '?') + 'pdf=1';
  });
}

/**
 * Versão "marca d'água" da logo: PNG base64 com:
 *  - fundo branco removido
 *  - dessaturação para tons de dourado claro (cara de selo oficial)
 *  - opacidade aplicada (default 8%)
 */
const _watermarkCache: Record<string, string | null> = {};
async function loadLogoWatermark(url?: string | null, opacity = 0.08): Promise<string | null> {
  if (!url) return null;
  const key = `${url}::${opacity}`;
  if (key in _watermarkCache) return _watermarkCache[key];
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 1024; // alta resolução para o fundo grande
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const r = Math.min(size / img.width, size / img.height);
        const w = img.width * r;
        const h = img.height * r;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        // Pós-processa: remove fundo branco + aplica opacidade preservando cores naturais da logo
        const imgData = ctx.getImageData(0, 0, size, size);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2];
          const minC = Math.min(r0, g0, b0);
          // Remove fundo branco com fade nas bordas
          if (minC >= 250) { d[i + 3] = 0; continue; }
          const baseAlpha = minC >= 240
            ? Math.round(d[i + 3] * (1 - (minC - 240) / 10))
            : d[i + 3];
          d[i + 3] = Math.round(baseAlpha * opacity);
        }
        ctx.clearRect(0, 0, size, size);
        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        _watermarkCache[key] = dataUrl;
        resolve(dataUrl);
      } catch (e) {
        _watermarkCache[key] = null;
        resolve(null);
      }
    };
    img.onerror = () => { _watermarkCache[key] = null; resolve(null); };
    img.src = url + (url.includes('?') ? '&' : '?') + 'pdfwm=1';
  });
}

// Paleta Aviário Premium (RGB)
const C_FOREST = [10, 46, 34] as [number, number, number];        // #0A2E22
const C_FOREST_DEEP = [8, 36, 27] as [number, number, number];
const C_GOLD = [201, 169, 97] as [number, number, number];        // #C9A961
const C_GOLD_SOFT = [184, 147, 90] as [number, number, number];
const C_CREAM = [245, 241, 232] as [number, number, number];
const C_CREAM_ALT = [250, 247, 239] as [number, number, number];
const C_TEXT = [30, 38, 34] as [number, number, number];
const C_MUTED = [120, 130, 124] as [number, number, number];

/**
 * Header minimalista — substitui a faixa verde + selo dourado.
 * Nome do criadouro (esq) + título/subtítulo (centro/dir) + linha dourada fina.
 * A "marca visual" agora vem da logo de fundo (applyLogoBackground).
 */
async function header(doc: jsPDF, profile: CriadorProfile, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.getWidth();
  const criador = profile?.nome_criadouro?.trim() || 'MeuPlantelPro';

  // Nome do criadouro (esquerda) — serif elegante simulada com helvetica bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C_FOREST);
  doc.text(criador, 14, 11);

  // Metadados pequenos abaixo (cód. + CTF)
  const meta: string[] = [];
  if (profile?.codigo_criadouro) meta.push(`Cód. ${profile.codigo_criadouro}`);
  if (profile?.registro_ctf) meta.push(`CTF ${profile.registro_ctf}`);
  if (meta.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C_MUTED);
    doc.text(meta.join('  ·  '), 14, 15.5);
  }

  // Título do documento (direita)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C_TEXT);
  doc.text(title, w - 14, 11, { align: 'right' });
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C_MUTED);
    doc.text(subtitle, w - 14, 16, { align: 'right' });
  }

  // Linha dourada fina separadora
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.4);
  doc.line(14, 21, w - 14, 21);
  doc.setLineWidth(0.15);
  doc.line(14, 22, w - 14, 22);
  doc.setTextColor(...C_TEXT);
}

/**
 * Aplica a logo do criadouro como fundo de TODAS as páginas + um "backplate" branco
 * semi-transparente sobre a área de conteúdo para garantir nitidez do texto.
 *
 * Modo controla a intensidade da logo de fundo:
 *  - 'destaque' (18%): capas / página única
 *  - 'sutil'    (8%):  relatórios / árvore
 *  - 'leitura'  (3%):  tabelas longas
 *
 * O backplate cobre a área entre header e footer com inset (deixa logo aparecer nas bordas).
 */
async function applyLogoBackground(
  doc: jsPDF,
  profile: CriadorProfile | undefined,
  mode: PdfBackgroundMode = 'sutil',
) {
  _docBgMode.set(doc, mode);
  const opacity = BG_OPACITY[mode];
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const bg = profile?.logo_url ? await loadLogoWatermark(profile.logo_url, opacity) : null;

  // Logo ocupa 70% da menor dimensão, centralizada
  const size = Math.min(w, h) * 0.7;
  const bgX = (w - size) / 2;
  const bgY = (h - size) / 2;

  // Backplate: área entre header e footer, com pequeno inset lateral
  const inset = LAYOUT.BACKPLATE_INSET;
  const bpX = inset;
  const bpY = LAYOUT.HEADER_BOTTOM - 1;
  const bpW = w - inset * 2;
  const bpH = h - bpY - LAYOUT.FOOTER_TOP_OFFSET - 1;
  // Opacidade do backplate: quanto mais opaca a logo, mais opaco o backplate precisa ser
  const bpOpacity = mode === 'destaque' ? 0.92 : mode === 'sutil' ? 0.82 : 0.7;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (bg) {
      try {
        doc.addImage(bg, 'PNG', bgX, bgY, size, size, undefined, 'SLOW');
      } catch { /* ignore */ }
    }
    // Backplate branco semi-transparente — protege a leitura
    drawTextBackplate(doc, bpX, bpY, bpW, bpH, bpOpacity);
  }
}

/**
 * Desenha um retângulo branco semi-transparente para "apagar" a logo de fundo
 * localmente e garantir contraste do texto. Usa GState do jsPDF.
 */
function drawTextBackplate(doc: jsPDF, x: number, y: number, w: number, h: number, opacity = 0.85) {
  const docAny = doc as any;
  let gState: any = null;
  try {
    if (typeof docAny.GState === 'function' && typeof docAny.setGState === 'function') {
      gState = new docAny.GState({ opacity });
      docAny.setGState(gState);
    }
  } catch { /* sem suporte a GState — desenha opaco */ }
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  // Restaura opacidade total
  try {
    if (typeof docAny.GState === 'function' && typeof docAny.setGState === 'function') {
      docAny.setGState(new docAny.GState({ opacity: 1 }));
    }
  } catch { /* ignore */ }
}

/**
 * @deprecated mantido como atalho — use applyLogoBackground.
 * Encaminha para applyLogoBackground no modo 'sutil' por padrão.
 */
async function applyWatermarkAndCorners(doc: jsPDF, profile?: CriadorProfile, _opacity = 0.05) {
  await applyLogoBackground(doc, profile, 'sutil');
}
/**
 * Valida geometricamente se a marca-d'água invade as zonas reservadas
 * (header verde no topo ou footer no rodapé). Em caso de problema, mostra
 * um toast e loga detalhes — NÃO bloqueia o salvamento (apenas alerta).
 * Retorna lista de problemas (vazia = layout OK).
 */
function validateLayout(doc: jsPDF, opts: { hasWatermark: boolean; context: string }): string[] {
  const problems: string[] = [];
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Avisa se o criadouro não tem logo — fundo fica em branco
  if (!opts.hasWatermark) {
    console.info(`[pdf:${opts.context}] Sem logo do criadouro — fundo em branco.`);
  }

  // Sanidade da área útil
  const usableH = h - LAYOUT.HEADER_BOTTOM - LAYOUT.FOOTER_TOP_OFFSET;
  if (usableH < 40) {
    problems.push(`Área útil muito pequena (${usableH.toFixed(1)}mm) — header/footer ocupam demais.`);
  }
  if (w < 100) {
    problems.push(`Largura da página suspeita (${w.toFixed(1)}mm).`);
  }

  if (problems.length > 0) {
    console.warn(`[pdf:${opts.context}] ⚠️ Validação de layout:`, problems);
    toast.warning('Aviso no layout do PDF', {
      description: problems[0] + (problems.length > 1 ? ` (+${problems.length - 1} outros avisos)` : ''),
      duration: 6000,
    });
  }

  return problems;
}

/**
 * Re-aplica o cabeçalho em TODAS as páginas (jsPDF só desenha na página atual).
 * Chamar por último para garantir que o header fique por cima da marca-d'água.
 */
async function applyHeaderAllPages(doc: jsPDF, profile: CriadorProfile, title: string, subtitle?: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    await header(doc, profile, title, subtitle);
  }
}

function footer(doc: jsPDF, profile?: CriadorProfile) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const criador = profile?.nome_criadouro?.trim();
  const codigo = profile?.codigo_criadouro?.trim();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Filete dourado duplo
    doc.setDrawColor(...C_GOLD);
    doc.setLineWidth(0.5);
    doc.line(14, h - 12, w - 14, h - 12);
    doc.setLineWidth(0.15);
    doc.line(14, h - 11, w - 14, h - 11);
    doc.setFontSize(8);
    doc.setTextColor(...C_MUTED);
    const parts: string[] = [];
    if (criador) parts.push(criador);
    if (codigo) parts.push(`Cód. ${codigo}`);
    parts.push('MeuPlantelPro');
    parts.push(new Date().toLocaleDateString('pt-BR'));
    doc.text(parts.join('  ·  '), 14, h - 7);
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

  let y = 30;
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

  // Ordem: fundo (logo + backplate) primeiro, header em todas as páginas, footer por último.
  await applyLogoBackground(doc, profile, 'destaque');
  await applyHeaderAllPages(doc, profile, 'Recibo de Empréstimo de Ave', `Documento Nº ${loan.id.slice(0, 8).toUpperCase()}`);
  footer(doc, profile);
  validateLayout(doc, { hasWatermark: !!profile?.logo_url, context: 'recibo-emprestimo' });
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
    startY: 28,
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

  await applyWatermarkAndCorners(doc, profile, 0.05);
  await applyHeaderAllPages(
    doc,
    profile,
    'Relatório de Plantel',
    `Total de aves: ${birds.length}  ·  Emitido em ${new Date().toLocaleDateString('pt-BR')}`
  );
  footer(doc, profile);
  validateLayout(doc, { hasWatermark: !!profile?.logo_url, context: 'plantel' });
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

  let y = 30;
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

  await applyWatermarkAndCorners(doc, profile, 0.05);
  await applyHeaderAllPages(doc, profile, torneio.nome, `Torneio · ${new Date(torneio.data).toLocaleDateString('pt-BR')}`);
  footer(doc, profile);
  validateLayout(doc, { hasWatermark: !!profile?.logo_url, context: 'torneio' });
  doc.save(`torneio_${torneio.nome.replace(/\s+/g, '_').toLowerCase()}_${torneio.id.slice(0, 8)}.pdf`);
}

/* ─────────── Árvore Genealógica ─────────── */

/**
 * Carrega uma foto de ave como base64 (para incrustar no PDF).
 * Sem remoção de fundo — fotos são quadradas em miniatura.
 */
const _photoCache: Record<string, string | null> = {};
async function loadPhotoBase64(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url in _photoCache) return _photoCache[url];
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        if (!ctx) { resolve(null); return; }
        // crop quadrado central
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const data = c.toDataURL('image/jpeg', 0.85);
        _photoCache[url] = data;
        resolve(data);
      } catch {
        _photoCache[url] = null;
        resolve(null);
      }
    };
    img.onerror = () => { _photoCache[url] = null; resolve(null); };
    img.src = url + (url.includes('?') ? '&' : '?') + 'pdfphoto=1';
  });
}

interface TreeCard {
  bird?: Bird;
  role: 'self' | 'father' | 'mother';
  photoData?: string | null;
}

/**
 * Desenha um card de ave (ou "Desconhecido") em coordenadas (x, y) com largura w e altura h.
 */
function drawBirdCard(doc: jsPDF, card: TreeCard, x: number, y: number, w: number, h: number) {
  const { bird, role, photoData } = card;

  // Borda colorida por papel/sexo
  const isSelf = role === 'self';
  const isMale = bird?.sexo === 'M';
  const isFemale = bird?.sexo === 'F';

  let borderColor: [number, number, number] = C_MUTED;
  let bgColor: [number, number, number] = [255, 255, 255];

  if (!bird) {
    borderColor = [200, 200, 200];
    bgColor = [248, 248, 246];
  } else if (isSelf) {
    borderColor = C_GOLD;
    bgColor = [253, 250, 240];
  } else if (isMale) {
    borderColor = [70, 130, 180]; // azul info
    bgColor = [240, 247, 252];
  } else if (isFemale) {
    borderColor = [200, 100, 140]; // rosa
    bgColor = [252, 242, 247];
  }

  // Fundo
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(isSelf ? 0.8 : 0.4);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  if (!bird) {
    // Card "Desconhecido"
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...C_MUTED);
    doc.text('Desconhecido', x + w / 2, y + h / 2 - 1, { align: 'center' });
    if (role !== 'self') {
      doc.setFontSize(6);
      doc.text(role === 'father' ? 'PAI' : 'MÃE', x + w / 2, y + h / 2 + 3, { align: 'center' });
    }
    return;
  }

  // Foto miniatura à esquerda (se houver)
  const photoSize = h - 4;
  const photoX = x + 2;
  const photoY = y + 2;
  if (photoData) {
    try {
      doc.addImage(photoData, 'JPEG', photoX, photoY, photoSize, photoSize, undefined, 'FAST');
    } catch { /* ignore */ }
  } else {
    doc.setFillColor(235, 235, 230);
    doc.setDrawColor(220, 220, 215);
    doc.setLineWidth(0.2);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 0.8, 0.8, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(...C_MUTED);
    doc.text('sem foto', photoX + photoSize / 2, photoY + photoSize / 2 + 0.5, { align: 'center' });
  }

  // Texto à direita
  const tx = photoX + photoSize + 2;
  const tw = w - (tx - x) - 2;

  // Nome (negrito)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C_TEXT);
  const nome = doc.splitTextToSize(bird.nome || '—', tw)[0];
  doc.text(nome, tx, y + 4);

  // Símbolo sexo ao lado
  const sexLabel = isMale ? 'M' : isFemale ? 'F' : '?';
  const sexColor: [number, number, number] = isMale ? [70, 130, 180] : isFemale ? [200, 100, 140] : C_MUTED;
  doc.setTextColor(...sexColor);
  doc.setFontSize(7);
  doc.text(sexLabel, x + w - 3, y + 4, { align: 'right' });

  // Nome científico (itálico)
  if (bird.nome_cientifico) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(...C_MUTED);
    const sci = doc.splitTextToSize(bird.nome_cientifico, tw)[0];
    doc.text(sci, tx, y + 7.5);
  }

  // Anilha (mono-like)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C_TEXT);
  const anilha = bird.codigo_anilha || '—';
  doc.text(anilha, tx, y + h - 2);

  // Tag de papel
  if (role !== 'self') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...C_GOLD_SOFT);
    doc.text(role === 'father' ? 'PAI' : 'MÃE', x + w - 2, y + h - 2, { align: 'right' });
  }
}

/**
 * Calcula o layout vertical da árvore: cada geração ocupa uma "coluna" da esquerda
 * para a direita (raiz à esquerda, ancestrais mais antigos à direita), com cards
 * empilhados verticalmente.
 *
 * Para `generations` gerações, a coluna g (0..gen-1) tem 2^g posições.
 */
function computeTreeLayout(generations: number, areaX: number, areaY: number, areaW: number, areaH: number) {
  const cols = generations;
  const cardW = Math.min(58, (areaW - (cols - 1) * 14) / cols);
  const colGap = (areaW - cols * cardW) / Math.max(1, cols - 1);
  const cardH = 14;

  // Posições dos slots (col, row) → (x, y)
  const positions: { x: number; y: number; w: number; h: number }[][] = [];
  for (let g = 0; g < generations; g++) {
    const slots = Math.pow(2, g);
    const x = areaX + g * (cardW + colGap);
    const slotH = areaH / slots;
    const colSlots: { x: number; y: number; w: number; h: number }[] = [];
    for (let s = 0; s < slots; s++) {
      const cy = areaY + s * slotH + slotH / 2 - cardH / 2;
      colSlots.push({ x, y: cy, w: cardW, h: cardH });
    }
    positions.push(colSlots);
  }
  return { positions, cardW, cardH };
}

/**
 * Constrói recursivamente a lista de cards por geração (BFS por nível).
 * Geração 0 = ave selecionada; geração 1 = pai (slot 0) + mãe (slot 1); etc.
 */
function buildAncestors(rootId: string, birds: Bird[], generations: number): TreeCard[][] {
  const byId = new Map(birds.map(b => [b.id, b]));
  const layers: TreeCard[][] = [];

  // Camada 0: a própria ave
  const root = byId.get(rootId);
  layers.push([{ bird: root, role: 'self' }]);

  for (let g = 1; g < generations; g++) {
    const prev = layers[g - 1];
    const current: TreeCard[] = [];
    for (const card of prev) {
      const father = card.bird?.pai_id ? byId.get(card.bird.pai_id) : undefined;
      const mother = card.bird?.mae_id ? byId.get(card.bird.mae_id) : undefined;
      current.push({ bird: father, role: 'father' });
      current.push({ bird: mother, role: 'mother' });
    }
    layers.push(current);
  }
  return layers;
}

export async function generateArvoreGenealogicaPDF(
  bird: Bird,
  birds: Bird[],
  profile: CriadorProfile,
  generations: 2 | 3 | 4 = 3,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header inicial (página 1)
  await header(doc, profile, 'Árvore Genealógica', `Linhagem · ${bird.nome} · ${bird.codigo_anilha || '—'}`);

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Área de conteúdo (abaixo do header, acima do footer, margem lateral 14mm)
  const areaX = 14;
  const areaY = LAYOUT.HEADER_BOTTOM + 6;
  const areaW = w - 28;
  const areaH = h - areaY - LAYOUT.FOOTER_TOP_OFFSET - 10;

  // Layout
  const { positions } = computeTreeLayout(generations, areaX, areaY, areaW, areaH);
  const layers = buildAncestors(bird.id, birds, generations);

  // Pré-carrega fotos em paralelo
  await Promise.all(
    layers.flat().map(async (card) => {
      if (card.bird?.foto_url) {
        card.photoData = await loadPhotoBase64(card.bird.foto_url);
      }
    })
  );

  // Desenha conexões (filho → pais) — antes dos cards para ficar atrás
  doc.setDrawColor(...C_GOLD_SOFT);
  doc.setLineWidth(0.3);
  for (let g = 0; g < generations - 1; g++) {
    const childSlots = positions[g];
    const parentSlots = positions[g + 1];
    childSlots.forEach((child, idx) => {
      const father = parentSlots[idx * 2];
      const mother = parentSlots[idx * 2 + 1];
      const childRight = { x: child.x + child.w, y: child.y + child.h / 2 };
      const fatherLeft = { x: father.x, y: father.y + father.h / 2 };
      const motherLeft = { x: mother.x, y: mother.y + mother.h / 2 };
      const midX = (childRight.x + fatherLeft.x) / 2;

      // Linha horizontal saindo do filho
      doc.line(childRight.x, childRight.y, midX, childRight.y);
      // Linha vertical conectando os dois pais
      doc.line(midX, fatherLeft.y, midX, motherLeft.y);
      // Linhas horizontais para cada pai
      doc.line(midX, fatherLeft.y, fatherLeft.x, fatherLeft.y);
      doc.line(midX, motherLeft.y, motherLeft.x, motherLeft.y);
    });
  }

  // Desenha cards
  for (let g = 0; g < generations; g++) {
    const slots = positions[g];
    const cards = layers[g];
    slots.forEach((slot, idx) => {
      const card = cards[idx];
      if (card) drawBirdCard(doc, card, slot.x, slot.y, slot.w, slot.h);
    });
  }

  // Estatística no rodapé do conteúdo
  const known = layers.flat().filter(c => c.bird).length;
  const total = layers.flat().length;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...C_MUTED);
  doc.text(
    `Ancestrais conhecidos: ${known} de ${total}  ·  ${generations} gerações  ·  Emitido em ${new Date().toLocaleDateString('pt-BR')}`,
    w / 2,
    h - LAYOUT.FOOTER_TOP_OFFSET - 4,
    { align: 'center' }
  );

  // Aplica papel timbrado completo
  await applyWatermarkAndCorners(doc, profile, 0.05);
  await applyHeaderAllPages(doc, profile, 'Árvore Genealógica', `Linhagem · ${bird.nome} · ${bird.codigo_anilha || '—'}`);
  footer(doc, profile);
  validateLayout(doc, { hasWatermark: !!profile?.logo_url, context: 'arvore-genealogica' });

  const safeName = (bird.nome || 'ave').replace(/\s+/g, '_').toLowerCase();
  doc.save(`arvore_${safeName}_${bird.id.slice(0, 8)}.pdf`);
}
