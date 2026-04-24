Aplicar novo ícone do MeuPlantelPro:
1. Copiar `user-uploads://image-12.png` para `public/favicon.png` (sobrescreve o atual)
2. Copiar `user-uploads://image-12.png` para `public/icon-512.png` (sobrescreve o atual, usado pelo PWA)
3. Verificar e deletar `public/favicon.ico` se existir (evita conflito)
4. `index.html` e `manifest.webmanifest` já apontam pros caminhos corretos — sem mudanças

Resultado: ícone novo na aba do browser (Ctrl+Shift+R pode ser necessário) e no PWA. Google leva dias para atualizar.