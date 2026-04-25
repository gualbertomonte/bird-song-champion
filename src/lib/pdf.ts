import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import type { Bird, CriadorProfile } from '@/types/bird';
import type { BirdLoan } from '@/types/loan';
import type { Torneio, ClassificacaoItem } from '@/types/torneio';

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const sexoLabel = (s?: string) => s === 'M' ? 'Macho' : s === 'F' ? 'Fêmea' : 'A definir';

// Zonas de layout (mm) — fonte única de verdade usada por header, watermark, footer e validador
const LAYOUT = {
  HEADER_BOTTOM: 52,   // header verde + filete dourado vão de y=0 até ~52
  FOOTER_TOP_OFFSET: 14, // footer começa em (h - 14) e vai até h
  WATERMARK_RATIO: 0.7,  // tamanho relativo à menor dimensão da área de conteúdo
} as const;


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
        const size = 800;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const r = Math.min(size / img.width, size / img.height);
        const w = img.width * r;
        const h = img.height * r;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        // Pós-processa: tinge de dourado + remove branco + aplica opacidade
        const imgData = ctx.getImageData(0, 0, size, size);
        const d = imgData.data;
        // Cor alvo (dourado) — combina com a paleta do papel timbrado
        const TR = 201, TG = 169, TB = 97;
        for (let i = 0; i < d.length; i += 4) {
          const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2];
          const minC = Math.min(r0, g0, b0);
          // Remove fundo branco
          if (minC >= 250) { d[i + 3] = 0; continue; }
          // Converte para luminância e mapeia para tons de dourado
          const lum = (0.299 * r0 + 0.587 * g0 + 0.114 * b0) / 255;
          // Inverte: pixels escuros viram dourado mais saturado
          const k = 1 - lum * 0.5;
          d[i] = Math.round(TR * k);
          d[i + 1] = Math.round(TG * k);
          d[i + 2] = Math.round(TB * k);
          // Aplica opacidade preservando suavização das bordas
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
  doc.rect(0, 0, w, 30, 'F');

  // Filete dourado duplo abaixo da faixa (estilo certificado)
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.7);
  doc.line(0, 30, w, 30);
  doc.setLineWidth(0.2);
  doc.line(0, 31.4, w, 31.4);

  const logo = await loadLogoBase64(profile.logo_url);
  const textOffsetX = 42;

  // ─── Selo circular dourado (carimbo oficial) ───
  // Anel dourado externo
  doc.setFillColor(...C_GOLD);
  doc.circle(22, 15, 12, 'F');
  // Anel verde escuro intermediário
  doc.setFillColor(...C_FOREST_DEEP);
  doc.circle(22, 15, 11.2, 'F');
  // Selo creme central onde fica a logo
  doc.setFillColor(245, 241, 232);
  doc.circle(22, 15, 10.4, 'F');
  // Borda dourada interna fina
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.3);
  doc.circle(22, 15, 10.4, 'S');

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 13, 6, 18, 18, undefined, 'FAST');
    } catch (e) {
      console.warn('[pdf] addImage logo falhou:', e);
    }
  } else {
    // Fallback: monograma "MP" dourado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...C_GOLD_SOFT);
    doc.text('MP', 22, 17.5, { align: 'center' });
  }

  // Nome do criadouro
  doc.setTextColor(...C_GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(profile.nome_criadouro || 'MeuPlantelPro', textOffsetX, 13);

  // Metadados
  doc.setTextColor(...C_CREAM);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const meta: string[] = [];
  if (profile.codigo_criadouro) meta.push(`Cód. ${profile.codigo_criadouro}`);
  if (profile.registro_ctf) meta.push(`CTF/IBAMA ${profile.registro_ctf}`);
  if (profile.cpf) meta.push(`CPF ${profile.cpf}`);
  if (meta.length) doc.text(meta.join('  ·  '), textOffsetX, 20);

  // Selo "MeuPlantelPro" no canto direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C_GOLD);
  doc.text('MEUPLANTELPRO', w - 14, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C_CREAM);
  doc.text('Plantel Premium', w - 14, 18, { align: 'right' });

  // Título do documento
  doc.setTextColor(...C_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 42);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C_MUTED);
    doc.text(subtitle, 14, 48);
  }
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.3);
  doc.line(14, 51, w - 14, 51);
  doc.setTextColor(...C_TEXT);
}

