# Evolução SaaS Multi-Tenant — Plano & Decisões

> Obj: elevar o `gestor-multi-tenant` a um SaaS onde cada loja escolhe um nicho e recebe um **template premium pronto**, com customização leve (logo, nome, cor de destaque) sem quebrar a harmonia base.

---

## 1. Diagnóstico do projeto atual

### ✅ Reaproveitar (não mudar)

| Recurso | Estado hoje | Veredito |
|---|---|---|
| Isolamento por `establishmentId` (`tenant_id`) | Cada collection (`clients`, `services`, `appointments`, `cashClosings`, `employees`) já filtra por `row.establishmentId === req.session.establishmentId` (ver `makeCrudRouter.js:16`, `appointments.js:25`) | **Manter. Está certo.** |
| `requireEstablishment` middleware | Bloqueia writes sem tenant na sessão | **Manter** |
| Themed por nicho (`body[data-niche="Barbearia"]` etc.) | Variáveis CSS por nicho já existem em `style.css:94-164` | **Evoluir** para design tokens也是有 tipografia (só cor hoje) |
| `niche` no cadastro de estabelecimento | Já é obrigatório + seletor visual em `app.js:541` | **Manter.** Já é o wizard. |
| JSON store em arquivo único | Suficiente p/ dezenas de lojas pequenas | **Manter por enquanto** (ver §2) |
| Admin de plataforma vs operador de loja | `role: admin` global vs `operator` + `allowedEstablishmentIds` | **Manter.** Já está separado. |

### ⚠️ Mudar / Acrescentar

| Gap | Hoje | Mudança |
|---|---|---|
| Templates premium por nicho | Só troca cor; tipografia é a mesma `Inter` | Design tokens com tipografia + raio + espaçamento por nicho (não só cor) |
| Carregamento de tema | Tudo em `style.css` (~2300 linha) | Tokens por tema em `/themes/<nicho>.css`, carregado só o ativo |
| Customização de cor pelo dono | Não existe | Campo `accentOverride` no estabelecimento, validado contra paleta do tema |
| Billing/Plano | Não existe | Campo `plan` (`free`, `pro`) no estabelecimento (gateia features, sem gateway) |
| Identidade de cada nicho | Nenhuma — todos parecem o mesmo SaaS com troca de cor | Cada nicho tem tipografia + ornamentação própria (serif p/ moda, mono p/ eletrônicos, etc.) |

---

## 2. Decisão de arquitetura multi-tenant — JUSTIFICADA

Volume esperado (produto começando, dono de loja pequena):
- **Lojas ativas no ano 1**: 10–200 (SaaS de nicho, indicação/instagram, não VC-scale)
- **Registros por loja**: centenas a poucos milhares (clientes, agendamentos)
- **Concorrência simultânea**: baixa (cada loja usa 1–2h/dia)
- **Equipe p/ operar**: 1 dev (você)

### Recomendação: Banco compartilhado + `tenant_id` em cada tabela

| Critério | Sua realidade | Trade-off |
|---|---|---|
| Custo de infra | VPS barata single-node, JSON store | ✅ Mínimo |
| Isolamento | Lógico via query (já implementado) | Aceitável p/ volumes previstos |
| Manutenção | Sem migration de schema por novo tenant | ✅ Mínima |
| Backup | 1 arquivo `db.json` (ou 1 Postgres depois) | ✅ Trivial |
| Risco de vazamento | Se query esquecer filtro → vaza | ⚠ Mitigado por `requireEstablishment` + testes (ver §5) |

**Quando reconsiderar** (gatilhos de migração futura, NÃO agora):
- > 500 lojas ativas ou > 100k registros por collection → migrar para Postgres com `tenant_id` indexado. Mesma estratégia, só troca o storage.
- Cliente enterprise exigir isolamento físico → schema separado só p/ esse cliente.
- Loja única com > 50k agendamentos/mês → particionar por `establishmentId`.

