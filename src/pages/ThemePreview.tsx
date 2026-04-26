import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bird,
  Trophy,
  Heart,
  Egg,
  Users,
  Settings,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Sparkles,
} from "lucide-react";

/**
 * Cada paleta sobrescreve um subconjunto de variáveis HSL definidas em index.css.
 * Apenas tokens — nenhum componente precisa ser editado.
 */
type PaletteVars = Record<string, string>;
type Palette = {
  id: string;
  name: string;
  description: string;
  vars: PaletteVars;
};

const PALETTES: Palette[] = [
  {
    id: "light-emerald",
    name: "Light Emerald (atual)",
    description: "Off-white + verde esmeralda — padrão do app.",
    vars: {
      "--background": "60 20% 97%",
      "--foreground": "222 47% 11%",
      "--card": "0 0% 100%",
      "--card-foreground": "222 47% 11%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "222 47% 11%",
      "--primary": "158 64% 35%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "158 64% 40%",
      "--secondary-foreground": "0 0% 100%",
      "--muted": "210 20% 96%",
      "--muted-foreground": "215 16% 47%",
      "--accent": "158 75% 95%",
      "--accent-foreground": "158 64% 25%",
      "--destructive": "0 72% 51%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "214 20% 91%",
      "--input": "214 20% 91%",
      "--ring": "158 64% 40%",
      "--success": "158 64% 40%",
      "--warning": "38 92% 50%",
      "--info": "200 90% 45%",
    },
  },
  {
    id: "dark-forest",
    name: "Dark Forest + Gold",
    description: "Tema escuro original (verde profundo + dourado).",
    vars: {
      "--background": "150 25% 7%",
      "--foreground": "45 30% 92%",
      "--card": "150 22% 10%",
      "--card-foreground": "45 30% 92%",
      "--popover": "150 22% 10%",
      "--popover-foreground": "45 30% 92%",
      "--primary": "45 70% 55%",
      "--primary-foreground": "150 30% 10%",
      "--secondary": "45 70% 55%",
      "--secondary-foreground": "150 30% 10%",
      "--muted": "150 18% 14%",
      "--muted-foreground": "150 10% 65%",
      "--accent": "45 60% 20%",
      "--accent-foreground": "45 70% 80%",
      "--destructive": "0 70% 55%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "150 15% 18%",
      "--input": "150 15% 18%",
      "--ring": "45 70% 55%",
      "--success": "150 60% 45%",
      "--warning": "38 92% 55%",
      "--info": "200 90% 55%",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Paleta azul oceânica — claro e calmo.",
    vars: {
      "--background": "210 40% 98%",
      "--foreground": "215 50% 12%",
      "--card": "0 0% 100%",
      "--card-foreground": "215 50% 12%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "215 50% 12%",
      "--primary": "210 85% 45%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "200 90% 50%",
      "--secondary-foreground": "0 0% 100%",
      "--muted": "210 30% 95%",
      "--muted-foreground": "215 16% 47%",
      "--accent": "200 90% 95%",
      "--accent-foreground": "210 85% 30%",
      "--destructive": "0 72% 51%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "210 25% 90%",
      "--input": "210 25% 90%",
      "--ring": "210 85% 50%",
      "--success": "158 64% 40%",
      "--warning": "38 92% 50%",
      "--info": "200 90% 45%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    description: "Paleta âmbar / laranja — quente e energética.",
    vars: {
      "--background": "30 30% 97%",
      "--foreground": "20 50% 12%",
      "--card": "0 0% 100%",
      "--card-foreground": "20 50% 12%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "20 50% 12%",
      "--primary": "20 90% 50%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "30 95% 55%",
      "--secondary-foreground": "0 0% 100%",
      "--muted": "30 20% 95%",
      "--muted-foreground": "20 16% 45%",
      "--accent": "30 90% 94%",
      "--accent-foreground": "20 90% 30%",
      "--destructive": "0 72% 51%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "30 25% 90%",
      "--input": "30 25% 90%",
      "--ring": "20 90% 50%",
      "--success": "158 64% 40%",
      "--warning": "38 92% 50%",
      "--info": "200 90% 45%",
    },
  },
  {
    id: "midnight",
    name: "Midnight Violet",
    description: "Tema escuro com primário violeta.",
    vars: {
      "--background": "240 25% 8%",
      "--foreground": "260 20% 92%",
      "--card": "240 22% 12%",
      "--card-foreground": "260 20% 92%",
      "--popover": "240 22% 12%",
      "--popover-foreground": "260 20% 92%",
      "--primary": "265 85% 65%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "280 80% 65%",
      "--secondary-foreground": "0 0% 100%",
      "--muted": "240 18% 16%",
      "--muted-foreground": "260 10% 65%",
      "--accent": "265 60% 22%",
      "--accent-foreground": "265 85% 80%",
      "--destructive": "0 70% 55%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "240 15% 20%",
      "--input": "240 15% 20%",
      "--ring": "265 85% 65%",
      "--success": "150 60% 50%",
      "--warning": "38 92% 55%",
      "--info": "200 90% 55%",
    },
  },
];

const TOKEN_GROUPS: { title: string; tokens: { name: string; var: string }[] }[] = [
  {
    title: "Superfícies",
    tokens: [
      { name: "background", var: "--background" },
      { name: "foreground", var: "--foreground" },
      { name: "card", var: "--card" },
      { name: "popover", var: "--popover" },
      { name: "muted", var: "--muted" },
      { name: "accent", var: "--accent" },
    ],
  },
  {
    title: "Marca / CTA",
    tokens: [
      { name: "primary", var: "--primary" },
      { name: "secondary", var: "--secondary" },
      { name: "ring", var: "--ring" },
      { name: "border", var: "--border" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { name: "success", var: "--success" },
      { name: "warning", var: "--warning" },
      { name: "info", var: "--info" },
      { name: "destructive", var: "--destructive" },
    ],
  },
];

function applyPalette(vars: PaletteVars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function clearPalette(vars: PaletteVars) {
  const root = document.documentElement;
  Object.keys(vars).forEach((k) => root.style.removeProperty(k));
}

export default function ThemePreview() {
  const [activeId, setActiveId] = useState<string>("light-emerald");
  const [progress, setProgress] = useState(64);

  useEffect(() => {
    const palette = PALETTES.find((p) => p.id === activeId);
    if (!palette) return;
    applyPalette(palette.vars);
    return () => clearPalette(palette.vars);
  }, [activeId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao app
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="font-semibold">Theme Preview</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Palette switcher */}
        <section>
          <h1 className="page-title">Alternar paleta</h1>
          <p className="page-subtitle">
            Sobrescreve as variáveis HSL em <code>:root</code> em tempo real. Componentes não são tocados —
            apenas tokens.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {PALETTES.map((p) => {
              const active = p.id === activeId;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={`text-left rounded-xl border p-3 transition-all ${
                    active
                      ? "border-secondary ring-2 ring-secondary/40 bg-accent/40"
                      : "border-border hover:border-secondary/50 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ background: `hsl(${p.vars["--primary"]})` }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ background: `hsl(${p.vars["--secondary"]})` }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ background: `hsl(${p.vars["--background"]})` }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ background: `hsl(${p.vars["--foreground"]})` }}
                    />
                  </div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Token swatches */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Tokens semânticos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {TOKEN_GROUPS.map((group) => (
              <Card key={group.title} className="card-premium">
                <CardHeader>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.tokens.map((t) => (
                    <div key={t.var} className="flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-lg border border-border shrink-0"
                        style={{ background: `hsl(var(${t.var}))` }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.name}</div>
                        <code className="text-xs text-muted-foreground">{t.var}</code>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Botões</h2>
          <Card className="card-premium">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary">btn-primary</button>
                <button className="btn-secondary">btn-secondary</button>
                <button className="btn-success">btn-success</button>
                <button className="btn-danger">btn-danger</button>
                <button className="btn-outline-gold">btn-outline-gold</button>
                <button className="btn-ghost">btn-ghost</button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges & status */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Badges & status</h2>
          <Card className="card-premium">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge-active">Ativo</span>
                <span className="badge-bercario">Berçário</span>
                <span className="badge-sold">Vendido</span>
                <span className="badge-deceased">Falecido</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-feminino/15 text-feminino border border-feminino/30">
                  Fêmea
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-masculino/15 text-masculino border border-masculino/30">
                  Macho
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-medal-gold/20 text-medal-gold border border-medal-gold/40">
                  🥇 Ouro
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-medal-silver/20 text-foreground border border-medal-silver/40">
                  🥈 Prata
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-medal-bronze/20 text-medal-bronze border border-medal-bronze/40">
                  🥉 Bronze
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alerts */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Alertas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>Mensagem informativa padrão usando tokens.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>Algo deu errado — variant destructive.</AlertDescription>
            </Alert>
            <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-success">Sucesso</div>
                <div className="text-sm text-foreground/80">Operação concluída com tokens success.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-warning">Atenção</div>
                <div className="text-sm text-foreground/80">Aviso importante usando token warning.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Formulário</h2>
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Nova ave</CardTitle>
              <CardDescription>Exemplo com inputs, label e switch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" placeholder="Ex.: Pingo" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="anilha">Código da anilha</Label>
                  <Input id="anilha" placeholder="SP-2024-001" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="custom">Input customizado (.input-field)</Label>
                  <input id="custom" className="input-field" placeholder="Usa classe utilitária .input-field" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Anilha SISPASS</div>
                  <div className="text-sm text-muted-foreground">Confirme se a anilha é oficial.</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stat cards */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Stat cards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Bird, label: "Aves", value: "248", token: "secondary" },
              { icon: Trophy, label: "Torneios", value: "12", token: "warning" },
              { icon: Heart, label: "Saúde OK", value: "96%", token: "success" },
              { icon: Egg, label: "Ovos", value: "34", token: "info" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                  <s.icon className={`w-4 h-4 text-${s.token}`} />
                  {s.label}
                </div>
                <div className="number-serif text-3xl mt-2">{s.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs + progress */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Tabs & progress</h2>
          <Card className="card-premium">
            <CardContent className="pt-6">
              <Tabs defaultValue="resumo">
                <TabsList>
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                  <TabsTrigger value="config">
                    <Settings className="w-4 h-4 mr-1" /> Config
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="resumo" className="space-y-3 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Plantel ocupado</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
                      -10%
                    </Button>
                    <Button size="sm" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
                      +10%
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="historico" className="pt-4">
                  <p className="text-sm text-muted-foreground">Conteúdo de histórico…</p>
                </TabsContent>
                <TabsContent value="config" className="pt-4">
                  <p className="text-sm text-muted-foreground">Conteúdo de configuração…</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Tipografia */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Tipografia</h2>
          <Card className="card-premium">
            <CardContent className="pt-6 space-y-3">
              <h1 className="heading-serif text-4xl font-semibold">Heading serif 4xl</h1>
              <h2 className="heading-serif text-2xl font-semibold">Heading serif 2xl</h2>
              <p className="text-base">Texto base em Inter — usado para corpo de páginas.</p>
              <p className="text-sm text-muted-foreground">Texto muted-foreground (small).</p>
              <div className="number-serif text-5xl">1.248</div>
              <div className="label-eyebrow">Eyebrow label</div>
            </CardContent>
          </Card>
        </section>

        {/* Sample list */}
        <section className="space-y-4">
          <h2 className="heading-serif text-xl font-semibold">Lista (com hover)</h2>
          <Card className="card-premium">
            <CardContent className="pt-6 divide-y divide-border">
              {[
                { name: "Pingo", anilha: "SP-2024-001", status: "Ativo" },
                { name: "Mel", anilha: "SP-2024-002", status: "Berçário" },
                { name: "Tito", anilha: "SP-2024-003", status: "Vendido" },
              ].map((b) => (
                <div
                  key={b.anilha}
                  className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                      <Bird className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.anilha}</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{b.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <div className="pt-4 pb-12 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          Feito para validar tokens — nenhum componente foi modificado nesta página.
        </div>
      </main>
    </div>
  );
}
