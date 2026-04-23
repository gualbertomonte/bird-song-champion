

# Adicionar Google AdSense — banner fixo no Dashboard

## Pré-requisito (você faz fora do Lovable)

1. Criar conta em https://www.google.com/adsense → adicionar o site `meuplantelpro.com.br`.
2. AdSense exige **domínio próprio aprovado** — o subdomínio `plantelpro.lovable.app` é rejeitado. Por isso só faz sentido publicar os ads **depois** que `meuplantelpro.com.br` estiver Active.
3. Aprovação leva de dias a semanas (Google revisa conteúdo, política, tráfego).
4. Após aprovado, você pega:
   - **Publisher ID** (formato `ca-pub-XXXXXXXXXXXXXXXX`) — público, vai no código.
   - **Slot ID do bloco de anúncio** (formato `XXXXXXXXXX`) — público, vai no código.

Os dois são **chaves públicas** (não são secret), então ficam direto no código — sem `add_secret`, sem edge function.

## Implementação no app

### 1. Script do AdSense em `index.html`

Adicionar no `<head>`, carregamento assíncrono:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

Também atualizar `public/robots.txt` para garantir que o crawler do AdSense (`Mediapartners-Google`) tem acesso (geralmente já tem, mas confirmo).

### 2. Componente `src/components/ads/AdSenseBanner.tsx`

Novo componente reutilizável:
- Recebe props `slot` e opcionais `format` / `responsive`.
- Renderiza `<ins class="adsbygoogle">` com os atributos exigidos pelo AdSense.
- No `useEffect`, chama `(window.adsbygoogle = window.adsbygoogle || []).push({})` para inicializar.
- Em `import.meta.env.DEV` mostra um placeholder cinza ("Anúncio — preview") em vez de carregar o script real, evitando avisos do AdSense em desenvolvimento.

### 3. Hook `src/hooks/useShowAds.ts`

Centraliza a regra "quando mostrar ads":
- `false` se `useIsAdmin()` retornar admin.
- `false` enquanto `useAuth().loading` for true.
- `true` caso contrário.

Assim, se um dia mudarmos a regra (ex.: "usuários premium não veem ads"), só altera aqui.

### 4. Integração no Dashboard

Em `src/pages/Dashboard.tsx`, no rodapé do conteúdo:

```tsx
{showAds && (
  <div className="mt-8 flex justify-center">
    <AdSenseBanner slot="XXXXXXXXXX" />
  </div>
)}
```

Banner responsivo, centralizado, com margem superior. Não fixo na tela (banner "sticky" no rodapé é mais agressivo e pode violar política do AdSense em mobile — melhor ser inline no fim do conteúdo). Se você quiser **realmente fixo na viewport**, me avise que eu ajusto, mas leia [política de ads pegajosos do Google](https://support.google.com/adsense/answer/1346295) antes.

### 5. Admin não vê ads

Já garantido pelo `useShowAds` (passo 3) + pelo fato de que o admin nem entra no `Dashboard.tsx` (vai direto para `/admin/dashboard`, que não tem o componente). Dupla proteção.

## O que NÃO vou fazer (e por quê)

- **Não vou criar edge function** — AdSense é puro frontend, sem chamadas de API.
- **Não vou guardar Publisher ID em secret** — é chave pública (aparece no `<script>` do `<head>`, qualquer um vê inspecionando).
- **Não vou ativar antes do domínio** — o código fica pronto, mas o `<script>` do AdSense só renderá ads quando o site estiver no domínio aprovado.
- **Não vou colocar ads em páginas de auth, admin ou checkout/torneio em andamento** — pode prejudicar UX e aprovação.

## O que preciso de você para executar

1. **Publisher ID** (`ca-pub-...`) — quando tiver a conta AdSense aprovada.
2. **Slot ID** do bloco "Banner Dashboard" — criado no painel AdSense, formato display responsivo.

Sem esses dois, posso deixar o código pronto com placeholders (`ca-pub-PENDING` / `slot-PENDING`) e você só substitui depois. Funciona, só não exibe ads até trocar.

## Arquivos tocados

- `index.html` (script AdSense no head)
- `public/robots.txt` (verificação — só edita se necessário)
- `src/components/ads/AdSenseBanner.tsx` (novo)
- `src/hooks/useShowAds.ts` (novo)
- `src/pages/Dashboard.tsx` (renderiza o banner no rodapé)

Sem migrations, sem edge functions, sem mudanças no backend.

## Próximos passos (depois desta entrega)

- Quando AdSense aprovar mais blocos, adicionar `<AdSenseBanner slot="..." />` em outras páginas relevantes (ex.: `Plantel`, `Bercario`).
- Se virar plano pago, o `useShowAds` ganha checagem de `subscription_status`.

**Posso prosseguir com Publisher ID e Slot pendentes (placeholder), ou você prefere pegar o AdSense aprovado primeiro e só então implementar?**

