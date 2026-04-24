import { Link } from "react-router-dom";
import {
  Bird,
  Egg,
  Trophy,
  Heart,
  Handshake,
  Sprout,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Users,
  Instagram,
} from "lucide-react";

const features = [
  { icon: Bird, title: "Plantel completo", desc: "Cadastre aves, anilhas, fotos e dados sanitários.", benefit: "Tudo organizado num só lugar." },
  { icon: Egg, title: "Berçário inteligente", desc: "Controle posturas, eclosões e desempenho dos casais.", benefit: "Nunca perca uma data importante." },
  { icon: Trophy, title: "Torneios & Grupos", desc: "Organize baterias, pontuações e rankings com amigos.", benefit: "Competições sem planilhas confusas." },
  { icon: Heart, title: "Saúde & Tratamentos", desc: "Doses do dia, recorrência e alertas automáticos.", benefit: "Nunca mais esqueça uma medicação." },
  { icon: Handshake, title: "Empréstimos & Amigos", desc: "Gerencie cessões, devoluções e sua rede de criadores.", benefit: "Confiança e rastreabilidade total." },
  { icon: Sprout, title: "Árvore Genealógica", desc: "Visualize a linhagem completa de cada ave.", benefit: "Cruzamentos com história e clareza." },
];

const pains = [
  { dor: "Esqueceu uma dose de novo?", solucao: "Lembretes automáticos por ave e por horário." },
  { dor: "Perdeu a linhagem de um filhote?", solucao: "Árvore genealógica gerada automaticamente." },
  { dor: "Bagunça nos torneios?", solucao: "Inscrições, sorteios e rankings em poucos cliques." },
];

const stats = [
  { n: "10k+", l: "Aves cadastradas" },
  { n: "3k+", l: "Eclosões registradas" },
  { n: "500+", l: "Torneios organizados" },
  { n: "1k+", l: "Criadores ativos" },
];

const testimonials = [
  { nome: "Carlos M.", local: "Criador • SP", txt: "Larguei a planilha. Hoje controlo 80 aves do celular, da cocheira mesmo." },
  { nome: "Ana R.", local: "Criadora • MG", txt: "O berçário sozinho já vale. Acompanho cada postura sem anotar em caderno." },
  { nome: "João P.", local: "Organizador • PR", txt: "Montei um torneio de 40 aves em 10 minutos. Ranking saiu na hora." },
];

const faqs = [
  { q: "É grátis mesmo?", a: "Sim. Você cria sua conta e usa as principais funções sem pagar nada e sem cartão de crédito." },
  { q: "Funciona no celular?", a: "Sim, o app é totalmente responsivo. Use no celular, tablet ou computador." },
  { q: "Meus dados ficam seguros?", a: "Cada criador só vê seus próprios dados. Backup contínuo e acesso protegido por senha." },
  { q: "Posso compartilhar com amigos?", a: "Sim. Você pode adicionar amigos, registrar empréstimos e organizar torneios em grupo." },
];

