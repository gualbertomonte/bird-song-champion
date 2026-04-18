
User está pedindo ideias para facilitar o uso do módulo de Torneios/Grupos pelos usuários (UX). Vou propor melhorias práticas focadas em reduzir fricção, sem expandir muito o escopo.

## Ideias para facilitar o uso

### 1. Onboarding e primeiro uso
- **Tour guiado** na primeira visita à aba Grupos: 3 balões explicando "Criar grupo → Convidar amigos → Criar bateria".
- **Estado vazio melhorado**: quando não há grupos, mostrar um card ilustrado com "Como funciona em 3 passos" e botão grande "Criar meu primeiro grupo".
- **Grupo de exemplo**: opção "Criar grupo de demonstração" que já vem com 1 bateria fictícia para o usuário explorar.

### 2. Atalhos no fluxo de criação
- **Wizard único** para criar grupo + primeira bateria + convidar amigos numa só tela (em vez de 3 etapas separadas).
- **Templates de regulamento**: ao criar grupo/bateria, oferecer 2-3 modelos prontos ("Canto livre 10 estacas", "Pontuação por juiz", etc.) para o usuário só clicar e ajustar.
- **Duplicar bateria**: botão "Repetir esta bateria" que clona nome, nº estacas e regulamento, mudando só a data.

### 3. Inscrição mais rápida
- **Inscrição em lote**: checkbox para selecionar várias aves machos do plantel e inscrever todas de uma vez.
- **"Inscrever minhas aves favoritas"**: lembra das últimas aves inscritas e oferece inscrever de novo com 1 clique.
- **Pré-aprovação automática**: opção no grupo "aprovar inscrições automaticamente" para admin não precisar aprovar manualmente toda vez.

### 4. Pontuação no celular (admin)
- **Modo "Estaca por estaca"**: tela cheia mostrando uma estaca por vez com o nome da ave grande e teclado numérico — admin desliza pra próxima. Bem mais rápido que tabela.
- **Auto-save por dose**: salva a cada dígito (sem botão "salvar").
- **Atalho de voz**: botão microfone para ditar a pontuação.

### 5. Compartilhamento e visibilidade
- **Link público read-only** da classificação (`/baterias/:id/publico`) com botão "Compartilhar no WhatsApp" — sem precisar de login.
- **QR Code da bateria** para imprimir e os participantes acompanharem ao vivo.
- **Resumo automático no fim**: ao encerrar bateria, gera card com pódio pronto para compartilhar como imagem.

### 6. Notificações inteligentes
- **Push/sino contextual**: "Sua estaca é a nº 7" assim que admin sortear; "Você ficou em 3º lugar 🥉" ao encerrar.
- **Lembrete da bateria**: 1 dia antes da data, notifica todos os membros.

### 7. Pequenos ajustes de UX já visíveis
- **Badge de convites pendentes** na aba "Grupos" dentro de Torneios.
- **Foto da ave** nas tabelas de classificação e ranking (já temos `bird_snapshot.foto_url`).
- **Lembrar última aba** (Avulsos/Grupos) no localStorage.
- **Busca/filtro** na lista de baterias quando o grupo crescer.

### Recomendação prática
Dos itens acima, **os 4 que mais reduziriam fricção rapidamente**:
1. **Wizard "Criar grupo + convidar + 1ª bateria" em uma tela**.
2. **Inscrição em lote** (checkbox múltiplo).
3. **Modo "Estaca por estaca" no celular** para pontuar.
4. **Link público + WhatsApp** da classificação.

Posso implementar esses 4 num próximo passo, ou um subconjunto que você escolher.