**Por que NÃO schema/banco por tenant agora**:
- Cada novo tenant exigiria migration → onboarding manual.
- Backup/rescue de uma loja específica vira operação.
- Custo de VPS multiplicado.
- O volume objetivo não pede isso. É over-engineering prematuro.

> Resumo: a arquitetura que **já está no código** é a certa p/ o tamanho do produto. Ela escala até ~1000 lojas antes de precisar mudar a estratégia — e quando mudar, muda só o storage layer (Postgres + `WHERE establishment_id = $1`), não o modelo lógico.

---

## 3. Design tokens — estrutura

```
app/public/themes/
├── tokens-base.css       # variáveis estruturais (layout, shadow, transition) — todas lojas
├── moda.css              # nicho Moda — serifada, editorial, arejado
├── alimentacao.css       # nicho Alimentação — quente, cantos arredondados
├── servicos.css          # (futuro) —技工系 sans-serif, cantos retos
├── eletronicos.css       # nicho Eletrônicos — mono/technical, alto contraste
└── generico.css         # tema padrão fallback (não pode ser feio)
```

Cada arquivo de nicho define **somente tokens** (cores, fontes, raio, espaçamento) — nenhum CSS decorativo solto. O `style.css` consome os tokens via `var(--...)`, então a "casca visual" muda sem reescrever componentes.

### Identidade por nicho (não só cor)

| Nicho | Tipografia | Cor principal | Raio | Estilo |
|---|---|---|---|---|
| **Moda** | Cormorant Garamond (display serif) + Inter (UI) | Preto premium #111 | 0px–4px (afiado) | Editorial, espaçoso |
| **Alimentação** | Poppins (geometric sans) | Terracota #C2410C | 16px–24px (arredondado) | Quente, convidativo |
| **Servicos** | IBM Plex Sans + IBM Plex Mono (acentos) | Azul-petróleo #0F766E | 8px (neutro) | Limpo, técnico |
| **Eletrônicos** | Space Grotesk (modern sans) + JetBrains Mono (eyebrows) | Verde-fósforo #10B981 | 2px (afiado, dark-first) | Dark, premium gadget |
| **Generico** | Inter (atual) | Indigo #6366F1 (roxo CERO) — mudar para teal #0D9488 | 12px (atual) | Seguro, neutro |

**Anti-padrões evitados** (do skill UI/UX Pro Max):
- ❌ Gradiente roxo-azul genérico (clichê de IA) → cada nicho tem paleta **terrosa/matizada** própria
- ❌ Ícones de foguete/engrenagem genéricos → SVG temático por nicho
- ❌ Grid 3-colunas padrão "sem propósito" → layout editorialunica p/ moda, cards grandes p/ alimentos
- ❌ Emoji como ícone → SVG stroke-only

---

## 4. Plano de migração das lojas existentes

### Step 1 — Backfill de `theme` não-destrutivo

Cada estabelecimento hoje tem `niche` (`'Barbearia'`, `'Pizzaria'`, etc.). Vamos adicionar campo `theme` (slug da pasta de tokens), mantendo `niche` legível.

Script `scripts/migrate-themes.js` (já criado):

```bash
node scripts/migrate-themes.js
# mapeia niche antigo -> theme slug
# Barbearia/Oficina/Salao -> 'servicos'
# Pizzaria/Doces -> 'alimentacao'
# Petshop -> 'servicos'
# Outro -> 'generico'
# insere theme + plan='free' se faltando
# idempotente — pode rodar de novo sem duplicar
```

### Step 2 — Carregamento condicional do tema no portal

`server.js` roteia `/loja/:id` vindo ler `theme` do estabelecimento e injeta `<link>` só daquele tema. Peso extra: ~3KB/tema. Não carrega todos.

### Step 3 — Customização leve pelo dono

Em **Configurações**, adicionar seção "Aparência":
- Logo (já existe)
- Nome (já existe)
- Cor de destaque: dropdown com 4–6 opções da paleta do tema (NÃO color picker livre) — `accentOverride` validado no backend contra lista permitida do tema.