/**
 * Aplica marca d'água da logo (apenas na área de conteúdo, sem tocar header/footer)
 * + cantos decorativos dourados em todas as páginas.
 * Chamar ANTES do header/footer para que esses fiquem por cima.
 */
async function applyWatermarkAndCorners(doc: jsPDF, profile?: CriadorProfile, opacity = 0.05) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const wm = profile?.logo_url ? await loadLogoWatermark(profile.logo_url, opacity) : null;

  const { x: wmX, y: wmY, size: wmSize } = computeWatermarkBox(w, h);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    if (wm) {
      try {
        doc.addImage(wm, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'SLOW');
      } catch (e) {
        // silencioso
      }
    }

    // Cantos decorativos dourados (estilo certificado)
    doc.setDrawColor(...C_GOLD);
    doc.setLineWidth(0.4);
    const cs = 6;
    const m = 8;
    doc.line(m, 36, m + cs, 36);
    doc.line(m, 36, m, 36 + cs);
    doc.line(w - m, 36, w - m - cs, 36);
    doc.line(w - m, 36, w - m, 36 + cs);
    doc.line(m, h - 14, m + cs, h - 14);
    doc.line(m, h - 14, m, h - 14 - cs);
    doc.line(w - m, h - 14, w - m - cs, h - 14);
    doc.line(w - m, h - 14, w - m, h - 14 - cs);
  }
}

/**
 * Calcula a caixa onde a marca-d'água será desenhada.
 * Mesma fórmula usada em applyWatermarkAndCorners — exposta para o validador.
 */
function computeWatermarkBox(w: number, h: number) {
  const contentTop = LAYOUT.HEADER_BOTTOM + 3;
  const contentBottom = h - LAYOUT.FOOTER_TOP_OFFSET - 6;
  const contentH = contentBottom - contentTop;
  const contentW = w - 28;
  const size = Math.min(contentW, contentH) * LAYOUT.WATERMARK_RATIO;
  const x = (w - size) / 2;
  const y = contentTop + (contentH - size) / 2;
  return { x, y, size };
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

  if (opts.hasWatermark) {
    const wm = computeWatermarkBox(w, h);
    const wmTop = wm.y;
    const wmBottom = wm.y + wm.size;

    if (wmTop < LAYOUT.HEADER_BOTTOM) {
      const overlap = LAYOUT.HEADER_BOTTOM - wmTop;
      problems.push(
        `Marca-d'água invade o cabeçalho em ${overlap.toFixed(1)}mm ` +
        `(topo da watermark y=${wmTop.toFixed(1)}, fim do header y=${LAYOUT.HEADER_BOTTOM})`
      );
    }

    const footerTop = h - LAYOUT.FOOTER_TOP_OFFSET;
    if (wmBottom > footerTop) {
      const overlap = wmBottom - footerTop;
      problems.push(
        `Marca-d'água invade o rodapé em ${overlap.toFixed(1)}mm ` +
        `(base da watermark y=${wmBottom.toFixed(1)}, início do footer y=${footerTop.toFixed(1)})`
      );
    }

    if (wm.size <= 0) {
      problems.push(`Marca-d'água com tamanho inválido (${wm.size.toFixed(1)}mm).`);
    }
  }

  if (problems.length > 0) {
    console.warn(`[pdf:${opts.context}] ⚠️ Validação de layout falhou:`, problems);
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

  // Ordem importa: watermark primeiro (vai pro fundo), header em todas as páginas, footer por último.
  await applyWatermarkAndCorners(doc, profile, 0.05);
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

  await applyWatermarkAndCorners(doc, profile, 0.05);
  await applyHeaderAllPages(doc, profile, torneio.nome, `Torneio · ${new Date(torneio.data).toLocaleDateString('pt-BR')}`);
  footer(doc, profile);
  doc.save(`torneio_${torneio.nome.replace(/\s+/g, '_').toLowerCase()}_${torneio.id.slice(0, 8)}.pdf`);
}
