

# AdSense — já está implementado, nada a codar

## Estado atual (verificado no código)

Tudo que você pediu já está em produção no código:

**`index.html`** — script global do AdSense carregado no `<head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2835871674648959" crossorigin="anonymous"></script>
```

**`src/components/ads/AdSenseBanner.tsx`** — Publisher ID `ca-pub-2835871674648959` configurado.

**`src/pages/Dashboard.tsx`** (linhas 300-308) — banner renderizado no rodapé com os IDs corretos do snippet que você enviou:
```tsx
<AdSenseBanner
  slot="7741257825"
  format="fluid"
  layoutKey="-fb+5w+4e-db+86"
  className="w-full max-w-3xl"
/>
```

**`src/hooks/useShowAds.ts`** — admin nunca vê ads (regra que você aprovou).

## Por que você ainda não vê anúncios

Não é problema de código. São 3 fatores externos:

1. **Preview mostra placeholder** — `AdSenseBanner.tsx` detecta `import.meta.env.DEV` e renderiza o quadro tracejado "Anúncio — preview (dev)" em vez do `<ins>` real. Esperado.
2. **Domínio precisa estar publicado e aprovado** — anúncios só servem em `meuplantelpro.com.br`, e só depois que o AdSense aprovou esse domínio.
3. **Bloco novo demora 24-72h** para começar a servir mesmo após aprovação — calibração do Google.

## O que falta (você faz, não eu)

1. **Publish** (botão Publish → Update no canto superior direito). Não tenho ferramenta para publicar.
2. Abrir `https://meuplantelpro.com.br` logado como **não-admin** e rolar até o final do Dashboard.
3. Aguardar 24-72h e checar **AdSense → Anúncios → Por bloco → "Banner Dashboard"** para ver impressões.

## O que eu posso fazer depois que você publicar

Se quiser, abro o domínio com o browser tool e confirmo:
- O `<ins class="adsbygoogle">` renderiza com `data-ad-slot="7741257825"`.
- Não há erros `TagError` / `adsbygoogle` no console.
- Request para `pagead2.googlesyndication.com` retorna 200.

Isso valida que o código está correto. Confirmação de **impressões registradas** só no painel AdSense (precisa do seu login Google).

## Conclusão

**Nenhuma alteração de código é necessária.** Implementação está completa e correta. O bloqueio é operacional: publicar + aguardar AdSense.

