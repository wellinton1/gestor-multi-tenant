const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

const { findAvailablePort } = require('../src/utils/port');

test('findAvailablePort returns the next free port when the preferred one is busy', async () => {
  const occupiedServer = net.createServer();
  await new Promise((resolve) => occupiedServer.listen(0, '127.0.0.1', resolve));

  const occupiedPort = occupiedServer.address().port;
  const nextPort = await findAvailablePort(occupiedPort);

  assert.equal(nextPort, occupiedPort + 1);

  await new Promise((resolve, reject) => {
    occupiedServer.close((err) => (err ? reject(err) : resolve()));
  });
});
