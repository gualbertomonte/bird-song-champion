import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bird, CriadorProfile } from '@/types/bird';
import type { BirdLoan } from '@/types/loan';

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const sexoLabel = (s?: string) => s === 'M' ? 'Macho' : s === 'F' ? 'Fêmea' : 'A definir';

function header(doc: jsPDF, profile: CriadorProfile, title: string, subtitle?: string) {
  doc.setFillColor(11, 59, 42); // primary green
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, 'F');

  doc.setTextColor(212, 175, 55); // gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(profile.nome_criadouro || 'Criadouro', 14, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const meta: string[] = [];
  if (profile.codigo_criadouro) meta.push(`Cód: ${profile.codigo_criadouro}`);
  if (profile.registro_ctf) meta.push(`CTF/IBAMA: ${profile.registro_ctf}`);
  if (profile.cpf) meta.push(`CPF: ${profile.cpf}`);
  doc.text(meta.join('  ·  '), 14, 16);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 14, 32);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, 14, 38);
  }
  doc.setTextColor(0, 0, 0);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} por Plantel Pro+`, 14, h - 8);
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 8, { align: 'right' });
  }
}

/* ─────────── Recibo de Empréstimo ─────────── */
export function generateLoanReceiptPDF(loan: BirdLoan, profile: CriadorProfile) {
  const doc = new jsPDF();
  const snap = (loan.bird_snapshot || {}) as any;
  header(doc, profile, 'Recibo de Empréstimo de Ave', `Documento Nº ${loan.id.slice(0, 8).toUpperCase()}`);

  let y = 48;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Partes envolvidas', 14, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Cedente (proprietário): ${loan.owner_email || '—'}`, 14, y); y += 5;
  doc.text(`Recebedor: ${loan.borrower_email}${loan.borrower_codigo_criadouro ? ` (cód. ${loan.borrower_codigo_criadouro})` : ''}`, 14, y); y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Dados da ave', 14, y); y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [11, 59, 42], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
    body: [
      ['Nome', snap.nome || '—', 'Anilha', snap.codigo_anilha || '—'],
      ['Espécie', snap.nome_cientifico || '—', 'Sexo', sexoLabel(snap.sexo)],
      ['Nascimento', fmtDate(snap.data_nascimento), 'Diâmetro', snap.diametro_anilha || '—'],
      ['Tipo anilha', snap.tipo_anilha || '—', 'Estado', snap.estado || '—'],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Condições do empréstimo', 14, y); y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [11, 59, 42], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
    body: [
      ['Data do empréstimo', fmtDate(loan.data_emprestimo)],
      ['Prazo previsto', fmtDate(loan.prazo_devolucao)],
      ['Status atual', loan.status.replace('_', ' ')],
      ['Observações', loan.observacoes || '—'],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const termo =
    'Declaramos que a ave acima descrita foi cedida em empréstimo para fins de reprodução, ' +
    'permanecendo a propriedade do cedente. O recebedor compromete-se a zelar pelo bem-estar ' +
    'da ave e devolvê-la conforme combinado. Filhotes gerados durante o empréstimo pertencem ao recebedor.';
  doc.text(doc.splitTextToSize(termo, 180), 14, y);

  y += 26;
  doc.setDrawColor(180, 180, 180);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Cedente', 55, y + 5, { align: 'center' });
  doc.text('Recebedor', 155, y + 5, { align: 'center' });

  footer(doc);
  doc.save(`recibo_emprestimo_${loan.id.slice(0, 8)}.pdf`);
}

/* ─────────── Relatório de Plantel (formato SISPASS-like) ─────────── */
export function generatePlantelReportPDF(birds: Bird[], profile: CriadorProfile) {
  const doc = new jsPDF({ orientation: 'landscape' });
  header(
    doc,
    profile,
    'Relatório de Plantel',
    `Total de aves: ${birds.length}  ·  Emitido em ${new Date().toLocaleDateString('pt-BR')}`
  );

  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    headStyles: { fillColor: [11, 59, 42], textColor: [212, 175, 55], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
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
      3: { cellWidth: 40, fontStyle: 'italic' },
    },
  });

  // Resumo
  let y = (doc as any).lastAutoTable.finalY + 8;
  if (y > 180) { doc.addPage(); y = 20; }
  const counts = {
    ativos: birds.filter(b => b.status === 'Ativo').length,
    bercario: birds.filter(b => b.status === 'Berçário').length,
    vendidos: birds.filter(b => b.status === 'Vendido').length,
    falecidos: birds.filter(b => b.status === 'Falecido').length,
    machos: birds.filter(b => b.sexo === 'M').length,
    femeas: birds.filter(b => b.sexo === 'F').length,
  };
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Resumo', 14, y); y += 2;
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 9 },
    body: [
      ['Ativos', String(counts.ativos), 'Berçário', String(counts.bercario)],
      ['Vendidos', String(counts.vendidos), 'Falecidos', String(counts.falecidos)],
      ['Machos', String(counts.machos), 'Fêmeas', String(counts.femeas)],
    ],
  });

  footer(doc);
  doc.save(`plantel_${new Date().toISOString().slice(0, 10)}.pdf`);
}
