

## Verificação AdSense via ads.txt

Você já tem o arquivo `public/ads.txt` no projeto com exatamente o conteúdo correto:

```
google.com, pub-2835871674648959, DIRECT, f08c47fec0942fa0
```

**Nenhuma mudança de código é necessária.** O arquivo já está pronto para ser servido em produção.

### Passos para concluir a verificação

1. **Publicar o projeto** (botão Publish → Update no topo do Lovable). Sem publicar, o `ads.txt` não vai pro domínio.
2. Após publicar, confirmar que o arquivo está acessível abrindo no navegador:
   - `https://meuplantelpro.com.br/ads.txt`
   - Deve retornar exatamente a linha acima em texto puro.
3. No painel do **AdSense → Sites → meuplantelpro.com.br**, clicar em **"Verificar"** usando o método "Snippet do ads.txt".
4. O Google rastreia em até 24-48h. Status muda de "Requer atenção" → "Pronto".

### Se a verificação falhar

Caso o Google não aceite o `ads.txt` (raro, geralmente por delay de propagação), partimos para o plano B: adicionar uma metatag leve em `index.html`:

```html
<meta name="google-adsense-account" content="ca-pub-2835871674648959">
```

Isso é 1 linha, não baixa script, não afeta o LCP que acabamos de otimizar.

### O que NÃO vou fazer

- **Não vou re-adicionar o `<script async src="adsbygoogle.js">` no `<head>`** — isso reverteria a correção de LCP feita no audit anterior. O script continua sendo carregado de forma lazy via `src/main.tsx` 1.5s após `window.load`, o que é suficiente para servir anúncios mas não para verificação por snippet.

