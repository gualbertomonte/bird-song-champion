
Corrigir a exibição do banner AdSense no Dashboard para que ele apareça visualmente mesmo quando o Google ainda não entregou o anúncio, e evitar que a lógica atual esconda o bloco por engano.

## O que vou ajustar

1. Tornar o banner visível no layout
- Envolver o AdSense em um container com altura mínima fixa no rodapé do Dashboard.
- Manter largura responsiva, mas reservar espaço visual para evitar o comportamento atual de “sumir” quando o `<ins>` fica com altura zero.
- Exibir um estado de fallback discreto em produção quando o script carregar mas o anúncio ainda não vier.

2. Fortalecer o componente `AdSenseBanner`
- Detectar se o script do AdSense está disponível antes de dar `push`.
- Adicionar estados como:
  - carregando script
  - aguardando preenchimento do anúncio
  - bloqueado/sem inventário
- Evitar que o componente fique invisível sem feedback quando houver “no fill”, bloqueador de anúncios ou atraso de propagação.

3. Corrigir a regra de visibilidade dos anúncios
- Revisar `useIsAdmin` e `useShowAds` para não esconder o banner indefinidamente se a checagem de admin falhar.
- Manter a regra “admin não vê anúncio”, mas tratar erro de RPC como erro de verificação, não como motivo para ocultar o banner para usuários comuns.

4. Melhorar a integração no Dashboard
- Renderizar o banner em uma seção própria no fim da página, com espaçamento e estrutura estáveis.
- Se necessário, trocar o wrapper atual por um card leve ou bloco “Espaço publicitário” para garantir área renderizável e facilitar depuração visual.

## Arquivos a alterar

- `src/components/ads/AdSenseBanner.tsx`
- `src/hooks/useShowAds.ts`
- `src/hooks/useIsAdmin.ts`
- `src/pages/Dashboard.tsx`

## Motivo técnico provável

Pelo código atual, o problema mais provável é a combinação de dois fatores:

1. O `<ins class="adsbygoogle">` não reserva altura própria.
- Se o Google ainda não preencher o slot, o bloco colapsa para altura zero e parece que “não existe”.

2. A regra `useShowAds()` pode ocultar o anúncio se a verificação de admin não concluir corretamente.
- Hoje o hook depende de `useIsAdmin()`; se essa consulta falhar ou atrasar, o banner pode nem ser renderizado.

## O que continuará dependendo do Google

Mesmo com a correção visual:
- o anúncio real pode demorar para aparecer;
- blocos novos podem levar 24–72h para começar a preencher;
- bloqueadores de anúncio podem impedir a renderização;
- aprovação do domínio e inventário continuam sendo externos ao app.

## Resultado esperado

Depois da implementação:
- o rodapé do Dashboard sempre mostrará a área do banner para usuários comuns;
- quando houver entrega do Google, o anúncio aparece no local correto;
- quando ainda não houver entrega, o usuário verá um fallback claro em vez de um espaço “sumido”;
- admins continuarão sem ver anúncios.

## Validação depois da implementação

1. Abrir o Dashboard como usuário não-admin no domínio real.
2. Confirmar que o bloco do banner aparece no rodapé.
3. Verificar no console se o script do AdSense carregou sem erro.
4. Confirmar que a ausência de inventário não derruba a UI nem faz o bloco desaparecer.
