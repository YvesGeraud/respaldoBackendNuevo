export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** Opcional: si no se pasa, usa MAIL_FROM */
  from?: string;
  /** CC, BCC, adjuntos... según necesites */
  attachments?: { filename: string; content: Buffer | string }[];
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
  