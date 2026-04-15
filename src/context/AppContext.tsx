import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Bird, Tournament, HealthRecord, Nest, CriadorProfile } from '@/types/bird';
import { sampleBirds, sampleTournaments, sampleHealthRecords, sampleNests } from '@/data/sampleData';

interface AppState {
  birds: Bird[];
  tournaments: Tournament[];
  healthRecords: HealthRecord[];
  nests: Nest[];
  profile: CriadorProfile;
  setBirds: (birds: Bird[]) => void;
  setTournaments: (t: Tournament[]) => void;
  setHealthRecords: (h: HealthRecord[]) => void;
  setNests: (n: Nest[]) => void;
  setProfile: (p: CriadorProfile) => void;
  addBird: (bird: Bird) => void;
  updateBird: (id: string, data: Partial<Bird>) => void;
  deleteBird: (id: string) => void;
  addTournament: (t: Tournament) => void;
  updateTournament: (id: string, data: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  addHealthRecord: (h: HealthRecord) => void;
  deleteHealthRecord: (id: string) => void;
  addNest: (n: Nest) => void;
  updateNest: (id: string, data: Partial<Nest>) => void;
}

const AppContext = createContext<AppState | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

const defaultProfile: CriadorProfile = {
  nome_criadouro: 'Criadouro Aves de Fibra',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [birds, setBirdsState] = useState<Bird[]>(() => load('ppp_birds', sampleBirds));
  const [tournaments, setTournamentsState] = useState<Tournament[]>(() => load('ppp_tournaments', sampleTournaments));
  const [healthRecords, setHealthRecordsState] = useState<HealthRecord[]>(() => load('ppp_health', sampleHealthRecords));
  const [nests, setNestsState] = useState<Nest[]>(() => load('ppp_nests', sampleNests));
  const [profile, setProfileState] = useState<CriadorProfile>(() => load('ppp_profile', defaultProfile));

  const setBirds = useCallback((b: Bird[]) => { setBirdsState(b); save('ppp_birds', b); }, []);
  const setTournaments = useCallback((t: Tournament[]) => { setTournamentsState(t); save('ppp_tournaments', t); }, []);
  const setHealthRecords = useCallback((h: HealthRecord[]) => { setHealthRecordsState(h); save('ppp_health', h); }, []);
  const setNests = useCallback((n: Nest[]) => { setNestsState(n); save('ppp_nests', n); }, []);
  const setProfile = useCallback((p: CriadorProfile) => { setProfileState(p); save('ppp_profile', p); }, []);

  const addBird = useCallback((bird: Bird) => {
    setBirdsState(prev => { const next = [...prev, bird]; save('ppp_birds', next); return next; });
  }, []);
  const updateBird = useCallback((id: string, data: Partial<Bird>) => {
    setBirdsState(prev => { const next = prev.map(b => b.id === id ? { ...b, ...data, updated_at: new Date().toISOString() } : b); save('ppp_birds', next); return next; });
  }, []);
  const deleteBird = useCallback((id: string) => {
    setBirdsState(prev => { const next = prev.filter(b => b.id !== id); save('ppp_birds', next); return next; });
  }, []);

  const addTournament = useCallback((t: Tournament) => {
    setTournamentsState(prev => { const next = [...prev, t]; save('ppp_tournaments', next); return next; });
  }, []);
  const updateTournament = useCallback((id: string, data: Partial<Tournament>) => {
    setTournamentsState(prev => { const next = prev.map(t => t.id === id ? { ...t, ...data } : t); save('ppp_tournaments', next); return next; });
  }, []);
  const deleteTournament = useCallback((id: string) => {
    setTournamentsState(prev => { const next = prev.filter(t => t.id !== id); save('ppp_tournaments', next); return next; });
  }, []);

  const addHealthRecord = useCallback((h: HealthRecord) => {
    setHealthRecordsState(prev => { const next = [...prev, h]; save('ppp_health', next); return next; });
  }, []);
  const deleteHealthRecord = useCallback((id: string) => {
    setHealthRecordsState(prev => { const next = prev.filter(h => h.id !== id); save('ppp_health', next); return next; });
  }, []);

  const addNest = useCallback((n: Nest) => {
    setNestsState(prev => { const next = [...prev, n]; save('ppp_nests', next); return next; });
  }, []);
  const updateNest = useCallback((id: string, data: Partial<Nest>) => {
    setNestsState(prev => { const next = prev.map(n => n.id === id ? { ...n, ...data } : n); save('ppp_nests', next); return next; });
  }, []);

  return (
    <AppContext.Provider value={{
      birds, tournaments, healthRecords, nests, profile,
      setBirds, setTournaments, setHealthRecords, setNests, setProfile,
      addBird, updateBird, deleteBird,
      addTournament, updateTournament, deleteTournament,
      addHealthRecord, deleteHealthRecord,
      addNest, updateNest,
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
