import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - email functionality will be disabled');
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = 'ClockAlign <noreply@clockalign.app>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}

export async function sendEmail({ to, subject, react, replyTo }: SendEmailOptions) {
  if (!resend) {
    console.warn('Email not sent - Resend client not configured');
    return { error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
      replyTo,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Email send error:', err);
    return { error: 'Failed to send email' };
  }
}
