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

export function AppProvider({ children }: { children: ReactNode }) {
  const [birds, setBirdsState] = useState<Bird[]>(() => loadFromStorage('avf_birds', sampleBirds));
  const [tournaments, setTournamentsState] = useState<Tournament[]>(() => loadFromStorage('avf_tournaments', sampleTournaments));
  const [treatments, setTreatmentsState] = useState<Treatment[]>(() => loadFromStorage('avf_treatments', sampleTreatments));
  const [cages, setCagesState] = useState<Cage[]>(() => loadFromStorage('avf_cages', sampleCages));

  const setBirds = useCallback((b: Bird[]) => { setBirdsState(b); localStorage.setItem('avf_birds', JSON.stringify(b)); }, []);
  const setTournaments = useCallback((t: Tournament[]) => { setTournamentsState(t); localStorage.setItem('avf_tournaments', JSON.stringify(t)); }, []);
  const setTreatments = useCallback((t: Treatment[]) => { setTreatmentsState(t); localStorage.setItem('avf_treatments', JSON.stringify(t)); }, []);
  const setCages = useCallback((c: Cage[]) => { setCagesState(c); localStorage.setItem('avf_cages', JSON.stringify(c)); }, []);

  const addBird = useCallback((bird: Bird) => {
    setBirds([...birds, bird]);
  }, [birds, setBirds]);

  const updateBird = useCallback((id: string, data: Partial<Bird>) => {
    setBirds(birds.map(b => b.id === id ? { ...b, ...data } : b));
  }, [birds, setBirds]);

  const deleteBird = useCallback((id: string) => {
    setBirds(birds.filter(b => b.id !== id));
  }, [birds, setBirds]);

  const addTournament = useCallback((t: Tournament) => {
    setTournaments([...tournaments, t]);
  }, [tournaments, setTournaments]);

  const updateTournament = useCallback((id: string, data: Partial<Tournament>) => {
    setTournaments(tournaments.map(t => t.id === id ? { ...t, ...data } : t));
  }, [tournaments, setTournaments]);

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
