import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bird, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error('Erro ao enviar email de recuperação');
    } else {
      setSent(true);
      toast.success('Email de recuperação enviado!');
    }
  };

  return (
    <div className="min-h-screen auth-backdrop flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 via-card to-card flex items-center justify-center ring-gold">
            <Bird className="w-9 h-9 text-secondary" />
          </div>
          <h1 className="heading-serif text-3xl font-semibold text-foreground">Recuperar Senha</h1>
          <p className="text-sm text-muted-foreground heading-serif italic px-4">
            {sent ? 'Verifique sua caixa de entrada' : 'Informe seu email para receber o link.'}
          </p>
        </div>

        <div className="auth-card space-y-5">
          {!sent ? (
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
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
                {loading ? 'Enviando…' : 'Enviar Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.
                Verifique também a pasta de spam.
              </p>
              <button onClick={() => setSent(false)} className="text-secondary text-sm hover:underline">
                Reenviar
              </button>
            </div>
          )}

          <div className="divider-gold" />

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-secondary hover:underline font-medium">Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
