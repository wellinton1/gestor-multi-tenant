/* ============================================================================
   Migrate existent establishments to theme system (non-destructive).
   Idempotent: safe to run multiple times.

   Usage:
     cd app
     node scripts/migrate-themes.js           # dry-run (prints what would change)
     node scripts/scripts/migrate-themes.js --apply
   ============================================================================ */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Map: niche legado -> theme slug (corresponds to /public/themes/<slug>.css)
const NICHE_TO_THEME = {
  Barbearia: 'servicos',
  Pizzaria: 'alimentacao',
  'Lava Jato': 'servicos',
  'Salao de Beleza': 'servicos',
  'Doces e Salgados': 'alimentacao',
  Oficina: 'servicos',
  Petshop: 'servicos',
  Outro: 'generico'
};

// Se NICHE_TO_THEME nao tem o nicho, fallback para 'generico'.
function resolveTheme(niche) {
  return NICHE_TO_THEME[niche] || 'generico';
}

function main() {
  const apply = process.argv.includes('--apply');
  if (!apply) {
    console.log('=== DRY RUN === (use --apply para executar mudancas)\n');
  }

  if (!fs.existsSync(DB_FILE)) {
    console.error('db.json nao encontrado em', DB_FILE);
    console.error('Rode o servidor uma vez primeiro para cria-lo.');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  let changes = 0;
  const report = [];

  if (!Array.isArray(db.establishments)) {
    console.error('Colecao "establishments" nao encontrada.');
    process.exit(1);
  }

  for (const est of db.establishments) {
    const desiredTheme = resolveTheme(est.niche);
    const desiredPlan = est.plan || 'free';

    const before = { theme: est.theme, plan: est.plan, accentOverride: est.accentOverride, paused: est.paused };
    const after = {
      theme: est.theme || desiredTheme,
      plan: est.plan || 'free',
      accentOverride: est.accentOverride || null,
      paused: est.paused === true ? true : false
    };

    if (before.theme !== after.theme || before.plan !== after.plan || before.paused !== after.paused) {
      changes++;
      report.push({
        name: est.name,
        niche: est.niche,
        theme: before.theme + ' -> ' + after.theme,
        plan: before.plan + ' -> ' + after.plan,
        paused: before.paused + ' -> ' + after.paused
      });
      if (apply) {
        est.theme = after.theme;
        est.plan = after.plan;
        est.paused = after.paused;
        if (!est.accentOverride) est.accentOverride = null;
      }
    }
  }

  if (apply && changes > 0) {
    // Backup antes de gravar
    const backup = DB_FILE + '.pre-migration-' + Date.now();
    fs.copyFileSync(DB_FILE, backup);
    console.log('Backup criado em', backup);

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('\n' + changes + ' estabelecimento(s) atualizado(s) em', DB_FILE);
  } else if (changes === 0) {
    console.log('Nenhum estabelecimento precisa migracao. Tudo OK.');
  } else {
    console.log(changes + ' estabelecimento(s) seriam migrados:');
  }

  if (report.length > 0) {
    console.log('\n--- RELATORIO ---');
    for (const r of report) {
      console.log('  ' + r.name + ' (' + r.niche + ') | theme: ' + r.theme + ' | plan: ' + r.plan);
    }
  }

  console.log('\nResumo:');
  console.log('  Total estabelecimentos:', db.establishments.length);
  console.log('  Precisavam mudanca:', changes);
  console.log('  Aplicado:', apply ? 'SIM' : 'NAO (dry-run)');
}

main();