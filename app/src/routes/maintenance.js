// Central de Manutencao (sala de maquinas do sistema).
//
// Pagina separada, exclusiva do administrador da plataforma, que concentra
// tudo que e operacao em um so lugar, com explicacao em cada card:
// saude do sistema, backups, bancos dedicados, atualizacao e reinicio.
//
//   GET  /api/maintenance/status    snapshot (sem segredos: senhas nunca saem)
//   POST /api/maintenance/restart   reinicia o processo (systemd sobe de novo;
//                                   no Windows, reabra o run-server.bat)
const express = require('express');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { isGlobalAdmin } = require('../utils/access');
const { runAsAdmin } = require('../data/tenant-context');

const router = express.Router();
router.use(requireLogin);
router.use((req, res, next) => {
  const user = store.findById('users', req.session.userId);
  if (!user || !isGlobalAdmin(user)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode acessar a manutencao.' });
  }
  next();
});

function gitCommit() {
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    const root = path.join(__dirname, '..', '..');
    return String(execSync('git rev-parse --short HEAD', { cwd: root, timeout: 5000 })).trim();
  } catch (e) {
    return null;
  }
}

// Foto geral do sistema, sem expor nenhum segredo (.env, senhas, tokens).
router.get('/status', (req, res) => {
  try {
    const mem = process.memoryUsage();
    const counts = runAsAdmin(() => {
      const out = {};
      for (const c of store.COLLECTIONS) out[c] = store.all(c).length;
      return out;
    });
    let backups = { total: 0, latest: null };
    let tenants = [];
    try {
      const list = require('../utils/backup').listBackups();
      backups = {
        total: list.backups.length,
        totalSizeBytes: list.totalSize,
        latest: list.backups[0] || null,
        autoEnabled: list.config.autoEnabled,
        intervalHours: list.config.intervalHours
      };
    } catch (e) { /* pasta de backups ainda nao existe */ }
    try {
      tenants = runAsAdmin(() => store.getTenantDatabaseStatus()).map((t) => ({
        establishmentId: t.establishmentId,
        name: t.name,
        dedicated: t.dedicated,
        dbName: t.dbName,
        appointments: t.counts.appointments
      }));
    } catch (e) { /* store ainda sem suporte multi-banco */ }
    res.json({
      now: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      node: process.version,
      platform: process.platform,
      version: require('../../package.json').version,
      gitCommit: gitCommit(),
      memory: { rssMB: Math.round(mem.rss / 1048576), heapUsedMB: Math.round(mem.heapUsed / 1048576) },
      env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: Number(process.env.PORT) || 3000,
        rlsEnabled: String(process.env.RLS_ENABLED || 'true').toLowerCase() !== 'false',
        autoProvision: String(process.env.TENANT_AUTO_PROVISION || 'false').toLowerCase() === 'true',
        seedDemoData: process.env.SEED_DEMO_DATA === 'true'
      },
      counts,
      backups,
      tenants,
      dedicatedCount: tenants.filter((t) => t.dedicated).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao ler status.' });
  }
});

// Reinicio: responde primeiro e encerra o processo em seguida.
// - Linux/systemd (Restart=on-failure): o servico sobe sozinho em segundos.
// - Windows: o processo morre — reabra o run-server.bat (como admin, se PORT=80).
router.post('/restart', (req, res) => {
  res.json({
    ok: true,
    message: 'Reiniciando... aguarde ~10s e recarregue. Na VPS o servico sobe sozinho; no Windows, reabra o run-server.bat.'
  });
  setTimeout(() => process.exit(1), 1500);
});

// ---------- Segurança do servidor (terminal da Manutenção) ----------
// Comandos FIXOS (allowlist, nenhuma entrada do usuario chega ao shell).
// Na VPS o instalador cria /etc/sudoers.d/gestor-multi-tenant liberando
// NOPASSWD só para estes; sem isso, cada endpoint devolve o comando SSH
// equivalente para colar no terminal.
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const MAINT_PATH = require('path');
const MAINT_DATA_DIR = MAINT_PATH.join(__dirname, '..', '..', 'data');
const UPGRADE_LOG = MAINT_PATH.join(MAINT_DATA_DIR, 'maintenance-upgrade.log');
const UPGRADE_LOCK = MAINT_PATH.join(MAINT_DATA_DIR, 'maintenance-upgrade.lock');

function runFixed(cmd, args, timeoutMs) {
  try {
    const out = execFileSync(cmd, args, {
      timeout: timeoutMs || 20000,
      maxBuffer: 2 * 1024 * 1024,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const t = String(out).trim();
    return { ok: true, output: t || '(sem saída)' };
  } catch (e) {
    const so = e.stdout ? String(e.stdout).trim() : '';
    const se = e.stderr ? String(e.stderr).trim() : '';
    const t = (so + (so && se ? '\n' : '') + se).trim();
    return { ok: false, output: t || (e.killed ? 'Tempo esgotado.' : (e.message || 'Falha')) };
  }
}
function sudoN(args, timeoutMs) {
  return runFixed('sudo', ['-n', ...args], timeoutMs);
}
function noSudoHint(sshCmd) {
  return 'Sem permissão (falta o sudoers do instalador).\n'
    + 'Na VPS, rode: ' + sshCmd + '\n'
    + 'Ou rode o install.sh de novo (idempotente) para liberar os botões.';
}

// ---------- Detecção de SO ----------
// Lê /etc/os-release uma vez e decide: família (debian/rhel/arch/alpine),
// gerenciador de pacotes e onde fica o log de SSH. Tudo daqui ajusta os
// comandos automaticamente — nada hardcoded para Ubuntu.
let osInfoCache = null;
function detectOS() {
  if (osInfoCache) return osInfoCache;
  const info = {
    platform: process.platform,
    distroId: null,
    name: null,
    version: null,
    family: 'unknown',
    pkg: null,
    sshLog: null
  };
  if (process.platform === 'linux') {
    try {
      const text = fs.readFileSync('/etc/os-release', 'utf8');
      const get = (k) => {
        const m = text.match(new RegExp('^' + k + '=(.*)$', 'm'));
        return m ? m[1].trim().replace(/^"|"$/g, '') : '';
      };
      info.distroId = (get('ID') || '').toLowerCase() || null;
      info.name = get('PRETTY_NAME') || get('NAME') || 'Linux';
      info.version = get('VERSION_ID') || null;
      const like = ((get('ID_LIKE') || '') + ' ' + (info.distroId || '')).toLowerCase();
      if (/debian|ubuntu|raspbian|linuxmint|pop/.test(like)) info.family = 'debian';
      else if (/rhel|fedora|centos|rocky|alma|ol|amzn/.test(like)) info.family = 'rhel';
      else if (/arch|manjaro|endeavour/.test(like)) info.family = 'arch';
      else if (/alpine/.test(like)) info.family = 'alpine';
      info.pkg = { debian: 'apt', rhel: 'dnf', arch: 'pacman', alpine: 'apk' }[info.family] || null;
      info.sshLog = info.family === 'rhel' ? '/var/log/secure' : '/var/log/auth.log';
    } catch (e) { info.name = 'Linux (desconhecido)'; }
  } else if (process.platform === 'win32') {
    info.name = 'Windows';
    info.family = 'windows';
  } else if (process.platform === 'darwin') {
    info.name = 'macOS';
    info.family = 'macos';
  }
  osInfoCache = info;
  return info;
}

// Resumo do SO para o painel exibir ("SO detectado: ...").
router.get('/security/os', (req, res) => {
  const info = detectOS();
  const notes = [];
  if (info.family === 'debian') notes.push('upgrades via apt');
  else if (info.family === 'rhel') notes.push('upgrades via dnf (sudoers cobre apt; ajuste manual p/ dnf)');
  else if (info.family === 'arch') notes.push('upgrades via pacman (sudoers cobre apt; ajuste manual)');
  else if (info.family === 'alpine') notes.push('upgrades via apk (sudoers cobre apt; ajuste manual)');
  else notes.push('família desconhecida: botões mostram o comando SSH equivalente');
  res.json({ ...info, notes });
});

// SSH: tentativas falhas no log do sistema (caminho varia por família:
// /var/log/auth.log no Debian/Ubuntu, /var/log/secure no RHEL/CentOS).
router.get('/security/ssh', (req, res) => {
  const info = detectOS();
  const logPath = info.sshLog || '/var/log/auth.log';
  const sshCmd = 'sudo grep "Failed" ' + logPath + ' | tail -15';
  if (process.platform !== 'linux') {
    return res.json({ cmd: sshCmd, output: 'Disponível só em Linux (esta máquina é ' + (info.name || process.platform) + ').\nNa VPS rode: ' + sshCmd });
  }
  const r = sudoN(['cat', logPath, logPath + '.1']);
  const text = (r.output || '').trim();
  if (!text || /is not allowed to execute|no tty|permission denied/i.test(text)) {
    return res.json({ cmd: 'sudo cat ' + logPath, output: noSudoHint(sshCmd) });
  }
  const fails = text.split('\n').filter((l) => /failed/i.test(l));
  const ipCount = {};
  fails.forEach((l) => {
    const m = l.match(/from (\d+\.\d+\.\d+\.\d+)/);
    if (m) ipCount[m[1]] = (ipCount[m[1]] || 0) + 1;
  });
  const top = Object.entries(ipCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const last = fails.slice(-15);
  let out = 'SO: ' + (info.name || 'Linux') + ' · log: ' + logPath + '\nTentativas SSH falhas: ' + fails.length + ' | IPs distintos: ' + Object.keys(ipCount).length;
  out += '\n\nTop atacantes:\n' + (top.length ? top.map(([ip, n]) => '  ' + n + 'x  ' + ip).join('\n') : '  (nenhum)');
  out += '\n\nÚltimas tentativas:\n' + (last.length ? last.map((l) => '  ' + l.slice(-220)).join('\n') : '  (nenhuma — bom sinal)');
  res.json({ cmd: sshCmd, output: out });
});

// Portas: o que está escutando (LISTEN) nesta máquina.
router.get('/security/ports', (req, res) => {
  if (process.platform !== 'linux') {
    return res.json({ cmd: 'ss -tlnp', output: 'Disponível só em Linux.\nNa VPS rode: ss -tlnp' });
  }
  let cmd = 'sudo ss -tlnp';
  let r = sudoN(['ss', '-tlnp']);
  if (!r.ok && !(r.output || '').trim()) {
    cmd = 'ss -tln';
    r = runFixed('ss', ['-tln']);
  }
  if (!r.ok && !(r.output || '').trim()) {
    return res.json({ cmd, output: noSudoHint('ss -tlnp') });
  }
  const lines = r.output.split('\n').filter(Boolean);
  const listen = lines.filter((l) => /LISTEN/.test(l));
  const summary = listen.map((l) => {
    const parts = l.trim().split(/\s+/);
    return '  ' + (parts[0] || '?') + '  ' + (parts[3] || '?') + '  <- ' + (parts[4] || '?');
  });
  res.json({
    cmd,
    output: 'Portas escutando (TCP): ' + listen.length + '\n'
      + (summary.join('\n') || '  (nenhuma)')
      + '\n\nEsperado: 80/443 (nginx), ' + (process.env.PORT || 3000) + ' (app, só 127.0.0.1), 5432 (postgres, só 127.0.0.1).\n'
      + 'Estranho alguma porta aberta para 0.0.0.0 que você não reconhece? Feche no firewall.'
  });
});

// Firewall: UFW + iptables (leitura) + lembrete de Security Groups AWS.
router.get('/security/firewall', (req, res) => {
  if (process.platform !== 'linux') {
    return res.json({ cmd: 'sudo ufw status verbose', output: 'Disponível só em Linux.\nNa VPS rode: sudo ufw status verbose' });
  }
  const sections = [];
  const ufw = sudoN(['ufw', 'status', 'verbose']);
  sections.push('== UFW ==\n' + ((ufw.output || '').trim() || '(sem saída)') + ((/not allowed|no tty|permission denied/i.test(ufw.output || '') || (!ufw.ok && !(ufw.output || '').trim())) ? '\n' + noSudoHint('sudo ufw status verbose') : ''));
  const ipt = sudoN(['iptables', '-S']);
  let iptText = (ipt.output || '').trim().split('\n').slice(0, 60).join('\n') || '(sem saída)';
  if (/not allowed|no tty|permission denied/i.test(ipt.output || '') || (!ipt.ok && !(ipt.output || '').trim())) {
    iptText = noSudoHint('sudo iptables -S');
  }
  sections.push('== iptables (primeiras 60 regras) ==\n' + iptText);
  sections.push('== AWS Security Groups ==\n'
    + 'O firewall da nuvem fica FORA da VPS: console EC2 → Instâncias → sua instância → Segurança.\n'
    + 'Deixe: 80 (HTTP) e 443 (HTTPS) p/ 0.0.0.0/0 · 22 (SSH) só p/ SEU IP · nada de 3000/5432 p/ internet.');
  res.json({ cmd: 'sudo ufw status verbose && sudo iptables -S', output: sections.join('\n\n') });
});

// Atualizações pendentes (somente leitura) — comando varia por família.
router.get('/security/updates', (req, res) => {
  const info = detectOS();
  if (process.platform !== 'linux') {
    return res.json({ cmd: 'apt list --upgradable', output: 'Disponível só em Linux (aqui: ' + (info.name || process.platform) + ').\nNa VPS rode: sudo apt update && apt list --upgradable' });
  }
  const soLine = 'SO: ' + (info.name || 'Linux') + (info.pkg ? ' · gerenciador: ' + info.pkg : '') + '\n';
  if (info.family === 'debian' || !info.pkg) {
    let r = runFixed('/usr/lib/update-notifier/apt-check', [], 15000);
    if (r.ok && /^\d+;\d+/m.test(r.output)) {
      const m = r.output.match(/(\d+);(\d+)/);
      return res.json({
        cmd: '/usr/lib/update-notifier/apt-check',
        output: soLine + 'Pacotes atualizáveis: ' + m[1] + ' (' + m[2] + ' de segurança).\n'
          + (Number(m[1]) > 0 ? 'Use o botão "Atualizar sistema" ou rode na VPS: sudo apt update && sudo apt upgrade -y' : 'Sistema em dia.')
      });
    }
    r = runFixed('apt', ['list', '--upgradable'], 90000);
    if (!r.ok && !(r.output || '').trim()) {
      return res.json({ cmd: 'apt list --upgradable', output: soLine + 'Não consegui ler a lista.\nNa VPS rode: sudo apt update && apt list --upgradable\n\n' + (r.output || '') });
    }
    const pkgs = r.output.split('\n').filter((l) => l && !/^listing/i.test(l));
    return res.json({
      cmd: 'apt list --upgradable',
      output: soLine + 'Pacotes atualizáveis: ' + pkgs.length + '\n'
        + (pkgs.slice(0, 40).join('\n') || '(nenhum — sistema em dia)')
        + (pkgs.length > 40 ? '\n... e mais ' + (pkgs.length - 40) : '')
    });
  }
  if (info.family === 'rhel') {
    // dnf check-update sai com código 100 quando HÁ updates (não é erro).
    const r = runFixed('dnf', ['check-update'], 90000);
    const pkgs = (r.output || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^last metadata|^loaded|^update /i.test(l));
    return res.json({
      cmd: 'dnf check-update',
      output: soLine + 'Pacotes atualizáveis: ~' + pkgs.length + '\n'
        + (pkgs.slice(0, 40).join('\n') || '(nenhum — sistema em dia)')
        + (pkgs.length > 40 ? '\n... e mais ' + (pkgs.length - 40) : '')
    });
  }
  if (info.family === 'arch') {
    const r = runFixed('pacman', ['-Qu'], 90000);
    const pkgs = (r.output || '').split('\n').map((l) => l.trim()).filter(Boolean);
    return res.json({
      cmd: 'pacman -Qu',
      output: soLine + 'Pacotes atualizáveis: ' + pkgs.length + '\n'
        + (pkgs.slice(0, 40).join('\n') || (/database|sync/i.test(r.output || '') ? '(rode antes: sudo pacman -Sy)' : '(nenhum — sistema em dia)'))
        + (pkgs.length > 40 ? '\n... e mais ' + (pkgs.length - 40) : '')
    });
  }
  if (info.family === 'alpine') {
    const r = runFixed('apk', ['list', '-u'], 90000);
    const pkgs = (r.output || '').split('\n').map((l) => l.trim()).filter(Boolean);
    return res.json({
      cmd: 'apk list -u',
      output: soLine + 'Pacotes atualizáveis: ' + pkgs.length + '\n'
        + (pkgs.slice(0, 40).join('\n') || '(nenhum — sistema em dia)')
        + (pkgs.length > 40 ? '\n... e mais ' + (pkgs.length - 40) : '')
    });
  }
  return res.json({
    cmd: 'cat /etc/os-release',
    output: soLine + 'Família desconhecida: não sei o gerenciador de pacotes.\nNa VPS rode o comando da sua distro.'
  });
});

function upgradeRunning() {
  try {
    const pid = Number(fs.readFileSync(UPGRADE_LOCK, 'utf8').trim());
    if (!pid) return false;
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Atualização do SO em segundo plano (log acompanha via /upgrade-log).
// Comando ajustado à família: apt (debian), dnf (rhel), pacman (arch), apk (alpine).
// ATENÇÃO: altera a máquina — o botão do painel pede confirmação antes.
const UPGRADE_CMDS = {
  debian: 'apt-get update -y && apt-get upgrade -y',
  rhel: 'dnf upgrade -y',
  arch: 'pacman -Syu --noconfirm',
  alpine: 'apk update && apk upgrade'
};
router.post('/security/upgrade', (req, res) => {
  const info = detectOS();
  if (process.platform !== 'linux') {
    return res.status(400).json({ error: 'Disponível só em Linux (aqui: ' + (info.name || process.platform) + ').' });
  }
  const upgradeCmd = UPGRADE_CMDS[info.family];
  if (!upgradeCmd) {
    return res.status(400).json({ error: 'Família "' + info.family + '" sem comando de upgrade conhecido. Rode manual na VPS.' });
  }
  if (upgradeRunning()) {
    return res.status(409).json({ error: 'Já existe uma atualização rodando. Acompanhe pelo terminal.' });
  }
  try {
    fs.mkdirSync(MAINT_DATA_DIR, { recursive: true });
  } catch (e) { /* segue */ }
  const stamp = new Date().toISOString();
  try {
    fs.appendFileSync(UPGRADE_LOG, '\n===== upgrade (' + info.family + ') iniciado em ' + stamp + ' =====\n$ sudo bash -c \'' + upgradeCmd + '\'\n');
  } catch (e) {
    return res.status(500).json({ error: 'Não consegui escrever o log em ' + UPGRADE_LOG });
  }
  const fd = fs.openSync(UPGRADE_LOG, 'a');
  const child = spawn('sudo', ['-n', 'bash', '-c', upgradeCmd], {
    detached: true,
    stdio: ['ignore', fd, fd]
  });
  child.unref();
  try { fs.writeFileSync(UPGRADE_LOCK, String(child.pid)); } catch (e) { /* segue */ }
  child.on('exit', (code) => {
    try { fs.appendFileSync(UPGRADE_LOG, '\n===== upgrade terminou (código ' + code + ') em ' + new Date().toISOString() + ' =====\n'); } catch (e) { /* segue */ }
    try { fs.unlinkSync(UPGRADE_LOCK); } catch (e) { /* segue */ }
  });
  child.on('error', () => {
    try { fs.appendFileSync(UPGRADE_LOG, '\n===== falha ao iniciar (sudo sem permissão?) =====\n'); } catch (e) { /* segue */ }
    try { fs.unlinkSync(UPGRADE_LOCK); } catch (e) { /* segue */ }
  });
  res.json({ ok: true, message: 'Atualização iniciada em segundo plano. Acompanhe pelo terminal.' });
});

router.get('/security/upgrade-log', (req, res) => {
  let log = '';
  try {
    log = fs.readFileSync(UPGRADE_LOG, 'utf8').slice(-12000);
  } catch (e) {
    log = '(nenhuma atualização rodada por aqui ainda)';
  }
  res.json({ running: upgradeRunning(), log });
});

module.exports = router;
