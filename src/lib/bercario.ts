import { Bird, Nest } from '@/types/bird';

const JANELA_DIAS = 30;

/**
 * Conta filhotes já registrados para um ninho.
 * Filtra birds com mae_id/pai_id do ninho, gerado_no_bercario,
 * e data_nascimento dentro de janela de 30 dias após postura.
 */
export function countEclodidos(nest: Nest, birds: Bird[]): number {
  const postura = new Date(nest.data_postura).getTime();
  const limite = postura + JANELA_DIAS * 86400000;
  return birds.filter(b => {
    if (!b.gerado_no_bercario) return false;
    if (b.mae_id !== nest.femea_id || b.pai_id !== nest.macho_id) return false;
    if (!b.data_nascimento) return false;
    const nasc = new Date(b.data_nascimento).getTime();
    return nasc >= postura && nasc <= limite;
  }).length;
}

export function isAtivo(nest: Nest): boolean {
  return nest.status === 'Incubando' || nest.status === 'Eclosao Parcial';
}