### Step 4 — Painel do dono vs painel da plataforma (já existe, formalizar)

- Painel global (`role: admin` global, `allowedEstablishmentIds === null`) = você, dono do SaaS, vê todas as lojas via seletor → "Painel da Plataforma"
- Painel por estabelecimento (depois de `select`) = painel da loja → "Painel do Dono da Loja"
- Breadcrumb no header p/ deixar isso explícito: "Plataforma → Barbearia Elite"

### Step 5 — Billing lite

Acrescentar `plan` (`free`/`pro`) no `establishment`. Gate por enquanto:
- `free`: até 50 clientes, 1 usuário operador, sem customização de cor
- `pro`: ilimitado, multi-usuário, customização ativa

Sem gateway no ano 1 — flag interno, decisão manual via painel admin da plataforma.

---

## 5. Checklist de testes de isolamento entre tenants

Testes automatizados no `app/test/` (a fazer, lista p/ Checklist):

### Backend (isolamento de dados)

- [ ] **T1** — Logar como operador da loja A → `GET /api/clients` NÃO retorna clientes da loja B
- [ ] **T2** — Tentar `GET /api/appointments/:idDeB` (operador A) → 403
- [ ] **T3** — `PUT /api/appointments/:idDeB` com body de modificação → 403
- [ ] **T4** — `DELETE /api/clients/:idDeB` → 403 (nao apaga)
- [ ] **T5** — Criar agendamento na loja A passando `serviceId` da loja B → 403 (validação em `appointments.js:135`)
- [ ] **T6** — Mesmo scenario para `employeeId` e `clientId` (foreign-key cross-tenant)
- [ ] **T7** — Operador sem `allowedEstablishmentIds` tentando `select` → 403 (já testado)
- [ ] **T8** — Usuário novo com sessão regenerada (cookie novo) não herda `establishmentId` de outro
- [ ] **T9** — Logout destrói `establishmentId` da sessão (já feito em `/clear-selection`)
- [ ] **T10** — Cache de `getDB()` não vaza: mudar cliente na loja A, ler na loja B → não vê

### Frontend (apresentação)

- [ ] **F1** — Abrir `/loja/A` e `/loja/B` em abas diferentes → CSS não conflita (tema A não "vaza" p/ B)
- [ ] **F2** — `localStorage` de tema não vaza entre subpaths (mesma origin, prefixar por `loja:<id>:`)

### Tema

- [ ] **D1** — Cada tema renderiza em mobile 375px sem horizontal scroll
- [ ] **D2** — Contraste de texto ≥ 4.5:1 em todos os 5 temas (light + dark)
- [ ] **D3** — `prefers-reduced-motion: reduce` desativa animações em todos os temas
- [ ] **D4** — Tema `generico` NÃO é feio (passa no teste " comparar com um tema de nicho — não dá nojo")

### Billing

- [ ] **B1** — Loja `plan=free` não recebe `accentOverride` (ignorado)
- [ ] **B2** — Migrar plano `free -> pro` libera customização sem reload de dados

---

## 6. Anti-padrões vigentes (relidos do skill)

| Problema comum | Solução adotada |
|---|---|
| Dado vazando entre lojas | Toda query filtra por `establishmentId` (já). Testes T1–T10 cobrem. |
| Cache compartilhado | Hoje não tem cache de página. Quando tiver, chave prefixada `t:<establishmentId>:`. |
| Tema genérico feio | `generico.css` recebe a mesma atenção de design que os premium. |
| Customização quebrando contraste | `accentOverride` validado contra paleta do tema, nunca cor livre. |
| Custo de manter 5 temas | Tokens compartilham `tokens-base.css`. Tema só sobrescreve 20–30 vars. |
| Migração quebrando loja antiga | Backfill idempotente + `niche` preservado como string legível. |