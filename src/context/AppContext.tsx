import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Bird, Tournament, HealthRecord, Nest, CriadorProfile } from '@/types/bird';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

function userKey(uid: string, key: string) {
  return `ppp_${uid}_${key}`;
}

function load<T>(uid: string, key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(userKey(uid, key));
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    if (key === 'birds' && Array.isArray(parsed)) {
      return parsed.map((b: any) => {
        const { nome_comum, gaiola, cor, ...rest } = b;
        return { ...rest, nome: b.nome || nome_comum || '' };
      }) as T;
    }
    return parsed;
  } catch { return fallback; }
}

function save<T>(uid: string, key: string, data: T) {
  try { localStorage.setItem(userKey(uid, key), JSON.stringify(data)); } catch { /* quota */ }
}

const defaultProfile: CriadorProfile = {
  nome_criadouro: '',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id || 'anon';

  const [birds, setBirdsState] = useState<Bird[]>(() => load(uid, 'birds', []));
  const [tournaments, setTournamentsState] = useState<Tournament[]>(() => load(uid, 'tournaments', []));
  const [healthRecords, setHealthRecordsState] = useState<HealthRecord[]>(() => load(uid, 'health', []));
  const [nests, setNestsState] = useState<Nest[]>(() => load(uid, 'nests', []));
  const [profile, setProfileState] = useState<CriadorProfile>(() => load(uid, 'profile', defaultProfile));

  // Reload data when user changes
  useEffect(() => {
    setBirdsState(load(uid, 'birds', []));
    setTournamentsState(load(uid, 'tournaments', []));
    setHealthRecordsState(load(uid, 'health', []));
    setNestsState(load(uid, 'nests', []));
    setProfileState(load(uid, 'profile', defaultProfile));
  }, [uid]);

  // Claim pending transfers on login
  useEffect(() => {
    if (!user?.email) return;
    
    const claimTransfers = async () => {
      try {
        const { data: transfers, error } = await supabase
          .from('pending_transfers')
          .select('*')
          .eq('claimed', false)
          .ilike('recipient_email', user.email!);
        
        if (error || !transfers?.length) return;

        const newBirds: Bird[] = [];
        for (const t of transfers) {
          const birdData = t.bird_data as any;
          if (birdData) {
            newBirds.push({
              ...birdData,
              id: birdData.id || `transfer-${t.id}`,
            });
          }
          // Mark as claimed
          await supabase
            .from('pending_transfers')
            .update({ claimed: true })
            .eq('id', t.id);
        }

        if (newBirds.length > 0) {
          setBirdsState(prev => {
            const existingIds = new Set(prev.map(b => b.id));
            const unique = newBirds.filter(b => !existingIds.has(b.id));
            if (unique.length === 0) return prev;
            const next = [...prev, ...unique];
            save(uid, 'birds', next);
            return next;
          });
          toast.success(`${newBirds.length} ave(s) transferida(s) foram adicionadas ao seu plantel!`);
        }
      } catch (err) {
        console.error('Error claiming transfers:', err);
      }
    };

    claimTransfers();
  }, [user?.email, uid]);

  const setBirds = useCallback((b: Bird[]) => { setBirdsState(b); save(uid, 'birds', b); }, [uid]);
  const setTournaments = useCallback((t: Tournament[]) => { setTournamentsState(t); save(uid, 'tournaments', t); }, [uid]);
  const setHealthRecords = useCallback((h: HealthRecord[]) => { setHealthRecordsState(h); save(uid, 'health', h); }, [uid]);
  const setNests = useCallback((n: Nest[]) => { setNestsState(n); save(uid, 'nests', n); }, [uid]);
  const setProfile = useCallback((p: CriadorProfile) => { setProfileState(p); save(uid, 'profile', p); }, [uid]);

  const addBird = useCallback((bird: Bird) => {
    setBirdsState(prev => { const next = [...prev, bird]; save(uid, 'birds', next); return next; });
  }, [uid]);
  const updateBird = useCallback((id: string, data: Partial<Bird>) => {
    setBirdsState(prev => { const next = prev.map(b => b.id === id ? { ...b, ...data, updated_at: new Date().toISOString() } : b); save(uid, 'birds', next); return next; });
  }, [uid]);
  const deleteBird = useCallback((id: string) => {
    setBirdsState(prev => { const next = prev.filter(b => b.id !== id); save(uid, 'birds', next); return next; });
  }, [uid]);

  const addTournament = useCallback((t: Tournament) => {
    setTournamentsState(prev => { const next = [...prev, t]; save(uid, 'tournaments', next); return next; });
  }, [uid]);
  const updateTournament = useCallback((id: string, data: Partial<Tournament>) => {
    setTournamentsState(prev => { const next = prev.map(t => t.id === id ? { ...t, ...data } : t); save(uid, 'tournaments', next); return next; });
  }, [uid]);
  const deleteTournament = useCallback((id: string) => {
    setTournamentsState(prev => { const next = prev.filter(t => t.id !== id); save(uid, 'tournaments', next); return next; });
  }, [uid]);

  const addHealthRecord = useCallback((h: HealthRecord) => {
    setHealthRecordsState(prev => { const next = [...prev, h]; save(uid, 'health', next); return next; });
  }, [uid]);
  const deleteHealthRecord = useCallback((id: string) => {
    setHealthRecordsState(prev => { const next = prev.filter(h => h.id !== id); save(uid, 'health', next); return next; });
  }, [uid]);

  const addNest = useCallback((n: Nest) => {
    setNestsState(prev => { const next = [...prev, n]; save(uid, 'nests', next); return next; });
  }, [uid]);
  const updateNest = useCallback((id: string, data: Partial<Nest>) => {
    setNestsState(prev => { const next = prev.map(n => n.id === id ? { ...n, ...data } : n); save(uid, 'nests', next); return next; });
  }, [uid]);

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
