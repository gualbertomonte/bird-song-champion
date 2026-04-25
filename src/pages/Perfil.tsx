import { useAppState, DEFAULT_MOBILE_NAV, MobileNavKey, MobileNavItemConfig } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, Upload, Check, Loader2, Lock, Eye, EyeOff, Copy, Hash, Smartphone, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const NAV_LABELS: Record<MobileNavKey, string> = {
  dashboard: 'Dashboard',
  plantel: 'Plantel',
  arvore: 'Árvore Genealógica',
  bercario: 'Berçário',
  emprestimos: 'Empréstimos',
  torneios: 'Torneios',
  saude: 'Saúde',
  perfil: 'Perfil',
};

export default function Perfil() {
  const { profile, setProfile, mobileNavConfig, setMobileNavConfig } = useAppState();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handlePasswordChange = async () => {
    if (newPw.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('As senhas não coincidem');
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) {
      toast.error(error.message || 'Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso!');
      setNewPw('');
      setConfirmPw('');
    }
  };

  const fields = [
    { key: 'nome_criadouro', label: 'Nome do Criadouro', required: true },
    { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
    { key: 'registro_ctf', label: 'Registro CTF/IBAMA' },
    { key: 'validade_ctf', label: 'Validade CTF', type: 'date' },
    { key: 'endereco', label: 'Endereço Completo' },
    { key: 'telefone', label: 'Telefone', placeholder: '(00) 00000-0000' },
  ] as const;

  const filledCount = fields.filter(f => form[f.key as keyof typeof form]).length;
  const progress = Math.round((filledCount / fields.length) * 100);

  const save = () => {
    if (!form.nome_criadouro?.trim()) {
      toast.error('Nome do criadouro é obrigatório');
      return;
    }
    setProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Perfil atualizado!');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Use até 5 MB.');
      return;
    }
    setUploadingLogo(true);
    try {
      const path = `${user.id}/logo-${Date.now()}.${file.name.split('.').pop() || 'png'}`;
      const { error } = await supabase.storage.from('bird-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('bird-photos').getPublicUrl(path);
      const next = { ...form, logo_url: data.publicUrl };
      setForm(next);
      // Persiste imediatamente para que PDFs/crachás já usem a logo
      await setProfile(next);
      toast.success('✅ Logo salva! Será usada nos seus PDFs, crachás digitais e árvore genealógica.', {
        duration: 5000,
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <p className="label-eyebrow mb-1">Identidade</p>
        <h1 className="page-title">Perfil do Criador</h1>
        <p className="page-subtitle">Dados oficiais do criadouro</p>
      </div>

      {/* Profile strength */}
      <div className="card-premium p-5 animate-fade-in">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Força do Perfil</span>
          <span className="number-serif text-lg font-semibold text-secondary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {progress < 100 ? `Preencha ${fields.length - filledCount} campo(s) restante(s) para completar seu perfil` : 'Perfil completo! ✨'}
        </p>
      </div>

      {/* Código do Criadouro */}
      {profile.codigo_criadouro && (
        <div className="card-premium bg-gradient-to-br from-secondary/10 via-card to-card border-secondary/30 p-5 animate-fade-in glow-gold" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-secondary" />
            <h3 className="heading-serif font-semibold text-base">Código do Criadouro</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Compartilhe este código com outros criadores para receber aves emprestadas para reprodução.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-card border-2 border-dashed border-secondary/30 rounded-lg px-4 py-3 font-mono text-xl font-bold tracking-[0.3em] text-center text-secondary">
              {profile.codigo_criadouro}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profile.codigo_criadouro!);
                toast.success('Código copiado!');
              }}
              className="btn-secondary"
              title="Copiar código"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Logo */}
      <div className="card-premium p-5 animate-fade-in space-y-4" style={{ animationDelay: '100ms' }}>
        <div>
          <h3 className="heading-serif font-semibold text-base">Logo do Criadouro</h3>
          <p className="text-xs text-muted-foreground mt-1">Identidade visual do seu plantel</p>
        </div>

        {/* Aviso explicativo: para que serve a logo */}
        <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-secondary mb-1">📄 Onde sua logo será usada</p>
          <p>
            A imagem enviada aqui funciona como <strong className="text-foreground">papel timbrado</strong> do seu criadouro e aparecerá automaticamente em:
          </p>
          <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
            <li>Todos os <strong className="text-foreground">PDFs</strong> gerados (relatórios de plantel, recibos de empréstimo, torneios)</li>
            <li><strong className="text-foreground">Crachás digitais</strong> das suas aves</li>
            <li><strong className="text-foreground">Marca d'água</strong> na árvore genealógica</li>
          </ul>
          <p className="mt-2 italic">Recomendado: imagem quadrada (512×512px), PNG com fundo transparente.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Pré-visualização da logo" className="w-full h-full object-contain" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <label className="btn-secondary cursor-pointer text-xs">
              {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploadingLogo ? 'Enviando...' : form.logo_url ? 'Trocar Logo' : 'Enviar Logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP · até 5 MB</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card-premium p-5 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="heading-serif font-semibold text-base">Dados Oficiais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={f.key === 'endereco' ? 'sm:col-span-2' : ''}>
              <label className="text-xs font-medium text-muted-foreground">
                {f.label} {'required' in f && f.required && '*'}
              </label>
              <input
                type={('type' in f && f.type) || 'text'}
                value={(form as any)[f.key] || ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={'placeholder' in f ? f.placeholder : undefined}
                className="mt-1 input-field"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={save} className="btn-primary">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Salvo!' : 'Salvar Perfil'}
          </button>
        </div>
      </div>

      {/* Barra de Navegação Mobile */}
      <div className="card-premium p-5 space-y-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-secondary" />
          <h3 className="heading-serif font-semibold text-base">Barra de Navegação Mobile</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Escolha quais atalhos aparecem na barra inferior do celular e em que ordem. Recomendado: 4 a 6 itens visíveis.
        </p>
        {(() => {
          const visibleCount = mobileNavConfig.filter(c => c.visible).length;
          const move = (idx: number, dir: -1 | 1) => {
            const next = [...mobileNavConfig];
            const target = idx + dir;
            if (target < 0 || target >= next.length) return;
            [next[idx], next[target]] = [next[target], next[idx]];
            setMobileNavConfig(next);
          };
          const toggle = (idx: number) => {
            const next = mobileNavConfig.map((c, i) => i === idx ? { ...c, visible: !c.visible } : c);
            if (next.filter(c => c.visible).length === 0) {
              toast.error('Mantenha pelo menos 1 item visível');
              return;
            }
            setMobileNavConfig(next);
          };
          const reset = () => {
            setMobileNavConfig([...DEFAULT_MOBILE_NAV]);
            toast.success('Barra restaurada para o padrão');
          };
          return (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className={visibleCount > 6 ? 'text-destructive' : 'text-muted-foreground'}>
                  {visibleCount} item(s) visível(is)
                </span>
                <button onClick={reset} className="flex items-center gap-1 text-secondary hover:underline">
                  <RotateCcw className="w-3 h-3" /> Restaurar padrão
                </button>
              </div>
              <ul className="divide-y border rounded-lg overflow-hidden">
                {mobileNavConfig.map((item, idx) => (
                  <li key={item.key} className="flex items-center gap-2 px-3 py-2 bg-background/40">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={() => toggle(idx)}
                      className="w-4 h-4 accent-secondary"
                    />
                    <span className={`flex-1 text-sm ${item.visible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {NAV_LABELS[item.key]}
                    </span>
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30" aria-label="Mover para cima">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => move(idx, 1)} disabled={idx === mobileNavConfig.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30" aria-label="Mover para baixo">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          );
        })()}
      </div>

      {/* Alterar Senha */}
      <div className="card-premium p-5 space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-secondary" />
          <h3 className="heading-serif font-semibold text-base">Alterar Senha</h3>
        </div>
        {user?.email && (
          <p className="text-xs text-muted-foreground">Conta: {user.email}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nova Senha</label>
            <div className="relative mt-1">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Confirmar Nova Senha</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repita a senha"
              className="input-field mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={handlePasswordChange}
            disabled={changingPw || !newPw || !confirmPw}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {changingPw ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
