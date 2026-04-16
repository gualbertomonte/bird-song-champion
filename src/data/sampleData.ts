import { Bird, Tournament, HealthRecord, Nest } from '@/types/bird';

export const sampleBirds: Bird[] = [
  {
    id: '1', codigo_anilha: 'SISPASS 1.5 SP/A 000123', nome: 'Trovão',
    nome_cientifico: 'Sporophila angolensis', nome_comum_especie: 'Curió', sexo: 'M',
    data_nascimento: '2023-03-15', tipo_anilha: 'Fechada',
    diametro_anilha: '2.8mm', status: 'Ativo',
    estado: 'SP', observacoes: 'Excelente cantador, fibra forte.',
  },
  {
    id: '2', codigo_anilha: 'SISPASS 1.5 SP/A 000124', nome: 'Serena',
    nome_cientifico: 'Sporophila angolensis', nome_comum_especie: 'Curió', sexo: 'F',
    data_nascimento: '2023-05-20', tipo_anilha: 'Fechada',
    diametro_anilha: '2.8mm', status: 'Berçário',
    estado: 'SP',
  },
  {
    id: '3', codigo_anilha: 'SISPASS 1.3 MG/B 000567', nome: 'Pavarotti',
    nome_cientifico: 'Serinus canaria', nome_comum_especie: 'Canário', sexo: 'M',
    data_nascimento: '2022-11-10', tipo_anilha: 'Fechada',
    status: 'Ativo', estado: 'MG',
    observacoes: 'Canto melodioso, vencedor de 3 torneios.',
  },
  {
    id: '4', codigo_anilha: 'SISPASS 2.0 RJ/C 000890', nome: 'Relâmpago',
    nome_cientifico: 'Sporophila maximiliani', nome_comum_especie: 'Bicudo', sexo: 'M',
    data_nascimento: '2022-01-08', tipo_anilha: 'Aberta',
    status: 'Ativo', estado: 'RJ',
  },
  {
    id: '5', codigo_anilha: 'SISPASS 1.3 MG/B 000345', nome: 'Aurora',
    nome_cientifico: 'Serinus canaria', nome_comum_especie: 'Canário', sexo: 'F',
    data_nascimento: '2023-07-12',
    status: 'Ativo', estado: 'MG',
  },
  {
    id: '6', codigo_anilha: 'SISPASS 1.5 PR/D 000112', nome: 'Maestro',
    nome_cientifico: 'Sporophila caerulescens', nome_comum_especie: 'Coleirinho', sexo: 'M',
    data_nascimento: '2021-09-01',
    status: 'Vendido', estado: 'PR',
  },
  {
    id: '7', codigo_anilha: 'SISPASS 1.5 SP/A 000789', nome: 'Tempestade',
    nome_cientifico: 'Sporophila angolensis', nome_comum_especie: 'Curió', sexo: 'M',
    data_nascimento: '2024-01-20', tipo_anilha: 'Fechada',
    status: 'Ativo', pai_id: '1', mae_id: '2',
    estado: 'SP', observacoes: 'Filhote do casal Trovão x Serena.',
  },
  {
    id: '8', codigo_anilha: 'SISPASS 2.0 BA/E 000055', nome: 'Imperador',
    nome_cientifico: 'Saltator similis', nome_comum_especie: 'Trinca-ferro', sexo: 'M',
    data_nascimento: '2020-06-15',
    status: 'Ativo', estado: 'BA',
  },
];

export const sampleTournaments: Tournament[] = [
  { id: 't1', bird_id: '1', data: '2025-03-15', nome_torneio: 'Grande Torneio Primavera 2025', clube: 'Clube Curió SP', pontuacao: 847, classificacao: '1º Lugar' },
  { id: 't2', bird_id: '7', data: '2025-03-15', nome_torneio: 'Grande Torneio Primavera 2025', clube: 'Clube Curió SP', pontuacao: 792, classificacao: '2º Lugar' },
  { id: 't3', bird_id: '3', data: '2025-04-10', nome_torneio: 'Copa Aves de Fibra', clube: 'Associação MG', pontuacao: 910, classificacao: '1º Lugar' },
  { id: 't4', bird_id: '4', data: '2025-02-20', nome_torneio: 'Torneio Regional Sul', clube: 'Clube Bicudo RJ', pontuacao: 680, classificacao: 'Finalista' },
  { id: 't5', bird_id: '1', data: '2025-01-10', nome_torneio: 'Abertura da Temporada 2025', clube: 'Clube Curió SP', pontuacao: 780, classificacao: '3º Lugar' },
  { id: 't6', bird_id: '8', data: '2025-04-01', nome_torneio: 'Copa Aves de Fibra', clube: 'Associação MG', pontuacao: 720, classificacao: 'Finalista' },
];

export const sampleHealthRecords: HealthRecord[] = [
  { id: 'h1', bird_id: '1', data: '2025-03-01', tipo: 'Vermifugação', descricao: 'Ivermectina 0.2ml', proxima_dose: '2025-06-01' },
  { id: 'h2', bird_id: '3', data: '2025-04-10', tipo: 'Vitamina', descricao: 'Vitamina E - 1 gota/dia por 10 dias' },
  { id: 'h3', bird_id: '2', data: '2025-02-15', tipo: 'Exame', descricao: 'Sexagem por DNA - Confirmado Fêmea' },
  { id: 'h4', bird_id: '4', data: '2025-01-20', tipo: 'Vacina', descricao: 'Vacina contra varíola aviária', proxima_dose: '2026-01-20' },
  { id: 'h5', bird_id: '7', data: '2025-03-20', tipo: 'Vermifugação', descricao: 'Ivermectina 0.15ml', proxima_dose: '2025-06-20' },
];

export const sampleNests: Nest[] = [
  { id: 'n1', femea_id: '2', macho_id: '1', data_postura: '2025-04-01', quantidade_ovos: 3, status: 'Incubando', observacoes: 'Segundo cruzamento do casal.' },
  { id: 'n2', femea_id: '5', macho_id: '3', data_postura: '2025-03-10', data_eclosao: '2025-03-24', quantidade_ovos: 4, quantidade_filhotes: 3, status: 'Eclodida' },
];
