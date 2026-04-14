import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Bird, Tournament, Treatment, Cage } from '@/types/bird';
import { sampleBirds, sampleTournaments, sampleTreatments, sampleCages } from '@/data/sampleData';

interface AppState {
  birds: Bird[];
  tournaments: Tournament[];
  treatments: Treatment[];
  cages: Cage[];
  setBirds: (birds: Bird[]) => void;
  setTournaments: (t: Tournament[]) => void;
  setTreatments: (t: Treatment[]) => void;
  setCages: (c: Cage[]) => void;
  addBird: (bird: Bird) => void;
  updateBird: (id: string, data: Partial<Bird>) => void;
  deleteBird: (id: string) => void;
  addTournament: (t: Tournament) => void;
  updateTournament: (id: string, data: Partial<Tournament>) => void;
}

const AppContext = createContext<AppState | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota exceeded */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [birds, setBirdsState] = useState<Bird[]>(() => loadFromStorage('avf_birds', sampleBirds));
  const [tournaments, setTournamentsState] = useState<Tournament[]>(() => loadFromStorage('avf_tournaments', sampleTournaments));
  const [treatments, setTreatmentsState] = useState<Treatment[]>(() => loadFromStorage('avf_treatments', sampleTreatments));
  const [cages, setCagesState] = useState<Cage[]>(() => loadFromStorage('avf_cages', sampleCages));

  const setBirds = useCallback((b: Bird[]) => { setBirdsState(b); saveToStorage('avf_birds', b); }, []);
  const setTournaments = useCallback((t: Tournament[]) => { setTournamentsState(t); saveToStorage('avf_tournaments', t); }, []);
  const setTreatments = useCallback((t: Treatment[]) => { setTreatmentsState(t); saveToStorage('avf_treatments', t); }, []);
  const setCages = useCallback((c: Cage[]) => { setCagesState(c); saveToStorage('avf_cages', c); }, []);

  // Fixed: use functional updates to avoid stale closure bugs
  const addBird = useCallback((bird: Bird) => {
    setBirdsState(prev => {
      const next = [...prev, bird];
      saveToStorage('avf_birds', next);
      return next;
    });
  }, []);

  const updateBird = useCallback((id: string, data: Partial<Bird>) => {
    setBirdsState(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...data } : b);
      saveToStorage('avf_birds', next);
      return next;
    });
  }, []);

  const deleteBird = useCallback((id: string) => {
    setBirdsState(prev => {
      const next = prev.filter(b => b.id !== id);
      saveToStorage('avf_birds', next);
      return next;
    });
  }, []);

  const addTournament = useCallback((t: Tournament) => {
    setTournamentsState(prev => {
      const next = [...prev, t];
      saveToStorage('avf_tournaments', next);
      return next;
    });
  }, []);

  const updateTournament = useCallback((id: string, data: Partial<Tournament>) => {
    setTournamentsState(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...data } : t);
      saveToStorage('avf_tournaments', next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      birds, tournaments, treatments, cages,
      setBirds, setTournaments, setTreatments, setCages,
      addBird, updateBird, deleteBird, addTournament, updateTournament,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
