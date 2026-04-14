import { Bird, Tournament, Treatment, Cage } from '@/types/bird';

export const sampleBirds: Bird[] = [
  {
    id: '1', anilha: 'CF-2024-001', nome: 'Trovão', especie: 'Curió',
    nomeCientifico: 'Sporophila angolensis',
    sexo: 'macho', dataNascimento: '2023-03-15', cor: 'Preto',
    status: 'ativo', sispass: 'SIS-2024-00123', estado: 'SP',
    notas: 'Excelente cantador, fibra forte.',
  },
  {
    id: '2', anilha: 'CF-2024-002', nome: 'Serena', especie: 'Curió',
    nomeCientifico: 'Sporophila angolensis',
    sexo: 'fêmea', dataNascimento: '2023-05-20', cor: 'Parda',
    status: 'ativo', sispass: 'SIS-2024-00124', estado: 'SP',
  },
  {
    id: '3', anilha: 'CF-2024-003', nome: 'Pavarotti', especie: 'Canário',
    nomeCientifico: 'Serinus canaria',
    sexo: 'macho', dataNascimento: '2022-11-10', cor: 'Amarelo',
    status: 'ativo', sispass: 'SIS-2022-00567', estado: 'MG',
    notas: 'Canto melodioso, vencedor de 3 torneios.',
  },
  {
    id: '4', anilha: 'CF-2023-010', nome: 'Relâmpago', especie: 'Bicudo',
    nomeCientifico: 'Sporophila maximiliani',
    sexo: 'macho', dataNascimento: '2022-01-08', cor: 'Preto',
    status: 'ativo', sispass: 'SIS-2022-00890', estado: 'RJ',
  },
  {
    id: '5', anilha: 'CF-2023-011', nome: 'Aurora', especie: 'Canário',
    nomeCientifico: 'Serinus canaria',
    sexo: 'fêmea', dataNascimento: '2023-07-12', cor: 'Amarelo Intenso',
    status: 'ativo', sispass: 'SIS-2023-00345', estado: 'MG',
  },
  {
    id: '6', anilha: 'CF-2022-005', nome: 'Maestro', especie: 'Coleiro',
    nomeCientifico: 'Sporophila caerulescens',
    sexo: 'macho', dataNascimento: '2021-09-01', cor: 'Verde/Preto',
    status: 'vendido', sispass: 'SIS-2021-00112', estado: 'PR',
  },
  {
    id: '7', anilha: 'CF-2024-007', nome: 'Tempestade', especie: 'Curió',
    nomeCientifico: 'Sporophila angolensis',
    sexo: 'macho', dataNascimento: '2024-01-20', cor: 'Preto',
    status: 'ativo', paiId: '1', maeId: '2', sispass: 'SIS-2024-00789', estado: 'SP',
    notas: 'Filhote do casal Trovão x Serena.',
  },
  {
    id: '8', anilha: 'CF-2022-008', nome: 'Imperador', especie: 'Trinca-Ferro',
    nomeCientifico: 'Saltator similis',
    sexo: 'macho', dataNascimento: '2020-06-15', cor: 'Verde Oliva',
    status: 'ativo', sispass: 'SIS-2020-00055', estado: 'BA',
  },
];

export const sampleTournaments: Tournament[] = [
  {
    id: 't1', nome: 'Grande Torneio Primavera 2025', data: '2025-06-15',
    especiePermitida: 'Curió', numJuizes: 3, status: 'finalizado',
    criterios: ['Ritmo', 'Potência', 'Variedade', 'Melodia'],
    inscricoes: [
      {
        id: 'e1', aveId: '1', aveNome: 'Trovão', aveAnilha: 'CF-2024-001',
        avaliacoes: [
          { juizNome: 'João Silva', notas: { Ritmo: 9, Potência: 10, Variedade: 8, Melodia: 9 }, media: 9 },
          { juizNome: 'Maria Souza', notas: { Ritmo: 8, Potência: 9, Variedade: 9, Melodia: 8 }, media: 8.5 },
          { juizNome: 'Carlos Lima', notas: { Ritmo: 9, Potência: 9, Variedade: 8, Melodia: 9 }, media: 8.75 },
        ],
        mediaFinal: 8.75,
      },
      {
        id: 'e2', aveId: '4', aveNome: 'Relâmpago', aveAnilha: 'CF-2023-010',
        avaliacoes: [
          { juizNome: 'João Silva', notas: { Ritmo: 7, Potência: 8, Variedade: 7, Melodia: 7 }, media: 7.25 },
          { juizNome: 'Maria Souza', notas: { Ritmo: 8, Potência: 7, Variedade: 8, Melodia: 7 }, media: 7.5 },
          { juizNome: 'Carlos Lima', notas: { Ritmo: 7, Potência: 8, Variedade: 7, Melodia: 8 }, media: 7.5 },
        ],
        mediaFinal: 7.42,
      },
      {
        id: 'e3', aveId: '7', aveNome: 'Tempestade', aveAnilha: 'CF-2024-007',
        avaliacoes: [
          { juizNome: 'João Silva', notas: { Ritmo: 8, Potência: 9, Variedade: 9, Melodia: 8 }, media: 8.5 },
          { juizNome: 'Maria Souza', notas: { Ritmo: 9, Potência: 8, Variedade: 8, Melodia: 9 }, media: 8.5 },
          { juizNome: 'Carlos Lima', notas: { Ritmo: 8, Potência: 8, Variedade: 9, Melodia: 9 }, media: 8.5 },
        ],
        mediaFinal: 8.5,
      },
    ],
  },
  {
    id: 't2', nome: 'Copa Aves de Fibra', data: '2025-08-20',
    especiePermitida: 'Canário', numJuizes: 2, status: 'aberto',
    criterios: ['Ritmo', 'Potência', 'Variedade'],
    inscricoes: [],
  },
];

export const sampleTreatments: Treatment[] = [
  { id: 'tr1', aveId: '1', medicamento: 'Ivermectina', dataInicio: '2025-03-01', dataFim: '2025-03-07', dosagem: '0.2ml/dia' },
  { id: 'tr2', aveId: '3', medicamento: 'Vitamina E', dataInicio: '2025-04-10', dataFim: '2025-04-20', dosagem: '1 gota/dia' },
];

export const sampleCages: Cage[] = [
  { id: 'g1', codigo: 'G-001', tipo: 'Voo', localizacao: 'Sala A', aveId: '1' },
  { id: 'g2', codigo: 'G-002', tipo: 'Cria', localizacao: 'Sala A', aveId: '2' },
  { id: 'g3', codigo: 'G-003', tipo: 'Torneio', localizacao: 'Sala B', aveId: '3' },
  { id: 'g4', codigo: 'G-004', tipo: 'Voo', localizacao: 'Sala B', aveId: '4' },
  { id: 'g5', codigo: 'G-005', tipo: 'Cria', localizacao: 'Sala A' },
];
