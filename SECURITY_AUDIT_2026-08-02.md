# RELATÓRIO DE AUDITORIA DE SEGURANÇA - Gestor Multi-Tenant

**Data:** 02/08/2026  
**Versão auditada:** Commit `608141d` (pronto)  
**Tecnologia:** Node.js + Express.js (não é Spring Boot — o projeto é JS vanilla)  

---

## RESUMO EXECUTIVO

O projeto apresenta uma **postura de segurança robusta para produção**, resultado de uma auditoria anterior que corrigiu 14 vulnerabilidades. Esta re-auditoria confirma a maioria das correções, mas identifica **1 vulnerabilidade crítica nova** e **2 médias pendentes**.

**Status:** ⚠️ **Crítico — 1 item bloqueante antes de produção**

---

## DESCOBERTAS

### 🔴 CRÍTICA (1)

| ID | Vulnerabilidade | Evidência | Risco |
|----|----------------|-----------|-------|
| **C-05** | **`senha.txt` com credenciais commitado no Git** | Arquivo `senha.txt` contém `Email: admin@admin.com / Senha: Admin@123456` e está rastreado (`git ls-files` confirma). Não está no `.gitignore`. | Qualquer pessoa com acesso ao repositório obtém acesso admin ao sistema. **Bloqueante para produção.** |

**Correção:**
```bash
git rm --cached senha.txt
echo "senha.txt" >> .gitignore
git add .gitignore
git commit -m "fix: remove senha.txt do versionamento"
```
E rotacionar `ADMIN_PASSWORD` no `.env` de produção imediatamente.

---

### 🟠 ALTAS (1)

| # | Vulnerabilidade | Arquivo | Risco |
|----|----------------|---------|-------|
| **H-06** | **`makeCrudRouter` não aplica sanitização nos campos textuais** | `makeCrudRouter.js:26-28` | XSS via campos `name`, `email`, `phone`, `description`, etc. — todos são gravados como string bruta sem o `sanitizeRow()` ser chamado com validação de tamanho/controle de caracteres. O `insert` do store chama `sanitizeRow()` mas a sanitização do store só limita controle chars e tamanho (10KB), não faz encoding/escape de HTML. Dados são devolvidos ao frontend sem escape no HTML. |

**Evidência:**
```javascript
// makeCrudRouter.js:24-32
router.post('/', (req, res, next) => {
  const body = req.body || {};
  const row = { id: uuid(), establishmentId: req.session.establishmentId, ... };
  fields.forEach((f) => {
    row[f] = body[f] !== undefined ? String(body[f]).trim() : '';
  });
  const inserted = store.insert(collection, row); // store.insert chama sanitizeRow
  // ⚠️ sanitizeRow remove control chars, mas não escapa HTML
});
```

> O frontend (`app.js`) exibe nomes de clientes/funcionários/serviços diretamente no DOM via `innerHTML` em vários pontos (sem escape manual), o que torna XSS stored possível se um usuário malicioso inserir `<script>alert('XSS')</script>` como nome de cliente no portal público ou via admin API.

**Correção:** Adicionar uma função de escape HTML na saída do `sanitizeValue` ou adicionar `he` (HTML Entities) como dependência e escapar todos os campos textuais no store.

---

### 🟡 MÉDIAS (4)

