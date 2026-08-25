const net = require('node:net');

async function findAvailablePort(preferredPort) {
  const checkPort = (port) =>
    new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen(port, '0.0.0.0', () => {
        server.close(() => resolve(true));
      });
    });

  let port = preferredPort;
  while (port < preferredPort + 20) {
    const isAvailable = await checkPort(port);
    if (isAvailable) return port;
    port += 1;
  }

  return preferredPort;
}

module.exports = { findAvailablePort };
