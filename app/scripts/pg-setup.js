// Setup manual do PostgreSQL: sobe o banco se preciso, garante schema e
// mostra contagens. O server.js ja faz isso no boot — este script serve para
// diagnostico/instalacao manual (npm run setup:pg).
require('dotenv').config();
const { ensurePostgres } = require('../src/utils/pg-embedded');
const store = require('../src/data/store');

async function main() {
  await ensurePostgres();
  await store.init();
  console.log('--- Contagens ---');
  for (const c of store.COLLECTIONS) {
    console.log(`${c}: ${store.all(c).length}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
