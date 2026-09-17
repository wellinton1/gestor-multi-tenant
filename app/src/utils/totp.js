// Util centralizado de verificação TOTP (otplib v13).
//
// Na v13 a API mudou:
//   - verifySync recebe UM objeto: verifySync({ secret, token, ... })
//   - retorna UM objeto: { valid: true/false, delta }
//   - chamadas posicionais verifySync(token, secret) lançam SecretMissingError
//   - epochTolerance (segundos) tolera relógio do celular dessincronizado
//     (default 0 = só aceita a janela atual de 30s)
const { verifySync } = require('otplib');

// Tolerância de ±30s (±1 janela TOTP) para relógios dessincronizados
// entre servidor e app autenticador (Google Authenticator, Authy, etc).
const TOTP_EPOCH_TOLERANCE = 30;

// Verifica um código TOTP de 6 dígitos. Retorna true/false — nunca lança.
// Tokens malformados (tamanho/formato) também retornam false.
function verifyTotpToken(token, secret) {
  try {
    if (!token || !secret) return false;
    const result = verifySync({
      secret,
      token: String(token).trim(),
      epochTolerance: TOTP_EPOCH_TOLERANCE
    });
    return !!(result && result.valid === true);
  } catch {
    return false;
  }
}

module.exports = { verifyTotpToken, TOTP_EPOCH_TOLERANCE };