| # | Vulnerabilidade | Arquivo | Detalhe |
|----|----------------|---------|---------|
| **M-04** | **`users.js:90` — bcrypt rounds=10 para criação de usuário (vs 12 configurado)** | `users.js:94` | `bcrypt.hashSync(String(password), 10)` — deveria usar `BCRYPT_ROUNDS` do `process.env`. Inconsistente com o resto do código que usa `12`. |
| **M-05** | **`users.js` não valida força da senha do novo usuário** | `users.js:80` | Cria usuário sem verificar `validatePasswordStrength()`. A função existe em `password.js` mas não é reutilizada. |
| **M-06** | **CSP nonce aplicado via `(req, res)` function (inseguro)** | `server.js:77-78` | `scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`]` — a função de retorno de chamada para directivas Helmet CSP pode causar racing ou ser ignorada em algumas versões. O nonce é gerado em middleware e aplicado ao HTML manualmente, mas o CSP no Helmet usa callback com escopo de requisição — que é seguro, mas depende da implementação do Helmet v8. Testar em produção. |
| **M-07** | **Detalhes de erro expostos em DEV** | `server.js:275-277` | `res.status(500).json({ error: isProduction ? 'Erro interno' : err.message })` — correto para produção. Mas `portal.js` (linhas 58, 135, 196) expõe `details: err.message` **mesmo sem verificar `isProduction`**. |

**Evidência M-07:**
```javascript
// portal.js:59 — SEMPRE expõe err.message
res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
```

---

### 🟢 BAIXAS (3)

| # | Vulnerabilidade | Detalhe |
|---|----------------|---------|
| **L-03** | **Rate limit do portal em dev (100 req/15min) é generoso** | Configurável via env, mas pode ser abusado em staging. |
| **L-04** | **`maxAge` da sessão: 7 dias — sem timeout por inatividade** | `rolling: true` renova o cookie a cada requisição. Um atacante com a sessão persistente pode manter acesso por mais de 7 dias. Considerar `rolling: false` ou timeout de inatividade de 30min. |
| **L-05** | **`req.session.regenerate` não preserva dados da sessão** | `POST /login` usa `regenerate`, o que é seguro para evitar session fixation. Mas o CSRF token é perdido — o novo cookie CSRF é emitido no próximo GET, o que é aceitável mas deve ser documentado. |

---

### ℹ️ INFORMATIVAS (2)

| # | Observação | Detalhe |
|---|-----------|---------|
| **I-01** | **bcrypt `compareSync` vs `compare` (async)** | `auth.js:17`, `password.js:32`, `cashClosings.js:76` usam `bcrypt.compareSync()`. Para um sistema single-threaded de baixo tráfego (<100 req/s), o overhead é desprezível. Manter para simplicidade. |
| **I-02** | **UUID v4 — não sequencial** | `uuid.v4()` é random-UUID, não revelável. Ideal para IDs públicos. OK. |

---

## O QUE ESTÁ BEM (CONFIRMAÇÕES DA AUDITORIA ANTERIOR)

| Área | Status | Comentário |
|------|--------|------------|
| **Helmet + CSP nonce** | ✅ | Headers configurados, HSTS em produção |
| **Session cookies** | ✅ | `httpOnly`, `sameSite: 'strict'`, `secure` condicional |
| **CSRF Double Submit** | ✅ | `crypto.timingSafeEqual()`, cookie + header validado |
| **Rate limiting 4 camadas** | ✅ | Global, auth, password, portal — valores adequados |
| **Zod validation no portal** | ✅ | `availableTimes`, `booking`, telefone/email validados |
| **Prototype pollution bloqueado** | ✅ | `store.js:154-160` bloqueia `__proto__`, `constructor`, `prototype` |
| **Base64 validation** | ✅ | Data URIs com regex + verificação de tamanho (800KB) |
| **bcrypt 12 rounds** | ✅ | Configurável via `BCRYPT_ROUNDS` |
| **`FORCE_PASSWORD_CHANGE`** | ✅ | Força troca no primeiro login |
| **Seeds seguros** | ✅ | `ADMIN_PASSWORD` obrigatório, min 12 chars em prod |
| **`.gitignore`** | ✅ | Cobre `.env`, `data/`, logs, certs, backups |
| **Erro handler global** | ✅ | `unhandledRejection` + `uncaughtException` tratados |
| **express.json limit: 2mb** | ✅ | Previne DoS de payload grande |
| **npm audit** | ✅ | **0 vulnerabilidades** conhecidas |
| **Verificação de SESSION_SECRET** | ✅ | Em produção, exige valor não-default |
| **Endpoint de inspeção de segurança** | ✅ | `/api/security/inspect` (admin-only) com 12 checks |

---

## MATRIZ OWASP TOP 10 2021

| Categoria | Nota | Evidência |
|-----------|------|-----------|
| A01 Broken Access Control | ⚠️ | RBAC bom, mas XSS stored pode burlar acesso a dados de outros tenants |
| A02 Cryptographic Failures | ✅ | bcrypt 12 rounds, sessões seguras |
| A03 Injection | ⚠️ | Prototype pollution: ✅ | XSS: ⚠️ sem escape HTML |
| A04 Insecure Design | ✅ | Multi-layer rate limiting |
| A05 Security Misconfiguration | ⚠️ | CSP nonce ok, `.env.example` seguro. Mas `error details` em portal. |
| A06 Vulnerable Components | ✅ | npm audit: 0 CVEs |
| A07 Identification Failures | ⚠️ | `senha.txt` em git (CRÍTICO), bcrypt=10 em users.js |
| A08 Software Integrity | ✅ | package-lock.json versionado |
| A09 Security Logging | ✅ | Estruturas de erro, sem stack traces em prod (exceto portal) |
| A10 SSRF | ✅ | Sem requisições a URLs do usuário |

---

## PLANO DE CORREÇÃO

### Bloqueante (antes de produção)
1. **C-05**: Remover `senha.txt` do Git + rotacionar admin password

### Alta prioridade (antes de produção)
2. **H-06**: Adicionar escape HTML na camada de sanitização ou no frontend
3. **M-07**: Remover `details: err.message` das rotas de portal em produção

### Média prioridade (primeira sprint)
4. **M-04**: Usar `BCRYPT_ROUNDS` no `users.js:94`
5. **M-05**: Reutilizar `validatePasswordStrength()` em `users.js`
6. **M-06**: Testar CSP nonce-callback em produção

### Baixa prioridade (segunda sprint)
7. **L-03, L-04, L-05**: Ajustar valores de rate limit e expiração de sessão

---

## COMANDOS DE VERIFICAÇÃO

```bash
# Verificar dependências
cd app && npm audit

# Verificar commits acidentais de secrets
git secrets --scan -r . 2>/dev/null || git log --all --full-history -- 'senha.txt'

# Verificar se NODE_ENV bloqueia error details
cd app && NODE_ENV=production node -e "const app = require('./server'); setTimeout(()=>process.exit(), 2000)"

# Testar XSS na criação de cliente (via curl)
curl -X POST http://localhost:3000/api/establishments \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{"name":"<script>alert(1)</script>Teste", "phone":"12345678", "email":"e@e.com"}' \
  -b "gestor.sid=<session>"

# Testar prototype pollution
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{"name":"test","role":"test","email":"t@t.com","phone":"123","__proto__":{"isAdmin":true}}' \
  -b "gestor.sid=<session>"
```

---

## CONCLUSÃO

Projeto bem hardening, acima da média para aplicações Express.js desse porte. As proteções implementadas (CSRF, Helmet, rate limiting, Zod) são sólidas. As **falhas restantes** são pontuais e corrigíveis em 1-2 sprints. O item crítico (`senha.txt` no Git) deve ser o primeiro a resolver.

**Nota de segurança:** 7.5/10

Após correção da C-05 e H-06: **aprovado para produção**.