import { useAppState } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, Upload, Check, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function Perfil() {
  const { profile, setProfile } = useAppState();
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
    setUploadingLogo(true);
    try {
      const path = `${user.id}/logo-${Date.now()}.${file.name.split('.').pop() || 'png'}`;
      const { error } = await supabase.storage.from('bird-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('bird-photos').getPublicUrl(path);
      setForm({ ...form, logo_url: data.publicUrl });
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
        <h1 className="page-title">Perfil do Criador</h1>
        <p className="page-subtitle">Dados oficiais do criadouro</p>
      </div>

      {/* Profile strength */}
      <div className="bg-card rounded-xl border p-5 animate-fade-in">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Força do Perfil</span>
          <span className="text-sm font-bold text-secondary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {progress < 100 ? `Preencha ${fields.length - filledCount} campo(s) restante(s) para completar seu perfil` : 'Perfil completo! ✨'}
        </p>
      </div>

      {/* Logo */}
      <div className="bg-card rounded-xl border p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold mb-3">Logo do Criadouro</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <label className="btn-secondary cursor-pointer text-xs">
              {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
            <p className="text-xs text-muted-foreground mt-1">PNG ou JPG</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border p-5 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="font-semibold">Dados Oficiais</h3>
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
    </div>
  );
}
