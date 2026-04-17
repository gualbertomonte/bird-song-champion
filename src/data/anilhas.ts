// Tabela de diâmetros de anilhas — referência: Federação dos Criadores
// https://www.federacaodoscriadores.com.br/📘-anilhas-normas-e-responsabilidades/

export const DIAMETROS_PADRAO = [
  '2.2mm',
  '2.4mm',
  '2.5mm',
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
  'Saltator similis': '3.5mm',              // Trinca-ferro
  'Sporophila caerulescens': '2.2mm',       // Coleiro / Coleirinho
  'Sporophila nigricollis': '2.2mm',        // Papa-capim / Baiano
  'Sporophila angolensis': '2.6mm',         // Curió
  'Sporophila maximiliani': '3.0mm',        // Bicudo
  'Sicalis flaveola': '2.8mm',              // Canário-da-terra-verdadeiro
  'Cyanoloxia brissonii': '2.8mm',          // Azulão
  'Turdus rufiventris': '4.0mm',            // Sabiá-laranjeira
  'Paroaria dominicana': '3.5mm',           // Cardeal
  'Spinus magellanicus': '2.5mm',           // Pintassilgo
  'Stephanophorus diadematus': '2.8mm',     // Sanhaço-frade
};

// Mapa: nome científico -> nome comum oficial
export const NOME_COMUM_POR_ESPECIE: Record<string, string> = {
  'Saltator similis': 'Trinca-ferro',
  'Sporophila caerulescens': 'Coleiro',
  'Sporophila nigricollis': 'Papa-capim',
  'Sporophila angolensis': 'Curió',
  'Sporophila maximiliani': 'Bicudo',
  'Sicalis flaveola': 'Canário-da-terra-verdadeiro',
  'Cyanoloxia brissonii': 'Azulão',
  'Turdus rufiventris': 'Sabiá-laranjeira',
  'Paroaria dominicana': 'Cardeal',
  'Spinus magellanicus': 'Pintassilgo',
  'Stephanophorus diadematus': 'Sanhaço-frade',
};
