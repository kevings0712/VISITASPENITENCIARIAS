import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  throw new Error('SMTP config incompleta: define SMTP_HOST, SMTP_USER y SMTP_PASS en el .env del backend');
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // sólo true si usas 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendResetEmail(to: string, resetUrl: string) {
  const from = SMTP_FROM || SMTP_USER!;
  await transporter.sendMail({
    from,
    to,
    subject: 'Recuperar contraseña – VisiControl',
    html: `
      <p>Hola,</p>
      <p>Solicitaste recuperar tu contraseña. Haz clic en el enlace para continuar:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a></p>
      <p><small>Este enlace expira en 1 hora.</small></p>
      <p>Si no fuiste tú, ignora este correo.</p>
    `,
  });
}