function CTAButton({ to, children, variant = "primary", size = "default" }: { to: string; children: React.ReactNode; variant?: "primary" | "ghost"; size?: "default" | "lg" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5";
  const sizes = { default: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  const variants = {
    primary: "bg-gradient-to-r from-secondary via-secondary to-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20 hover:shadow-secondary/40",
    ghost: "glass text-foreground hover:text-secondary border border-border/40",
  };
  return (
    <Link to={to} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen auth-backdrop text-foreground overflow-x-hidden">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border/30">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary/30 to-card flex items-center justify-center ring-gold">
              <Bird className="w-5 h-5 text-secondary" />
            </div>
            <span className="heading-serif text-lg font-semibold">MeuPlantelPro</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">
              Entrar
            </Link>
            <CTAButton to="/signup">Criar conta grátis</CTAButton>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-secondary border border-secondary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Plantel Premium • Grátis para começar
            </div>
            <h1 className="heading-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
              O controle profissional que seu <span className="text-secondary">plantel merece</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Cadastre aves, acompanhe eclosões, organize torneios e cuide da saúde — tudo em um só lugar, do celular ou do computador.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <CTAButton to="/signup" size="lg">
                Criar conta grátis <ArrowRight className="w-4 h-4" />
              </CTAButton>
              <CTAButton to="/login" size="lg" variant="ghost">
                Já tenho conta
              </CTAButton>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> Grátis para começar</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> Pronto em 30 segundos</span>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="relative animate-fade-in">
            <div className="absolute -inset-6 bg-gradient-to-tr from-secondary/20 via-transparent to-secondary/10 blur-3xl rounded-full" />
            <div className="relative glass-strong rounded-3xl p-5 sm:p-6 border border-border/40 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-muted-foreground">Bom dia, criador</p>
                  <p className="heading-serif text-xl font-semibold">Seu plantel hoje</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center">
                  <Bird className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: "42", l: "Aves ativas", i: Bird },
                  { n: "07", l: "Doses hoje", i: Heart },
                  { n: "03", l: "Eclosões", i: Egg },
                  { n: "12", l: "Torneios", i: Trophy },
                ].map((s) => (
                  <div key={s.l} className="glass rounded-2xl p-4 border border-border/30">
                    <s.i className="w-4 h-4 text-secondary mb-2" />
                    <p className="heading-serif text-2xl font-semibold">{s.n}</p>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 glass rounded-2xl p-4 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Próxima dose</span>
                  <span className="text-xs text-secondary font-semibold">14:30</span>
                </div>
                <p className="text-sm font-medium">Trinca-Ferro #A-204 • Vitamina B</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Usado por criadores em todo o Brasil
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.l} className="glass rounded-2xl p-5 text-center border border-border/30">
              <p className="heading-serif text-3xl font-semibold text-secondary">{s.n}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DOR → SOLUÇÃO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="heading-serif text-3xl sm:text-4xl font-semibold">Cansado de planilhas e cadernos perdidos?</h2>
          <p className="text-muted-foreground mt-3">A gente entende. O MeuPlantelPro nasceu pra resolver as dores reais de quem cria aves.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {pains.map((p) => (
            <div key={p.dor} className="glass rounded-2xl p-6 border border-border/30 space-y-3">
              <p className="text-sm text-muted-foreground line-through">{p.dor}</p>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-base font-medium leading-snug">{p.solucao}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="heading-serif text-3xl sm:text-4xl font-semibold">Tudo que seu plantel precisa</h2>
          <p className="text-muted-foreground mt-3">Funcionalidades pensadas pra criadores reais, do hobby ao profissional.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 border border-border/30 hover:border-secondary/30 transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <f.icon className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="heading-serif text-lg font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{f.desc}</p>
              <p className="text-xs text-secondary font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {f.benefit}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <CTAButton to="/signup" size="lg">
            Começar agora <ArrowRight className="w-4 h-4" />
          </CTAButton>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="heading-serif text-3xl sm:text-4xl font-semibold">Comece em 3 passos</h2>
          <p className="text-muted-foreground mt-3">Em menos de 5 minutos seu plantel já está no app.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Crie sua conta", d: "Cadastro rápido com email e senha." },
            { n: "02", t: "Cadastre seu plantel", d: "Adicione suas aves, anilhas e fotos." },
            { n: "03", t: "Acompanhe tudo", d: "Saúde, eclosões e torneios num só lugar." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6 border border-border/30 relative">
              <span className="heading-serif text-5xl text-secondary/30 font-semibold absolute top-3 right-5">{s.n}</span>
              <h3 className="heading-serif text-lg font-semibold mb-2 mt-6">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="heading-serif text-3xl sm:text-4xl font-semibold">Quem usa, recomenda</h2>
          <p className="text-muted-foreground mt-3">Depoimentos de criadores que largaram o caderno.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div key={t.nome} className="glass rounded-2xl p-6 border border-border/30">
              <p className="text-sm text-foreground/90 leading-relaxed mb-4">"{t.txt}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.local}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <CTAButton to="/signup" size="lg">
            Quero começar grátis <ArrowRight className="w-4 h-4" />
          </CTAButton>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="heading-serif text-3xl sm:text-4xl font-semibold">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass rounded-2xl p-5 border border-border/30 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium">{f.q}</span>
                <span className="text-secondary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-10 text-center">
          <div className="glass rounded-xl p-4 border border-border/30">
            <ShieldCheck className="w-5 h-5 text-secondary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Dados seguros</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/30">
            <Smartphone className="w-5 h-5 text-secondary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Funciona no celular</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/30">
            <Sparkles className="w-5 h-5 text-secondary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Grátis pra começar</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative glass-strong rounded-3xl p-8 sm:p-14 text-center border border-secondary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-secondary/5 pointer-events-none" />
          <div className="relative space-y-5">
            <h2 className="heading-serif text-3xl sm:text-5xl font-semibold leading-tight">
              Pronto para elevar seu <span className="text-secondary">plantel</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Junte-se a centenas de criadores que já organizaram seu plantel com o MeuPlantelPro.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <CTAButton to="/signup" size="lg">
                Criar conta grátis <ArrowRight className="w-4 h-4" />
              </CTAButton>
              <CTAButton to="/login" size="lg" variant="ghost">
                Já tenho conta
              </CTAButton>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              ✓ Sem cartão de crédito  ✓ Cancele quando quiser  ✓ Suporte humano
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/30 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bird className="w-4 h-4 text-secondary" />
            <span>© {new Date().getFullYear()} MeuPlantelPro. Feito por criadores, para criadores.</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">Entrar</Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground">Criar conta</Link>
            <a href="https://www.instagram.com/meuplantel_pro?igsh=MXF1b3RqMnpiZ3Jzag%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-secondary flex items-center gap-1.5">
              <Instagram className="w-4 h-4" /> Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
