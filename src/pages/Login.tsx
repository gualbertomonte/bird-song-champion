import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bird, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { signIn } = useAuth();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '';
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const msg = (error as any)?.message?.toLowerCase?.() || '';
      if (msg.includes('not confirmed') || msg.includes('email_not_confirmed')) {
        toast.error('Email ainda não confirmado. Entre em contato com o suporte.');
      } else {
        toast.error('Email ou senha inválidos');
      }
    }
  };

  return (
    <div className="min-h-screen auth-backdrop flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 via-card to-card flex items-center justify-center ring-gold">
            <Bird className="w-9 h-9 text-secondary" />
          </div>
          <h1 className="heading-serif text-3xl font-semibold text-foreground">MeuPlantelPro</h1>
          <p className="text-sm text-muted-foreground heading-serif italic px-4">
            Cuide do seu plantel com a tranquilidade que ele merece.
          </p>
        </div>

        <div className="auth-card space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-eyebrow">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-eyebrow">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="divider-gold" />

          <div className="text-center space-y-2 text-sm">
            <Link to="/forgot-password" className="text-secondary hover:underline block">
              Esqueci minha senha
            </Link>
            <p className="text-muted-foreground">
              Não tem conta?{' '}
              <Link to={signupHref} className="text-secondary hover:underline font-medium">Criar conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
