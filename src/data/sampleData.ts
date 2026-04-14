import { Bird, Tournament, Treatment, Cage } from '@/types/bird';

export const sampleBirds: Bird[] = [
  {
    id: '1', anilha: 'CF-2024-001', nome: 'Trovão', especie: 'Curió',
    sexo: 'macho', dataNascimento: '2023-03-15', cor: 'Preto',
    peso: 28, status: 'ativo', foto: '', notas: 'Excelente cantador, fibra forte.',
  },
  {
    id: '2', anilha: 'CF-2024-002', nome: 'Serena', especie: 'Curió',
    sexo: 'fêmea', dataNascimento: '2023-05-20', cor: 'Parda',
    peso: 25, status: 'ativo', foto: '',
  },
  {
    id: '3', anilha: 'CF-2024-003', nome: 'Pavarotti', especie: 'Canário',
    sexo: 'macho', dataNascimento: '2022-11-10', cor: 'Amarelo',
    peso: 22, status: 'ativo', paiId: undefined, maeId: undefined,
    foto: '', notas: 'Canto melodioso, vencedor de 3 torneios.',
  },
  {
    id: '4', anilha: 'CF-2023-010', nome: 'Relâmpago', especie: 'Bicudo',
    sexo: 'macho', dataNascimento: '2022-01-08', cor: 'Preto',
    peso: 35, status: 'ativo', foto: '',
  },
  {
    id: '5', anilha: 'CF-2023-011', nome: 'Aurora', especie: 'Canário',
    sexo: 'fêmea', dataNascimento: '2023-07-12', cor: 'Amarelo Intenso',
    peso: 20, status: 'ativo', foto: '',
  },
  {
    id: '6', anilha: 'CF-2022-005', nome: 'Maestro', especie: 'Curió',
    sexo: 'macho', dataNascimento: '2021-09-01', cor: 'Preto',
    peso: 30, status: 'vendido', foto: '',
  },
  {
    id: '7', anilha: 'CF-2024-007', nome: 'Tempestade', especie: 'Curió',
    sexo: 'macho', dataNascimento: '2024-01-20', cor: 'Preto',
    peso: 26, status: 'ativo', paiId: '1', maeId: '2', foto: '',
    notas: 'Filhote do casal Trovão x Serena.',
  },
  {
    id: '8', anilha: 'CF-2022-008', nome: 'Solitário', especie: 'Bicudo',
    sexo: 'macho', dataNascimento: '2020-06-15', cor: 'Preto',
    peso: 38, status: 'falecido', foto: '',
  },
];

export const sampleTournaments: Tournament[] = [
  {
    id: 't1', nome: 'Canto do Curió 2025', data: '2025-06-15',
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
    id: 't2', nome: 'Festival Canário de Ouro', data: '2025-08-20',
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
