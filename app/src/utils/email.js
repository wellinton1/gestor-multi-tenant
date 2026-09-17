// Email utility for sending transactional emails
// Supports multiple providers via nodemailer

const nodemailer = require('nodemailer');

let transporter = null;
let emailConfig = null;

function getEmailConfig() {
  if (emailConfig) return emailConfig;
  
  // Configuração via variáveis de ambiente
  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.SMTP_FROM || `"Gestor Multi-Tenant" <${process.env.SMTP_USER}>`
  };
  
  // Se não tem configuração SMTP, tenta usar o provedor de pagamento (ex: AbacatePay não tem email)
  // Ou usa Ethereal Email para desenvolvimento (teste)
  if (!config.host || !config.auth.user) {
    console.warn('SMTP não configurado. Emails de recuperação de senha não serão enviados.');
    return null;
  }
  
  emailConfig = config;
  return config;
}

function createTransporter() {
  if (transporter) return transporter;
  
  const config = getEmailConfig();
  if (!config) return null;
  
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });
  
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const config = getEmailConfig();
  if (!config) {
    console.log('[EMAIL MOCK] Para:', to);
    console.log('[EMAIL MOCK] Assunto:', subject);
    console.log('[EMAIL MOCK] HTML:', html);
    return { success: false, reason: 'SMTP não configurado', mock: true };
  }
  
  const transport = createTransporter();
  if (!transport) {
    return { success: false, reason: 'Falha ao criar transporter' };
  }
  
  try {
    const info = await transport.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
    return { success: false, reason: err.message };
  }
}

// Templates de email
const EMAIL_TEMPLATES = {
  passwordReset: (resetUrl, userName, expiresHours) => ({
    subject: 'Redefinição de senha - Painel de Gestão',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Painel de Gestão</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e8eaed; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Olá, ${userName || 'Usuário'}!</h2>
          <p style="color: #4b5563; font-size: 16px;">Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">Redefinir Senha</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ou copie e cole este link no navegador:</p>
          <p style="color: #6366f1; font-size: 13px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 8px;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e8eaed; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            Este link expira em <strong>${expiresHours} horas</strong>.<br>
            Se você não solicitou esta redefinição, ignore este email.<br>
            Por segurança, não compartilhe este link com ninguém.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Painel de Gestão Multi-Tenant
        </div>
      </body>
      </html>
    `
  }),
  
  twoFactorEnabled: (userName) => ({
    subject: 'Autenticação de dois fatores ativada - Painel de Gestão',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #14b8a6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Painel de Gestão</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e8eaed; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Olá, ${userName || 'Usuário'}!</h2>
          <p style="color: #4b5563; font-size: 16px;">A autenticação de dois fatores (2FA) foi <strong>ativada</strong> na sua conta.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #15803d; font-size: 14px;">Agora, ao fazer login, você precisará inserir o código do seu autenticador (Google Authenticator, Authy, etc.) após a senha.</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Se não foi você, entre em contato com o administrador imediatamente.</p>
        </div>
      </body>
      </html>
    `
  }),
  
  twoFactorDisabled: (userName, byAdmin = false) => ({
    subject: 'Autenticação de dois fatores desativada - Painel de Gestão',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Painel de Gestão</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e8eaed; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Olá, ${userName || 'Usuário'}!</h2>
          <p style="color: #4b5563; font-size: 16px;">A autenticação de dois fatores (2FA) foi <strong>desativada</strong> na sua conta${byAdmin ? ' pelo administrador da plataforma' : ''}.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">Sua conta agora está protegida apenas por senha. Recomendamos reativar o 2FA nas configurações.</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Se não foi você, altere sua senha imediatamente e contate o administrador.</p>
        </div>
      </body>
      </html>
    `
  })
};

async function sendPasswordResetEmail(email, resetToken, userName, baseUrl) {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  const expiresHours = Number(process.env.PASSWORD_RESET_EXPIRES_HOURS) || 2;
  const template = EMAIL_TEMPLATES.passwordReset(resetUrl, userName, expiresHours);
  return sendEmail({ to: email, ...template });
}

async function sendTwoFactorEnabledEmail(email, userName) {
  const template = EMAIL_TEMPLATES.twoFactorEnabled(userName);
  return sendEmail({ to: email, ...template });
}

async function sendTwoFactorDisabledEmail(email, userName, byAdmin = false) {
  const template = EMAIL_TEMPLATES.twoFactorDisabled(userName, byAdmin);
  return sendEmail({ to: email, ...template });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendTwoFactorEnabledEmail,
  sendTwoFactorDisabledEmail,
  getEmailConfig
};