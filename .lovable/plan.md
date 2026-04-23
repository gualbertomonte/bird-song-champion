

# Diagnóstico e correção AdSense

## Estado do código: correto

Verifiquei e o snippet do Google está 100% replicado no projeto:
- `index.html` linha 30 — script global do AdSense com `ca-pub-2835871674648959`
- `src/components/ads/AdSenseBanner.tsx` — gera `<ins>` com todos os atributos do snippet (slot `7741257825`, format `fluid`, layoutKey `-fb+5w+4e-db+86`)
- `src/pages/Dashboard.tsx` linhas 307-313 — banner renderizado no rodapé

**Não há bug de código.** O motivo dos anúncios não aparecerem é operacional.

## Causa raiz (3 fatores combinados)

### 1. Você é admin → banner nunca renderiza pra você
Os logs confirmam: sua conta `plantel.pro@outlook.com.br` retorna `true` em `has_role('admin')`. A regra `useShowAds()` oculta o componente para admins, então o `<ins>` nem chega no DOM da sua sessão. Google não tem onde preencher.

### 2. Você testa no preview do Lovable, não no domínio publicado
A rota atual é `/admin/dashboard` em `lovableproject.com`. O AdSense só serve em domínios aprovados (`meuplantelpro.com.br`). No preview o componente cai no branch `isDev` e mostra o quadro tracejado.

### 3. Falta `public/ads.txt`
Sem `ads.txt` no domínio, AdSense pode marcar o site como não autorizado e zerar o fill rate. Vou criar.

## O que vou alterar

Apenas **uma** mudança de código:

- **Criar `public/ads.txt`** com o conteúdo padrão exigido pelo Google:
  ```
  google.com, pub-2835871674648959, DIRECT, f08c47fec0942fa0
  ```
  Esse arquivo fica acessível em `https://meuplantelpro.com.br/ads.txt` após publicar.

Não mexerei em `index.html`, `AdSenseBanner.tsx`, `useShowAds.ts` nem `Dashboard.tsx` — todos estão corretos.

## O que você precisa fazer (eu não consigo)

1. **Publicar** (botão Publish → Update). Sem publicar, `ads.txt` não vai pro domínio.
2. Abrir aba anônima em `https://meuplantelpro.com.br/dashboard` e logar com **uma conta não-admin** (ou criar uma nova). Rolar até o final do Dashboard.
3. Confirmar no painel AdSense → Sites → `meuplantelpro.com.br` que o status é "Pronto" (não "Requer atenção"). Se aparecer aviso de ads.txt, vai sumir em 24-48h após o passo 1.
4. Verificar no painel AdSense → Anúncios → "Banner Dashboard" se está **ativado** (às vezes o bloco é criado mas fica desativado).

## Checagem opcional pós-publicação

Se quiser, depois que você publicar eu uso o browser tool em `https://meuplantelpro.com.br` (sem login, ou com conta de teste) e confirmo:
- `<ins class="adsbygoogle">` está no DOM com os atributos certos
- Request para `pagead2.googlesyndication.com/...` retorna 200
- Console não tem `TagError` nem `No slot size for availableWidth=0`
- `https://meuplantelpro.com.br/ads.txt` retorna 200 com o conteúdo certo

## Resultado esperado

Depois de publicar com `ads.txt` + acessar como não-admin no domínio real:
- Bloco "Espaço publicitário" aparece no rodapé do Dashboard
- Em até alguns minutos, anúncio real começa a ser servido (ou fica em "unfilled" se não houver inventário no momento)
- Impressões começam a registrar no painel AdSense em algumas horas

