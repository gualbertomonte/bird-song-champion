// Tabela de diâmetros de anilhas — referência: Federação dos Criadores
// https://www.federacaodoscriadores.com.br/📘-anilhas-normas-e-responsabilidades/

export const DIAMETROS_PADRAO = [
  '2.4mm',
  '2.6mm',
  '2.8mm',
  '3.0mm',
  '3.5mm',
  '4.0mm',
  '4.5mm',
  '5.0mm',
] as const;

// Mapa: nome científico -> diâmetro oficial recomendado
export const DIAMETRO_POR_ESPECIE: Record<string, string> = {
  'Sporophila angolensis': '3.0mm',      // Curió
  'Sporophila maximiliani': '3.5mm',     // Bicudo
  'Saltator similis': '4.0mm',           // Trinca-ferro
  'Cyanoloxia brissonii': '3.5mm',       // Azulão
  'Paroaria dominicana': '4.0mm',        // Cardeal
  'Sporophila caerulescens': '2.4mm',    // Coleirinho
  'Sporophila nigricollis': '2.4mm',     // Baiano
  'Sporophila frontalis': '3.0mm',       // Pixoxó
  'Sporophila leucoptera': '2.6mm',      // Chorão
  'Serinus canaria': '2.8mm',            // Canário
  'Sicalis flaveola': '2.8mm',           // Canário-da-terra
  'Carduelis magellanica': '2.6mm',      // Pintassilgo
};
