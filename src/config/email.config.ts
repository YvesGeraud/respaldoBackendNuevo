function opcional(nombre: string, porDefecto: string): string {
  const valor = process.env[nombre];
  return valor && valor.trim() !== '' ? valor : porDefecto;
}

function numero(nombre: string, porDefecto: number): number {
  const raw = process.env[nombre];
  if (!raw || raw.trim() === '') return porDefecto;
  const n = Number(raw);
  return Number.isFinite(n) ? n : porDefecto;
}

export const mailConfig = {
  host: opcional('MAIL_HOST', 'sandbox.smtp.mailtrap.io'),
  port: numero('MAIL_PORT', 2525),
  secure: false,
  auth: {
    user: opcional('MAIL_USER', 'f808761e42d940'),
    pass: opcional('MAIL_PASS', 'bb50c8f4e32e26'),
  },
  from: opcional('MAIL_FROM', 'Restaurante <noreply@restaurante.com>'),
} as const;
