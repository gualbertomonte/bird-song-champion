import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { Bird, Tournament, HealthRecord, Nest, CriadorProfile } from '@/types/bird';
import { BirdLoan, AppNotification } from '@/types/loan';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppState {
  birds: Bird[];
  tournaments: Tournament[];
  healthRecords: HealthRecord[];
  nests: Nest[];
  profile: CriadorProfile;
  loans: BirdLoan[];
  notifications: AppNotification[];
  loading: boolean;
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
  createLoan: (params: { birdId: string; codigoCriadouro: string; prazo?: string; observacoes?: string }) => Promise<void>;
  requestLoanReturn: (loanId: string) => Promise<void>;
  confirmLoanReturn: (loanId: string) => Promise<void>;
  cancelLoan: (loanId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const defaultProfile: CriadorProfile = { nome_criadouro: '' };

const MIGRATION_FLAG = 'ppp_migrated_to_cloud_v1';

// Map DB row -> Bird
function rowToBird(r: any): Bird {
  return {
    id: r.id,
    nome: r.nome ?? '',
    nome_cientifico: r.nome_cientifico ?? '',
    nome_comum_especie: r.nome_comum_especie ?? undefined,
    sexo: r.sexo,
    data_nascimento: r.data_nascimento ?? undefined,
    tipo_anilha: r.tipo_anilha ?? undefined,
    diametro_anilha: r.diametro_anilha ?? undefined,
    codigo_anilha: r.codigo_anilha ?? '',
    status: r.status,
    observacoes: r.observacoes ?? undefined,
    pai_id: r.pai_id ?? undefined,
    mae_id: r.mae_id ?? undefined,
    foto_url: r.foto_url ?? undefined,
    fotos: Array.isArray(r.fotos) ? r.fotos : [],
    estado: r.estado ?? undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    transferido_por_email: r.transferido_por_email ?? undefined,
    transferido_em: r.transferido_em ?? undefined,
    loan_status: r.loan_status ?? 'proprio',
    loan_id: r.loan_id ?? undefined,
    original_owner_user_id: r.original_owner_user_id ?? undefined,
    original_owner_email: r.original_owner_email ?? undefined,
    original_bird_id: r.original_bird_id ?? undefined,
  };
}

function rowToLoan(r: any): BirdLoan {
  return {
    id: r.id, bird_id: r.bird_id, bird_snapshot: r.bird_snapshot ?? {},
    owner_user_id: r.owner_user_id, owner_email: r.owner_email ?? undefined,
    borrower_user_id: r.borrower_user_id ?? undefined, borrower_email: r.borrower_email,
    borrower_codigo_criadouro: r.borrower_codigo_criadouro ?? undefined,
    borrower_bird_id: r.borrower_bird_id ?? undefined,
    data_emprestimo: r.data_emprestimo, prazo_devolucao: r.prazo_devolucao ?? undefined,
    data_solicitacao_devolucao: r.data_solicitacao_devolucao ?? undefined,
    data_devolucao: r.data_devolucao ?? undefined,
    status: r.status, observacoes: r.observacoes ?? undefined,
    filhotes_gerados: r.filhotes_gerados ?? 0,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

function rowToNotification(r: any): AppNotification {
  return {
    id: r.id, user_id: r.user_id, tipo: r.tipo, titulo: r.titulo,
    mensagem: r.mensagem ?? undefined, link: r.link ?? undefined,
    lida: r.lida, metadata: r.metadata ?? {}, created_at: r.created_at,
  };
}

function birdToRow(b: Partial<Bird>, userId: string) {
  return {
    user_id: userId,
    nome: b.nome ?? '',
    nome_cientifico: b.nome_cientifico ?? '',
    nome_comum_especie: b.nome_comum_especie ?? null,
    sexo: b.sexo ?? 'I',
    data_nascimento: b.data_nascimento || null,
    tipo_anilha: b.tipo_anilha ?? null,
    diametro_anilha: b.diametro_anilha ?? null,
    codigo_anilha: b.codigo_anilha ?? '',
    status: b.status ?? 'Ativo',
    observacoes: b.observacoes ?? null,
    pai_id: b.pai_id || null,
    mae_id: b.mae_id || null,
    foto_url: b.foto_url ?? null,
    fotos: b.fotos ?? [],
    estado: b.estado ?? null,
  };
}

function rowToTournament(r: any): Tournament {
  return {
    id: r.id, bird_id: r.bird_id, data: r.data, nome_torneio: r.nome_torneio,
    clube: r.clube ?? undefined, pontuacao: Number(r.pontuacao),
    classificacao: r.classificacao ?? undefined, created_at: r.created_at,
  };
}
function rowToHealth(r: any): HealthRecord {
  return {
    id: r.id, bird_id: r.bird_id, data: r.data, tipo: r.tipo,
    descricao: r.descricao ?? undefined, proxima_dose: r.proxima_dose ?? undefined,
  };
}
function rowToNest(r: any): Nest {
  return {
    id: r.id, femea_id: r.femea_id, macho_id: r.macho_id,
    data_postura: r.data_postura, data_eclosao: r.data_eclosao ?? undefined,
    quantidade_ovos: r.quantidade_ovos, quantidade_filhotes: r.quantidade_filhotes ?? undefined,
    status: r.status, observacoes: r.observacoes ?? undefined, created_at: r.created_at,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [birds, setBirdsState] = useState<Bird[]>([]);
  const [tournaments, setTournamentsState] = useState<Tournament[]>([]);
  const [healthRecords, setHealthRecordsState] = useState<HealthRecord[]>([]);
  const [nests, setNestsState] = useState<Nest[]>([]);
  const [profile, setProfileState] = useState<CriadorProfile>(defaultProfile);
  const [loans, setLoansState] = useState<BirdLoan[]>([]);
  const [notifications, setNotificationsState] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const idMapRef = useRef<Map<string, string>>(new Map()); // localId -> cloudId during migration

  // Load all data from Supabase
  const loadAll = useCallback(async (uid: string, userEmail?: string) => {
    setLoading(true);
    try {
      const [b, t, h, n, p, l, nt] = await Promise.all([
        supabase.from('birds').select('*').order('created_at', { ascending: true }),
        supabase.from('tournaments').select('*').order('data', { ascending: false }),
        supabase.from('health_records').select('*').order('data', { ascending: false }),
        supabase.from('nests').select('*').order('created_at', { ascending: false }),
        supabase.from('criador_profile').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('bird_loans').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      ]);
      setBirdsState((b.data || []).map(rowToBird));
      setTournamentsState((t.data || []).map(rowToTournament));
      setHealthRecordsState((h.data || []).map(rowToHealth));
      setNestsState((n.data || []).map(rowToNest));
      setLoansState((l.data || []).map(rowToLoan));
      setNotificationsState((nt.data || []).map(rowToNotification));
      if (p.data) {
        setProfileState({
          nome_criadouro: p.data.nome_criadouro ?? '',
          cpf: p.data.cpf ?? undefined,
          registro_ctf: p.data.registro_ctf ?? undefined,
          validade_ctf: p.data.validade_ctf ?? undefined,
          endereco: p.data.endereco ?? undefined,
          telefone: p.data.telefone ?? undefined,
          logo_url: p.data.logo_url ?? undefined,
          codigo_criadouro: (p.data as any).codigo_criadouro ?? undefined,
        });
      } else {
        setProfileState(defaultProfile);
      }
    } catch (err) {
      console.error('Load error', err);
      toast.error('Erro ao carregar dados da nuvem');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot migration of localStorage -> cloud
  const migrateLocalToCloud = useCallback(async (uid: string) => {
    const flagKey = `${MIGRATION_FLAG}_${uid}`;
    if (localStorage.getItem(flagKey)) return false;

    const read = (k: string) => {
      try { return JSON.parse(localStorage.getItem(`ppp_${uid}_${k}`) || 'null'); } catch { return null; }
    };
    const localBirds: any[] = read('birds') || [];
    const localTournaments: any[] = read('tournaments') || [];
    const localHealth: any[] = read('health') || [];
    const localNests: any[] = read('nests') || [];
    const localProfile: any = read('profile');

    const hasAny = localBirds.length || localTournaments.length || localHealth.length || localNests.length || localProfile;
    if (!hasAny) {
      localStorage.setItem(flagKey, '1');
      return false;
    }

    try {
      // Insert birds first (without parent refs), build id map
      const idMap = new Map<string, string>();
      if (localBirds.length) {
        const rows = localBirds.map((b: any) => {
          const normalized = { ...b, nome: b.nome || b.nome_comum || '' };
          return birdToRow(normalized, uid);
        });
        const { data, error } = await supabase.from('birds').insert(rows).select('id');
        if (error) throw error;
        (data || []).forEach((r: any, i: number) => {
          if (localBirds[i]?.id) idMap.set(localBirds[i].id, r.id);
        });
        // Second pass: update parent refs
        const updates = localBirds.map((b: any, i: number) => {
          const cloudId = data?.[i]?.id;
          if (!cloudId) return null;
          const pai = b.pai_id ? idMap.get(b.pai_id) : null;
          const mae = b.mae_id ? idMap.get(b.mae_id) : null;
          if (!pai && !mae) return null;
          return supabase.from('birds').update({ pai_id: pai, mae_id: mae }).eq('id', cloudId);
        }).filter(Boolean);
        await Promise.all(updates as any);
      }

      if (localTournaments.length) {
        const rows = localTournaments.map((t: any) => ({
          user_id: uid,
          bird_id: idMap.get(t.bird_id) || null,
          data: t.data, nome_torneio: t.nome_torneio,
          clube: t.clube ?? null, pontuacao: t.pontuacao ?? 0,
          classificacao: t.classificacao ?? null,
        })).filter(r => r.bird_id);
        if (rows.length) await supabase.from('tournaments').insert(rows);
      }

      if (localHealth.length) {
        const rows = localHealth.map((h: any) => ({
          user_id: uid,
          bird_id: idMap.get(h.bird_id) || null,
          data: h.data, tipo: h.tipo,
          descricao: h.descricao ?? null, proxima_dose: h.proxima_dose ?? null,
        })).filter(r => r.bird_id);
        if (rows.length) await supabase.from('health_records').insert(rows);
      }

      if (localNests.length) {
        const rows = localNests.map((n: any) => ({
          user_id: uid,
          femea_id: idMap.get(n.femea_id) || null,
          macho_id: idMap.get(n.macho_id) || null,
          data_postura: n.data_postura, data_eclosao: n.data_eclosao ?? null,
          quantidade_ovos: n.quantidade_ovos ?? 0,
          quantidade_filhotes: n.quantidade_filhotes ?? null,
          status: n.status ?? 'Incubando', observacoes: n.observacoes ?? null,
        })).filter(r => r.femea_id && r.macho_id);
        if (rows.length) await supabase.from('nests').insert(rows);
      }

      if (localProfile) {
        await supabase.from('criador_profile').upsert({
          user_id: uid,
          nome_criadouro: localProfile.nome_criadouro ?? '',
          cpf: localProfile.cpf ?? null,
          registro_ctf: localProfile.registro_ctf ?? null,
          validade_ctf: localProfile.validade_ctf || null,
          endereco: localProfile.endereco ?? null,
          telefone: localProfile.telefone ?? null,
          logo_url: localProfile.logo_url ?? null,
        });
      }

      localStorage.setItem(flagKey, '1');
      idMapRef.current = idMap;
      toast.success('Dados locais sincronizados com a nuvem!');
      return true;
    } catch (err) {
      console.error('Migration error', err);
      toast.error('Erro ao migrar dados locais para a nuvem.');
      return false;
    }
  }, []);

  // Boot: migrate then load
  useEffect(() => {
    if (!user) {
      setBirdsState([]); setTournamentsState([]); setHealthRecordsState([]);
      setNestsState([]); setProfileState(defaultProfile); setLoading(false);
      return;
    }
    (async () => {
      await migrateLocalToCloud(user.id);
      await loadAll(user.id, user.email);
    })();
  }, [user, migrateLocalToCloud, loadAll]);

  // Claim pending transfers on login (insert into birds, one by one to track sender)
  useEffect(() => {
    if (!user?.email || loading) return;
    (async () => {
      try {
        const { data: transfers } = await supabase
          .from('pending_transfers').select('*').eq('claimed', false)
          .ilike('recipient_email', user.email!);
        if (!transfers?.length) return;

        let claimedCount = 0;
        const insertedBirds: any[] = [];
        for (const t of transfers as any[]) {
          const bd = (t.bird_data || {}) as any;
          const row: any = birdToRow({ ...bd, pai_id: undefined, mae_id: undefined }, user.id);
          row.transferido_por_email = t.sender_email ?? t.transferido_por_email ?? null;
          row.transferido_em = t.transferred_at ?? new Date().toISOString();
          const { data: ins, error } = await supabase.from('birds').insert(row).select('*').single();
          if (error) {
            // Likely duplicate ring code already claimed — mark as claimed to avoid loop
            console.error('Claim insert error:', error);
            if ((error as any).code === '23505') {
              toast.error(`Ave "${bd.nome || bd.codigo_anilha}" já existe no seu plantel (anilha duplicada).`);
              await supabase.from('pending_transfers').update({ claimed: true }).eq('id', t.id);
            }
            continue;
          }
          insertedBirds.push(ins);
          await supabase.from('pending_transfers').update({ claimed: true }).eq('id', t.id);
          claimedCount++;
        }
        if (insertedBirds.length) {
          setBirdsState(prev => [...prev, ...insertedBirds.map(rowToBird)]);
          toast.success(`${claimedCount} ave(s) transferida(s) adicionadas ao seu plantel!`);
        }
      } catch (err) { console.error('Claim transfers error', err); }
    })();
  }, [user?.email, user?.id, loading]);

  // ============ Realtime sync across devices ============
  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    const channel = supabase
      .channel(`realtime-user-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'birds', filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nb = rowToBird(payload.new);
          setBirdsState(prev => prev.some(b => b.id === nb.id) ? prev : [...prev, nb]);
        } else if (payload.eventType === 'UPDATE') {
          const nb = rowToBird(payload.new);
          setBirdsState(prev => prev.map(b => b.id === nb.id ? nb : b));
        } else if (payload.eventType === 'DELETE') {
          setBirdsState(prev => prev.filter(b => b.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nt = rowToTournament(payload.new);
          setTournamentsState(prev => prev.some(t => t.id === nt.id) ? prev : [nt, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const nt = rowToTournament(payload.new);
          setTournamentsState(prev => prev.map(t => t.id === nt.id ? nt : t));
        } else if (payload.eventType === 'DELETE') {
          setTournamentsState(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'health_records', filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nh = rowToHealth(payload.new);
          setHealthRecordsState(prev => prev.some(h => h.id === nh.id) ? prev : [nh, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const nh = rowToHealth(payload.new);
          setHealthRecordsState(prev => prev.map(h => h.id === nh.id ? nh : h));
        } else if (payload.eventType === 'DELETE') {
          setHealthRecordsState(prev => prev.filter(h => h.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nests', filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nn = rowToNest(payload.new);
          setNestsState(prev => prev.some(n => n.id === nn.id) ? prev : [nn, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const nn = rowToNest(payload.new);
          setNestsState(prev => prev.map(n => n.id === nn.id ? nn : n));
        } else if (payload.eventType === 'DELETE') {
          setNestsState(prev => prev.filter(n => n.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'criador_profile', filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        const p: any = payload.new;
        setProfileState({
          nome_criadouro: p.nome_criadouro ?? '',
          cpf: p.cpf ?? undefined,
          registro_ctf: p.registro_ctf ?? undefined,
          validade_ctf: p.validade_ctf ?? undefined,
          endereco: p.endereco ?? undefined,
          telefone: p.telefone ?? undefined,
          logo_url: p.logo_url ?? undefined,
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bird_loans' }, (payload) => {
        const isMine = (row: any) => row && (row.owner_user_id === uid || row.borrower_user_id === uid);
        if (payload.eventType === 'INSERT' && isMine(payload.new)) {
          const nl = rowToLoan(payload.new);
          setLoansState(prev => prev.some(l => l.id === nl.id) ? prev : [nl, ...prev]);
        } else if (payload.eventType === 'UPDATE' && isMine(payload.new)) {
          const nl = rowToLoan(payload.new);
          setLoansState(prev => prev.map(l => l.id === nl.id ? nl : l));
        } else if (payload.eventType === 'DELETE') {
          setLoansState(prev => prev.filter(l => l.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nn = rowToNotification(payload.new);
          setNotificationsState(prev => prev.some(n => n.id === nn.id) ? prev : [nn, ...prev]);
          toast.message(nn.titulo, { description: nn.mensagem });
        } else if (payload.eventType === 'UPDATE') {
          const nn = rowToNotification(payload.new);
          setNotificationsState(prev => prev.map(n => n.id === nn.id ? nn : n));
        } else if (payload.eventType === 'DELETE') {
          setNotificationsState(prev => prev.filter(n => n.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ============ Bird CRUD ============
  const addBird = useCallback(async (bird: Bird) => {
    if (!user) return;
    const { data, error } = await supabase.from('birds').insert(birdToRow(bird, user.id)).select('*').single();
    if (error) {
      if ((error as any).code === '23505') {
        toast.error(`Já existe uma ave cadastrada com a anilha "${bird.codigo_anilha}".`);
      } else {
        toast.error('Erro ao salvar ave');
      }
      console.error(error);
      throw error;
    }
    setBirdsState(prev => [...prev, rowToBird(data)]);
  }, [user]);

  const updateBird = useCallback(async (id: string, data: Partial<Bird>) => {
    if (!user) return;
    const patch: any = {};
    const allowed: (keyof Bird)[] = ['nome','nome_cientifico','nome_comum_especie','sexo','data_nascimento','tipo_anilha','diametro_anilha','codigo_anilha','status','observacoes','pai_id','mae_id','foto_url','fotos','estado'];
    allowed.forEach(k => { if (k in data) patch[k] = (data as any)[k] ?? null; });
    if (patch.data_nascimento === '') patch.data_nascimento = null;
    const { data: row, error } = await supabase.from('birds').update(patch).eq('id', id).select('*').single();
    if (error) {
      if ((error as any).code === '23505') {
        toast.error(`Já existe uma ave cadastrada com essa numeração de anilha.`);
      } else {
        toast.error('Erro ao atualizar');
      }
      console.error(error);
      throw error;
    }
    setBirdsState(prev => prev.map(b => b.id === id ? rowToBird(row) : b));
  }, [user]);

  const deleteBird = useCallback(async (id: string) => {
    const { error } = await supabase.from('birds').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); console.error(error); return; }
    setBirdsState(prev => prev.filter(b => b.id !== id));
  }, []);

  // ============ Tournaments ============
  const addTournament = useCallback(async (t: Tournament) => {
    if (!user) return;
    const { data, error } = await supabase.from('tournaments').insert({
      user_id: user.id, bird_id: t.bird_id, data: t.data, nome_torneio: t.nome_torneio,
      clube: t.clube ?? null, pontuacao: t.pontuacao, classificacao: t.classificacao ?? null,
    }).select('*').single();
    if (error) { toast.error('Erro ao salvar torneio'); console.error(error); return; }
    setTournamentsState(prev => [rowToTournament(data), ...prev]);
  }, [user]);

  const updateTournament = useCallback(async (id: string, data: Partial<Tournament>) => {
    const patch: any = {};
    ['bird_id','data','nome_torneio','clube','pontuacao','classificacao'].forEach(k => {
      if (k in data) patch[k] = (data as any)[k] ?? null;
    });
    const { data: row, error } = await supabase.from('tournaments').update(patch).eq('id', id).select('*').single();
    if (error) { toast.error('Erro ao atualizar'); console.error(error); return; }
    setTournamentsState(prev => prev.map(t => t.id === id ? rowToTournament(row) : t));
  }, []);

  const deleteTournament = useCallback(async (id: string) => {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    setTournamentsState(prev => prev.filter(t => t.id !== id));
  }, []);

  // ============ Health ============
  const addHealthRecord = useCallback(async (h: HealthRecord) => {
    if (!user) return;
    const { data, error } = await supabase.from('health_records').insert({
      user_id: user.id, bird_id: h.bird_id, data: h.data, tipo: h.tipo,
      descricao: h.descricao ?? null, proxima_dose: h.proxima_dose || null,
    }).select('*').single();
    if (error) { toast.error('Erro ao salvar'); console.error(error); return; }
    setHealthRecordsState(prev => [rowToHealth(data), ...prev]);
  }, [user]);

  const deleteHealthRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from('health_records').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    setHealthRecordsState(prev => prev.filter(h => h.id !== id));
  }, []);

  // ============ Nests ============
  const addNest = useCallback(async (n: Nest) => {
    if (!user) return;
    const { data, error } = await supabase.from('nests').insert({
      user_id: user.id, femea_id: n.femea_id, macho_id: n.macho_id,
      data_postura: n.data_postura, data_eclosao: n.data_eclosao || null,
      quantidade_ovos: n.quantidade_ovos, quantidade_filhotes: n.quantidade_filhotes ?? null,
      status: n.status, observacoes: n.observacoes ?? null,
    }).select('*').single();
    if (error) { toast.error('Erro ao salvar ninhada'); console.error(error); return; }
    setNestsState(prev => [rowToNest(data), ...prev]);
  }, [user]);

  const updateNest = useCallback(async (id: string, data: Partial<Nest>) => {
    const patch: any = {};
    ['femea_id','macho_id','data_postura','data_eclosao','quantidade_ovos','quantidade_filhotes','status','observacoes'].forEach(k => {
      if (k in data) patch[k] = (data as any)[k] ?? null;
    });
    const { data: row, error } = await supabase.from('nests').update(patch).eq('id', id).select('*').single();
    if (error) { toast.error('Erro ao atualizar'); console.error(error); return; }
    setNestsState(prev => prev.map(n => n.id === id ? rowToNest(row) : n));
  }, []);

  // ============ Profile ============
  const setProfile = useCallback(async (p: CriadorProfile) => {
    if (!user) return;
    setProfileState(prev => ({ ...p, codigo_criadouro: prev.codigo_criadouro ?? p.codigo_criadouro }));
    const { data, error } = await supabase.from('criador_profile').upsert({
      user_id: user.id,
      nome_criadouro: p.nome_criadouro ?? '',
      cpf: p.cpf ?? null,
      registro_ctf: p.registro_ctf ?? null,
      validade_ctf: p.validade_ctf || null,
      endereco: p.endereco ?? null,
      telefone: p.telefone ?? null,
      logo_url: p.logo_url ?? null,
    }).select('*').single();
    if (error) { toast.error('Erro ao salvar perfil'); console.error(error); return; }
    if (data) {
      setProfileState({
        nome_criadouro: data.nome_criadouro ?? '',
        cpf: data.cpf ?? undefined,
        registro_ctf: data.registro_ctf ?? undefined,
        validade_ctf: data.validade_ctf ?? undefined,
        endereco: data.endereco ?? undefined,
        telefone: data.telefone ?? undefined,
        logo_url: data.logo_url ?? undefined,
        codigo_criadouro: (data as any).codigo_criadouro ?? undefined,
      });
    }
  }, [user]);

  // ============ Loans ============
  const sendLoanEmail = useCallback(async (payload: any) => {
    try {
      await supabase.functions.invoke('send-loan-email', { body: payload });
    } catch (e) { console.error('send-loan-email error', e); }
  }, []);

  const createNotification = useCallback(async (n: Omit<AppNotification, 'id' | 'created_at' | 'lida'> & { lida?: boolean }) => {
    try {
      await supabase.from('notifications').insert({
        user_id: n.user_id, tipo: n.tipo, titulo: n.titulo,
        mensagem: n.mensagem ?? null, link: n.link ?? null,
        metadata: n.metadata ?? {},
      });
    } catch (e) { console.error('createNotification error', e); }
  }, []);

  const createLoan = useCallback(async (params: { birdId: string; codigoCriadouro: string; prazo?: string; observacoes?: string }) => {
    if (!user) throw new Error('not authenticated');
    const bird = birds.find(b => b.id === params.birdId);
    if (!bird) throw new Error('Ave não encontrada');
    if (bird.loan_status !== 'proprio') throw new Error('Esta ave já está em empréstimo');

    // 1. Localizar destinatário pelo código
    const codigo = params.codigoCriadouro.trim().toUpperCase();
    const { data: destProfile, error: destErr } = await supabase
      .from('criador_profile').select('user_id, nome_criadouro')
      .eq('codigo_criadouro', codigo).maybeSingle();
    if (destErr) { console.error(destErr); throw new Error('Erro ao buscar criadouro'); }
    if (!destProfile) throw new Error('Código de criadouro não encontrado');
    if (destProfile.user_id === user.id) throw new Error('Você não pode emprestar para si mesmo');

    // 2. Buscar e-mail do destinatário
    const { data: destAuth, error: destAuthErr } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', destProfile.user_id)
      .maybeSingle();
    if (destAuthErr) {
      console.error(destAuthErr);
      throw new Error('Erro ao localizar o e-mail do destinatário');
    }
    const borrowerEmail = destAuth?.email?.trim();
    if (!borrowerEmail) throw new Error('Não foi possível localizar o e-mail do destinatário');

    // 3. Criar registro de loan
    const snapshot = { ...bird };
    const { data: loanRow, error: loanErr } = await supabase.from('bird_loans').insert({
      bird_id: bird.id,
      bird_snapshot: snapshot as any,
      owner_user_id: user.id,
      owner_email: user.email,
      borrower_user_id: destProfile.user_id,
      borrower_email: borrowerEmail,
      borrower_codigo_criadouro: codigo,
      prazo_devolucao: params.prazo || null,
      observacoes: params.observacoes ?? null,
      status: 'Emprestada',
    }).select('*').single();
    if (loanErr) { console.error(loanErr); throw new Error('Erro ao criar empréstimo'); }

    // 4. Marcar a ave do dono como emprestada (saída)
    await supabase.from('birds').update({
      loan_status: 'emprestada_saida',
      loan_id: loanRow.id,
    }).eq('id', bird.id);

    // 5. Clonar a ave no plantel do recebedor (anilha permanece igual; usamos código com prefixo para evitar conflito de unique)
    const clonedAnilha = bird.codigo_anilha; // mantém anilha original; se houver conflito, será capturado
    const cloneRow: any = {
      user_id: destProfile.user_id,
      nome: bird.nome,
      nome_cientifico: bird.nome_cientifico,
      nome_comum_especie: bird.nome_comum_especie ?? null,
      sexo: bird.sexo,
      data_nascimento: bird.data_nascimento || null,
      tipo_anilha: bird.tipo_anilha ?? null,
      diametro_anilha: bird.diametro_anilha ?? null,
      codigo_anilha: clonedAnilha,
      status: bird.status,
      observacoes: bird.observacoes ?? null,
      foto_url: bird.foto_url ?? null,
      fotos: bird.fotos ?? [],
      estado: bird.estado ?? null,
      loan_status: 'emprestada_entrada',
      loan_id: loanRow.id,
      original_owner_user_id: user.id,
      original_owner_email: user.email,
      original_bird_id: bird.id,
    };
    const { data: cloneData, error: cloneErr } = await supabase.from('birds').insert(cloneRow).select('id').single();
    if (cloneErr) {
      // Se duplicada, ainda assim segue — ave do recebedor pode existir; registramos só o loan
      console.warn('Clone bird failed (provavelmente anilha duplicada no plantel do destinatário)', cloneErr);
    } else if (cloneData) {
      await supabase.from('bird_loans').update({ borrower_bird_id: cloneData.id }).eq('id', loanRow.id);
    }

    // 6. Notificações
    await createNotification({
      user_id: destProfile.user_id,
      tipo: 'loan_received',
      titulo: 'Você recebeu uma ave por empréstimo',
      mensagem: `${user.email} emprestou a ave "${bird.nome}" (${bird.codigo_anilha}) para reprodução.`,
      link: '/emprestimos',
      metadata: { loan_id: loanRow.id },
    });

    // 7. E-mail
    sendLoanEmail({
      kind: 'novo_emprestimo',
      recipientEmail: borrowerEmail,
      birdName: bird.nome,
      birdCode: bird.codigo_anilha,
      ownerName: profile.nome_criadouro || user.email,
      prazo: params.prazo,
    });

    // 8. Atualizar estado local
    setBirdsState(prev => prev.map(b => b.id === bird.id ? { ...b, loan_status: 'emprestada_saida', loan_id: loanRow.id } : b));
    setLoansState(prev => [rowToLoan(loanRow), ...prev]);
    toast.success(`Ave emprestada para ${destProfile.nome_criadouro}!`);
  }, [user, birds, profile, createNotification, sendLoanEmail]);

  const requestLoanReturn = useCallback(async (loanId: string) => {
    if (!user) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const { data, error } = await supabase.from('bird_loans').update({
      status: 'Devolucao_Solicitada',
      data_solicitacao_devolucao: new Date().toISOString(),
    }).eq('id', loanId).select('*').single();
    if (error) { toast.error('Erro ao solicitar devolução'); return; }

    if (loan.borrower_user_id) {
      await createNotification({
        user_id: loan.borrower_user_id,
        tipo: 'loan_return_requested',
        titulo: 'Pedido de devolução de ave',
        mensagem: `${user.email} solicitou a devolução da ave "${loan.bird_snapshot?.nome || ''}".`,
        link: '/emprestimos',
        metadata: { loan_id: loanId },
      });
    }
    sendLoanEmail({
      kind: 'solicitacao_devolucao',
      recipientEmail: loan.borrower_email,
      birdName: loan.bird_snapshot?.nome,
      birdCode: loan.bird_snapshot?.codigo_anilha,
      ownerName: profile.nome_criadouro || user.email,
    });
    setLoansState(prev => prev.map(l => l.id === loanId ? rowToLoan(data) : l));
    toast.success('Solicitação de devolução enviada');
  }, [user, loans, profile, createNotification, sendLoanEmail]);

  const confirmLoanReturn = useCallback(async (loanId: string) => {
    if (!user) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // Executa toda a devolução de forma atômica via RPC SECURITY DEFINER
    // (recebedor não tem permissão para mexer na ave do dono nem deletar a própria via RLS)
    const { error: rpcError } = await supabase.rpc('confirm_loan_return' as any, { _loan_id: loanId });
    if (rpcError) {
      toast.error(rpcError.message || 'Erro ao confirmar devolução');
      return;
    }

    // Recarrega o empréstimo atualizado para refletir status/data_devolucao
    const { data } = await supabase.from('bird_loans').select('*').eq('id', loanId).single();

    // 4. Notificar o dono
    await createNotification({
      user_id: loan.owner_user_id,
      tipo: 'loan_returned',
      titulo: 'Devolução confirmada',
      mensagem: `${user.email} confirmou a devolução da ave "${loan.bird_snapshot?.nome || ''}".`,
      link: '/emprestimos',
      metadata: { loan_id: loanId },
    });
    if (loan.owner_email) {
      sendLoanEmail({
        kind: 'devolucao_confirmada',
        recipientEmail: loan.owner_email,
        birdName: loan.bird_snapshot?.nome,
        birdCode: loan.bird_snapshot?.codigo_anilha,
        borrowerName: profile.nome_criadouro || user.email,
      });
    }

    setLoansState(prev => prev.map(l => l.id === loanId ? (data ? rowToLoan(data) : { ...l, status: 'Devolvida', data_devolucao: new Date().toISOString() }) : l));
    setBirdsState(prev => prev
      .filter(b => b.id !== loan.borrower_bird_id && !(b.original_bird_id === loan.bird_id && b.loan_status === 'emprestada_entrada'))
      .map(b => b.id === loan.bird_id ? { ...b, loan_status: 'proprio', loan_id: undefined } : b)
    );
    toast.success('Devolução confirmada!');
  }, [user, loans, profile, createNotification, sendLoanEmail]);

  const cancelLoan = useCallback(async (loanId: string) => {
    if (!user) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.owner_user_id !== user.id) return;
    const { error } = await supabase.rpc('cancel_loan' as any, { _loan_id: loanId });
    if (error) { toast.error(error.message || 'Erro ao cancelar empréstimo'); return; }
    setLoansState(prev => prev.map(l => l.id === loanId ? { ...l, status: 'Devolvida', data_devolucao: new Date().toISOString() } : l));
    setBirdsState(prev => prev.filter(b => b.id !== loan.borrower_bird_id).map(b => b.id === loan.bird_id ? { ...b, loan_status: 'proprio', loan_id: undefined } : b));
    toast.success('Empréstimo cancelado');
  }, [user, loans]);

  // ============ Notifications ============
  const markNotificationRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ lida: true }).eq('id', id);
    setNotificationsState(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ lida: true }).eq('user_id', user.id).eq('lida', false);
    setNotificationsState(prev => prev.map(n => ({ ...n, lida: true })));
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotificationsState(prev => prev.filter(n => n.id !== id));
  }, []);

  // Bulk setters (kept for API compatibility, just update local state)
  const setBirds = useCallback((b: Bird[]) => setBirdsState(b), []);
  const setTournaments = useCallback((t: Tournament[]) => setTournamentsState(t), []);
  const setHealthRecords = useCallback((h: HealthRecord[]) => setHealthRecordsState(h), []);
  const setNests = useCallback((n: Nest[]) => setNestsState(n), []);

  return (
    <AppContext.Provider value={{
      birds, tournaments, healthRecords, nests, profile, loans, notifications, loading,
      setBirds, setTournaments, setHealthRecords, setNests, setProfile,
      addBird, updateBird, deleteBird,
      addTournament, updateTournament, deleteTournament,
      addHealthRecord, deleteHealthRecord,
      addNest, updateNest,
      createLoan, requestLoanReturn, confirmLoanReturn, cancelLoan,
      markNotificationRead, markAllNotificationsRead, deleteNotification,
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
