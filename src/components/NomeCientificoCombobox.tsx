import { forwardRef, useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Plus, Check } from 'lucide-react';

const SPECIES_MAP: Record<string, string> = {
  'Sporophila angolensis': 'Curió',
  'Sporophila maximiliani': 'Bicudo',
  'Serinus canaria': 'Canário',
  'Sporophila caerulescens': 'Coleirinho',
  'Sporophila nigricollis': 'Baiano',
  'Saltator similis': 'Trinca-ferro',
  'Sicalis flaveola': 'Canário-da-terra',
  'Sporophila frontalis': 'Pixoxó',
  'Sporophila leucoptera': 'Chorão',
  'Carduelis magellanica': 'Pintassilgo',
  'Paroaria dominicana': 'Cardeal',
  'Cyanoloxia brissonii': 'Azulão',
};

interface Props {
  value: string;
  onChange: (val: string) => void;
  nomeComum?: string;
  onNomeComumChange?: (val: string) => void;
}

const NomeCientificoCombobox = forwardRef<HTMLDivElement, Props>(function NomeCientificoCombobox(
  { value, onChange, nomeComum, onNomeComumChange },
  forwardedRef,
) {
  const { birds } = useAppState();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const [customSpecies, setCustomSpecies] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('ppp_species_map') || '{}');
    } catch {
      return {};
    }
  });
  const internalRef = useRef<HTMLDivElement>(null);

  const allSpecies = useMemo(() => {
    const fromBirds: Record<string, string> = {};
    birds.forEach(b => {
      if (b.nome_cientifico) {
        fromBirds[b.nome_cientifico] = b.nome_comum_especie || SPECIES_MAP[b.nome_cientifico] || '';
      }
    });
    return { ...SPECIES_MAP, ...fromBirds, ...customSpecies };
  }, [birds, customSpecies]);

  const allNames = useMemo(() => Object.keys(allSpecies).sort(), [allSpecies]);

  const filtered = useMemo(() => {
    if (!input) return allNames;
    const q = input.toLowerCase();
    return allNames.filter(n => n.toLowerCase().includes(q) || (allSpecies[n] || '').toLowerCase().includes(q));
  }, [allNames, allSpecies, input]);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (internalRef.current && !internalRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const setRefs = (node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const addCustom = () => {
    if (!input.trim() || allNames.includes(input.trim())) return;
    const updated = { ...customSpecies, [input.trim()]: nomeComum || '' };
    setCustomSpecies(updated);
    localStorage.setItem('ppp_species_map', JSON.stringify(updated));
    onChange(input.trim());
    setOpen(false);
  };

  const select = (name: string) => {
    onChange(name);
    setInput(name);
    const common = allSpecies[name];
    if (common && onNomeComumChange) {
      onNomeComumChange(common);
    }
    setOpen(false);
  };

  return (
    <div ref={setRefs} className="relative">
      <label className="text-xs font-medium text-muted-foreground">Nome Científico *</label>
      <input
        value={input}
        onChange={e => {
          setInput(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="mt-1 input-field"
        placeholder="Sporophila angolensis"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(name => (
            <button
              key={name}
              onClick={() => select(name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40 transition-colors flex items-center gap-2"
            >
              {name === value && <Check className="w-3 h-3 text-secondary" />}
              <span className="flex-1">
                <span className="italic">{name}</span>
                {allSpecies[name] && <span className="text-muted-foreground ml-2">({allSpecies[name]})</span>}
              </span>
            </button>
          ))}
          {input.trim() && !allNames.includes(input.trim()) && (
            <button
              onClick={addCustom}
              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/10 transition-colors flex items-center gap-2 text-secondary border-t"
            >
              <Plus className="w-3 h-3" /> Adicionar "{input.trim()}"
            </button>
          )}
          {filtered.length === 0 && !input.trim() && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum nome cadastrado</p>
          )}
        </div>
      )}
    </div>
  );
});

export default NomeCientificoCombobox;
