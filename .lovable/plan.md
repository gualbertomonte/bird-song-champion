

# Resetar torneios — proposta

## Problema

Hoje o organizador só consegue **encerrar** um torneio (status vira `Encerrado`, pontuações ficam bloqueadas). Não há como:
- Voltar atrás se encerrou por engano.
- Limpar pontuações para refazer uma bateria mal lançada.
- Reaproveitar o mesmo torneio em outra data sem recriar tudo.

## Ideia: 3 níveis de "reset", cada um com escopo claro

Em vez de um único botão genérico, ofereço 3 ações distintas no painel do organizador (aba **Visão Geral** ou novo bloco "Zona de risco"):

### 1. Reabrir torneio encerrado
- **Quem:** apenas organizador.
- **Quando aparece:** status `Encerrado`.
- **O que faz:** volta o status para `Em andamento`, limpa `encerrado_em`, desbloqueia novas pontuações. **Mantém** todas as pontuações, inscrições e sorteio.
- **Uso típico:** encerrei sem querer / esqueci de lançar a última bateria.

### 2. Limpar pontuações (reset parcial)
- **Quem:** organizador.
- **Quando aparece:** status `Sorteado`, `Em andamento` ou `Encerrado` (com confirmação extra).
- **O que faz:** apaga registros de `torneio_pontuacoes` (todas ou de uma bateria específica via dropdown). **Mantém** inscrições aprovadas e sorteio de estacas. Volta status para `Em andamento`.
- **Uso típico:** lancei pontos errados, quero refazer só a bateria 2.

### 3. Resetar torneio completo
- **Quem:** organizador.
- **Quando aparece:** qualquer status exceto `Rascunho`.
- **O que faz:** apaga pontuações + zera estações sorteadas + volta status para `Inscricoes`. **Mantém** inscrições e convites (não obriga reconvidar todo mundo).
- **Confirmação:** modal pedindo digitar o nome do torneio (estilo GitHub delete).
- **Uso típico:** quero rodar o mesmo torneio de novo do zero, com os mesmos participantes.

## Auditoria

Cada uma das 3 ações grava em `torneio_audit_log` com `acao` distinta (`reabertura`, `limpeza_pontuacoes`, `reset_completo`), incluindo `bateria` no caso de limpeza parcial. Assim fica rastreável quem fez e quando — útil em caso de contestação.

## Onde aparece na UI

Novo bloco no fim da aba **Visão Geral**, visível só para o organizador, intitulado **"Ações administrativas"**:

```text
┌─ Ações administrativas ──────────────────────────┐
│  [Reabrir torneio]      (só se Encerrado)        │
│  [Limpar pontuações ▾]  bateria: [todas ▾]       │
│  [Resetar torneio]      ⚠ destrutivo             │
└──────────────────────────────────────────────────┘
```

## Implementação técnica

**Backend (3 novas RPCs SQL com `SECURITY DEFINER`):**
- `reabrir_torneio(_torneio_id uuid)` — valida organizador, valida status atual = `Encerrado`, atualiza torneio, grava audit.
- `limpar_pontuacoes_torneio(_torneio_id uuid, _bateria int DEFAULT NULL)` — valida organizador, deleta de `torneio_pontuacoes` (filtrando por bateria se passado), volta status se estava `Encerrado`, grava audit.
- `resetar_torneio(_torneio_id uuid)` — valida organizador, deleta pontuações, zera campo `estacao` em todas as inscrições, volta status para `Inscricoes`, limpa `encerrado_em`, grava audit.

**Frontend:**
- `src/pages/TorneioDetalhe.tsx`: novo componente `AcoesAdministrativasTorneio` com os 3 botões + modais de confirmação.
- Reusar padrão do `confirm()` atual mas para a ação 3 usar modal customizado (`AlertDialog` do shadcn) que exige digitar o nome.
- Após cada ação: `toast.success(...)` + `refresh()`.

## Arquivos a alterar

- **Migration nova:** 3 funções RPC + grants para `authenticated`.
- `src/pages/TorneioDetalhe.tsx`: novo bloco "Ações administrativas".
- (Opcional) `src/types/torneio.ts`: adicionar tipos das novas ações de auditoria.

## Fora de escopo (propositalmente)

- **Apagar inscrições/convites:** já dá para deletar o torneio inteiro (RLS atual permite delete em `Rascunho`/`Inscricoes`). Não vale criar reset que faça isso.
- **Resetar torneios de outros organizadores:** segurança via `organizer_user_id = auth.uid()` dentro da RPC.
- **Admin global resetar qualquer torneio:** não pediram, e mistura papéis.

## Resultado

Organizador ganha controle total sobre o ciclo de vida do torneio sem precisar recriar do zero, com 3 ações de granularidade crescente e tudo auditado.

