import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { Plus, Check } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function NomeCientificoCombobox({ value, onChange }: Props) {
  const { birds } = useAppState();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const [customNames, setCustomNames] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ppp_nomes_cientificos') || '[]');
    } catch { return []; }
  });
  const ref = useRef<HTMLDivElement>(null);

  const allNames = useMemo(() => {
    const fromBirds = birds.map(b => b.nome_cientifico).filter(Boolean);
    return [...new Set([...fromBirds, ...customNames])].sort();
  }, [birds, customNames]);

  const filtered = useMemo(() => {
    if (!input) return allNames;
    return allNames.filter(n => n.toLowerCase().includes(input.toLowerCase()));
  }, [allNames, input]);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addCustom = () => {
    if (!input.trim() || allNames.includes(input.trim())) return;
    const updated = [...customNames, input.trim()];
    setCustomNames(updated);
    localStorage.setItem('ppp_nomes_cientificos', JSON.stringify(updated));
    onChange(input.trim());
    setOpen(false);
  };

  const select = (name: string) => {
    onChange(name);
    setInput(name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-medium text-muted-foreground">Nome Científico *</label>
      <input
        value={input}
        onChange={e => { setInput(e.target.value); onChange(e.target.value); setOpen(true); }}
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
              <span className="italic">{name}</span>
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
}
