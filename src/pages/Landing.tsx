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
  ShieldCheck,
  Smartphone,
  Instagram,
  GitBranch,
  Wallet,
  IdCard,
  Star,
  MessageCircle,
} from "lucide-react";
import FaleConoscoModal from "@/components/FaleConoscoModal";

/* ---------- Dados ---------- */

const features = [
  {
    icon: GitBranch,
    title: "Pedigree & Genealogia",
    desc: "Linhagem completa, cruzamentos e árvore genealógica geradas automaticamente.",
  },
  {
    icon: Wallet,
    title: "Gestão Financeira",
    desc: "Controle entradas, saídas e investimentos por ave ou por casal.",
  },
  {
    icon: IdCard,
    title: "Crachás & Anilhas",
    desc: "Emita crachás profissionais e gerencie anilhas SISPASS sem esforço.",
  },
  {
    icon: Bird,
    title: "Plantel completo",
    desc: "Cadastre aves, fotos, fichas sanitárias e histórico em um só lugar.",
  },
  {
    icon: Egg,
    title: "Berçário inteligente",
    desc: "Posturas, eclosões e desempenho dos casais com lembretes automáticos.",
  },
  {
    icon: Trophy,
    title: "Torneios & Grupos",
    desc: "Inscrições, baterias, sorteios e rankings sem planilhas confusas.",
  },
];

const stats = [
  { n: "10k+", l: "Pássaros cadastrados" },
  { n: "1k+", l: "Criadores ativos" },
  { n: "3k+", l: "Eclosões registradas" },
  { n: "500+", l: "Torneios organizados" },
];

const testimonials = [
  {
    nome: "Carlos M.",
    local: "Criador • SP",
    txt: "Larguei a planilha. Hoje controlo 80 aves do celular, direto do viveiro. Mudou minha rotina.",
  },
  {
    nome: "Ana R.",
    local: "Criadora • MG",
    txt: "O berçário sozinho já vale. Acompanho cada postura sem anotar em caderno e nunca mais perdi uma data.",
  },
  {
    nome: "João P.",
    local: "Organizador • PR",
    txt: "Montei um torneio de 40 aves em 10 minutos. Ranking saiu na hora, sem confusão.",
  },
];

const faqs = [
  { q: "É grátis mesmo?", a: "Sim. Crie sua conta e use as principais funções sem pagar nada e sem cartão de crédito." },
  { q: "Funciona no celular?", a: "Sim, é totalmente responsivo. Use no celular, tablet ou computador, online." },
  { q: "Meus dados ficam seguros?", a: "Cada criador só vê seus próprios dados. Backup contínuo e acesso protegido por senha." },
  { q: "Posso compartilhar com amigos?", a: "Sim. Adicione amigos, registre empréstimos e organize torneios em grupo." },
];

/* ---------- Botão de CTA ---------- */

