

# Aparecer no Google — melhorias de SEO para o MeuPlantelPro

Hoje o app não aparece no Google porque faltam sinais básicos que o buscador precisa para **indexar** e **entender** o site. Vamos resolver isso em duas frentes: ajustes técnicos no código (rápidos) e ações fora do código que **só você pode fazer** (essenciais).

## Por que não aparece hoje

1. O `index.html` tem título genérico ("Meu Plantel Pro") e descrição curta — pouco competitivo no Google.
2. Não existe **sitemap.xml** (mapa do site que o Google lê pra descobrir páginas).
3. O `robots.txt` não aponta pro sitemap.
4. Faltam **dados estruturados** (Schema.org) — o Google usa pra entender que é um SaaS/WebApplication.
5. O site é SPA (React) — o Google indexa, mas precisa de meta tags e conteúdo claros já no HTML inicial.
6. **Provavelmente o domínio nunca foi enviado ao Google Search Console** (sem isso, indexação demora semanas ou nunca acontece).

## O que vou fazer no código

### 1. `index.html` — SEO on-page reforçado
- **Title** otimizado com palavra-chave: `MeuPlantelPro — Gestão de Plantel, Torneios de Canto e Saúde Avícola`
- **Meta description** rica (150–160 chars) com palavras que criadores buscam: "gestão de plantel", "controle de aves", "torneios de canto", "berçário", "trinca-ferro", "curió".
- **Meta keywords** (peso baixo, mas inofensivo).
- **Canonical URL** apontando pra `https://meuplantelpro.com.br/`.
- **Open Graph** completo (`og:url`, `og:site_name`, `og:locale=pt_BR`).
- **JSON-LD Schema.org** (`SoftwareApplication` + `Organization`) — ajuda o Google a mostrar rich results.
- `<h1>` semântico já está na Landing — manter.

### 2. `public/robots.txt` — apontar pro sitemap
Adicionar linha `Sitemap: https://meuplantelpro.com.br/sitemap.xml` no final.

### 3. `public/sitemap.xml` — novo arquivo
Listar as URLs públicas indexáveis: `/`, `/login`, `/signup` (as rotas autenticadas não devem ser indexadas).

### 4. Pequena melhoria na Landing
- Adicionar um `<h2>` extra com termos de busca naturais (sem mudar o design).
- Garantir `alt` em ícones decorativos (`aria-hidden`) — já está bom, só revisar.

## O que VOCÊ precisa fazer (fora do código, sem isso não adianta)

> Estas etapas são as **mais importantes**. As mudanças no código preparam o terreno; estas fazem o Google realmente encontrar e listar o site.

1. **Google Search Console** (https://search.google.com/search-console)
   - Adicionar a propriedade `meuplantelpro.com.br`.
   - Verificar via DNS (TXT) ou via tag HTML (posso adicionar a tag pra você se enviar o código).
   - Enviar o `sitemap.xml`.
   - Pedir indexação manual da home.

2. **Google Analytics 4** (opcional, mas recomendado) — ajuda a medir o tráfego que vier.

3. **Backlinks iniciais** — cite o site nas redes sociais (Instagram que você já tem), grupos de WhatsApp/Facebook de criadores. O Google valoriza muito quando outros sites linkam o seu.

4. **Tempo** — mesmo com tudo certo, o Google leva de **3 a 30 dias** pra indexar um domínio novo.

## Arquivos alterados

1. `index.html` — title, description, canonical, OG completo, JSON-LD.
2. `public/robots.txt` — adicionar linha do sitemap.
3. `public/sitemap.xml` (novo) — mapa do site.

## Fora do escopo (podemos fazer depois)

- Blog/conteúdo SEO (artigos sobre criação de aves trariam tráfego orgânico real — é o caminho mais poderoso a médio prazo).
- Pré-renderização (SSR/SSG) — só vale se o tráfego crescer muito.
- Tradução para outros idiomas.

