const { Client } = require('pg');
const POSTGRES_PASSWORD = require('fs').readFileSync('C:/Users/WELLIN~1/AppData/Local/Temp/opencode/pgpw.txt', 'utf8').trim();
console.log('senha len:', POSTGRES_PASSWORD.length);
const c = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password: POSTGRES_PASSWORD, database: 'postgres', connectionTimeoutMillis: 8000 });
c.connect().then(() => c.query('SELECT 1 AS ok')).then((r) => { console.log('query', r.rows); return c.end(); }).catch((e) => { console.error('ERR:', JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 600)); process.exit(1); });