function CTAButton({
  to,
  href,
  children,
  variant = "primary",
  size = "default",
  external = false,
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "default" | "lg";
  external?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const sizes = {
    default: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants = {
    primary:
      "bg-secondary text-secondary-foreground shadow-[0_8px_24px_-8px_hsl(var(--secondary)/0.45)] hover:bg-secondary/90 hover:shadow-[0_14px_32px_-10px_hsl(var(--secondary)/0.55)]",
    secondary:
      "bg-card text-foreground border border-border hover:border-border hover:bg-muted/50",
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]}`;

  if (href) {
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} className={cls}>
      {children}
    </Link>
  );
}

/* ---------- Mockups ---------- */

function PhoneMockup() {
  return (
    <div className="relative w-[230px] sm:w-[260px] aspect-[9/19] rounded-[2.4rem] bg-foreground p-2.5 shadow-2xl shadow-foreground/25 ring-1 ring-foreground/80">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground rounded-b-2xl z-10" />
      <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-secondary/10 to-card overflow-hidden p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Bom dia</p>
            <p className="text-sm font-semibold text-foreground">Seu plantel</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center">
            <Bird className="w-4 h-4 text-secondary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { n: "42", l: "Aves" },
            { n: "07", l: "Doses" },
            { n: "03", l: "Eclosões" },
            { n: "12", l: "Torneios" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-card border border-border p-2.5 shadow-sm">
              <p className="text-base font-semibold text-foreground">{s.n}</p>
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-card border border-border p-2.5 shadow-sm mt-auto">
          <p className="text-[10px] text-muted-foreground">Próxima dose • 14:30</p>
          <p className="text-xs font-medium text-foreground">Trinca #A-204</p>
        </div>
      </div>
    </div>
  );
}

function TabletMockup() {
  return (
    <div className="hidden md:block relative w-[420px] aspect-[4/3] rounded-2xl bg-foreground p-3 shadow-2xl shadow-foreground/25 ring-1 ring-foreground/80">
      <div className="w-full h-full rounded-xl bg-card overflow-hidden">
        <div className="h-9 border-b border-border flex items-center px-4 gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted" />
          <span className="w-2 h-2 rounded-full bg-muted" />
          <span className="w-2 h-2 rounded-full bg-muted" />
          <span className="ml-3 text-[10px] text-muted-foreground/70">meuplantelpro.com.br</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-2">
          {[Bird, Egg, Trophy, Heart, GitBranch, IdCard].map((Icon, i) => (
            <div key={i} className="rounded-lg bg-muted/40 border border-border p-3">
              <Icon className="w-4 h-4 text-secondary mb-2" />
              <div className="h-1.5 w-12 bg-muted rounded mb-1" />
              <div className="h-1.5 w-8 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-secondary" />
            <div className="h-1.5 w-32 bg-secondary/30 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */

export default function Landing() {
  return (
    <div className="landing-light min-h-screen bg-background text-foreground antialiased overflow-x-hidden font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/60">
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Bird className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="text-base font-semibold tracking-tight">Meu Plantel Pro</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#funcionalidades" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-2 py-1.5">
              Funcionalidades
            </a>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">
              Entrar
            </Link>
            <CTAButton to="/signup">Começar grátis</CTAButton>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 lg:pt-28 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="space-y-7 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-medium text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Novo • Pronto em 30 segundos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground">
              A gestão mais completa e profissional para o seu{" "}
              <span className="text-secondary">criadouro</span>.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed font-light">
              Controle de plantel, pedigree e finanças em uma plataforma segura e intuitiva.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <CTAButton to="/signup" size="lg">
                Começar Teste Grátis <ArrowRight className="w-4 h-4" />
              </CTAButton>
              <CTAButton href="#funcionalidades" size="lg" variant="secondary">
                Ver Funcionalidades
              </CTAButton>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-3">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-secondary" /> Sem cartão
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-secondary" /> Dados seguros
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-secondary" /> Suporte humano
              </span>
            </div>
          </div>

          {/* MOCKUPS */}
          <div className="relative animate-fade-in flex justify-center lg:justify-end">
            <div className="absolute inset-0 -z-10 bg-gradient-radial from-secondary/15 via-transparent to-transparent blur-3xl" />
            <div className="relative flex items-end gap-6">
              <TabletMockup />
              <div className="md:-ml-24 md:-mb-10 z-10">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL — NÚMEROS */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Números do sistema</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Criadores de todo o Brasil já confiam
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <div
              key={s.l}
              className="rounded-2xl bg-card border border-border p-6 sm:p-8 text-center shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)]"
            >
              <p className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">{s.n}</p>
              <p className="text-sm text-muted-foreground mt-1.5">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Funcionalidades</p>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
            Tudo que seu criadouro precisa.
          </h2>
          <p className="text-lg text-muted-foreground mt-5 font-light leading-relaxed">
            Ferramentas pensadas para criadores reais — do hobby ao profissional.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl bg-card border border-border p-7 sm:p-8 shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_12px_32px_-8px_hsl(var(--foreground)/0.1)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/15 transition-colors">
                <f.icon className="w-5 h-5 text-secondary" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <CTAButton to="/signup" size="lg">
            Começar Teste Grátis <ArrowRight className="w-4 h-4" />
          </CTAButton>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Depoimentos</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Quem usa, recomenda.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.nome}
              className="rounded-3xl bg-card border border-border p-7 sm:p-8 shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)] flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                ))}
              </div>
              <blockquote className="text-base text-foreground/80 leading-relaxed flex-1">"{t.txt}"</blockquote>
              <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-semibold text-sm">
                  {t.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.local}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* SELOS DE CONFIANÇA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { i: ShieldCheck, t: "Dados seguros" },
            { i: Smartphone, t: "Mobile-first" },
            { i: Sprout, t: "Feito p/ criadores" },
            { i: Handshake, t: "Suporte humano" },
          ].map(({ i: Icon, t }) => (
            <div
              key={t}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3.5"
            >
              <Icon className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium text-foreground/80">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Perguntas frequentes
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl bg-card border border-border px-6 py-5 transition-shadow open:shadow-[0_8px_24px_-8px_hsl(var(--foreground)/0.1)]"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium text-foreground">{f.q}</span>
                <span className="text-secondary group-open:rotate-45 transition-transform text-2xl leading-none font-light">
                  +
                </span>
              </summary>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="relative rounded-[2rem] bg-gradient-to-br from-foreground to-foreground/90 p-10 sm:p-16 text-center overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative space-y-6">
            <h2 className="text-3xl sm:text-5xl font-semibold leading-tight text-secondary-foreground tracking-tight">
              Pronto para profissionalizar <br className="hidden sm:block" />
              seu <span className="text-secondary">criadouro</span>?
            </h2>
            <p className="text-background/80 max-w-xl mx-auto text-base sm:text-lg font-light">
              Comece grátis hoje. Sem cartão, sem complicação.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <CTAButton to="/signup" size="lg">
                Começar Teste Grátis <ArrowRight className="w-4 h-4" />
              </CTAButton>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-secondary-foreground border border-secondary-foreground/20 hover:bg-secondary-foreground/10 transition-colors"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <Bird className="w-4 h-4 text-secondary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Meu Plantel Pro. Feito por criadores, para criadores.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground">
              Criar conta
            </Link>
            <a
              href="https://www.instagram.com/meuplantel_pro?igsh=MXF1b3RqMnpiZ3Jzag%3D%3D&utm_source=qr"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-secondary flex items-center gap-1.5"
            >
              <Instagram className="w-4 h-4" /> Instagram
            </a>
          </div>
        </div>
      </footer>

      {/* FAB FALE CONOSCO */}
      <FaleConoscoModal />
    </div>
  );
}
