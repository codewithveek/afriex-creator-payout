import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const resend = new Resend(env.RESEND_API_KEY);

function ensureFrom(): string {
  return env.RESEND_FROM_EMAIL || 'noreply@afriexcreatorpayout.com';
}

interface EmailUser {
  id: string;
  email: string;
  name: string;
}

export async function sendWelcomeEmail(user: EmailUser): Promise<void> {
  try {
    await resend.emails.send({
      from: ensureFrom(),
      to: user.email,
      subject: 'Welcome to Afriex Creator Payout',
      html: `
        <h1>Welcome, ${user.name}!</h1>
        <p>Your creator account has been created successfully.</p>
        <p>You can now set up your payout methods and start receiving payments.</p>
        <p><a href="${env.FRONTEND_URL || env.BETTER_AUTH_URL}/dashboard">Go to your dashboard</a></p>
      `,
    });
    logger.info({ userId: user.id }, 'Welcome email sent');
  } catch (err) {
    logger.error({ err, userId: user.id }, 'Failed to send welcome email');
  }
}

export async function sendWithdrawalConfirmation(params: {
  user: EmailUser;
  amount: string;
  currency: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: ensureFrom(),
      to: params.user.email,
      subject: `Withdrawal of ${params.currency} ${params.amount} is being processed`,
      html: `
        <h1>Withdrawal Initiated</h1>
        <p>Hi ${params.user.name},</p>
        <p>Your withdrawal of <strong>${params.currency} ${params.amount}</strong> is being processed.</p>
        <p>You will receive a notification once the funds are sent.</p>
      `,
    });
    logger.info({ userId: params.user.id, amount: params.amount }, 'Withdrawal confirmation email sent');
  } catch (err) {
    logger.error({ err, userId: params.user.id }, 'Failed to send withdrawal confirmation email');
  }
}

export async function sendWithdrawalCompleted(params: {
  user: EmailUser;
  amount: string;
  currency: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: ensureFrom(),
      to: params.user.email,
      subject: `Your withdrawal of ${params.currency} ${params.amount} has been sent`,
      html: `
        <h1>Withdrawal Completed</h1>
        <p>Hi ${params.user.name},</p>
        <p>Your withdrawal of <strong>${params.currency} ${params.amount}</strong> has been completed successfully.</p>
      `,
    });
    logger.info({ userId: params.user.id, amount: params.amount }, 'Withdrawal completed email sent');
  } catch (err) {
    logger.error({ err, userId: params.user.id }, 'Failed to send withdrawal completed email');
  }
}

export async function sendWithdrawalFailed(params: {
  user: EmailUser;
  amount: string;
  currency: string;
  reason: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: ensureFrom(),
      to: params.user.email,
      subject: `Your withdrawal of ${params.currency} ${params.amount} has failed`,
      html: `
        <h1>Withdrawal Failed</h1>
        <p>Hi ${params.user.name},</p>
        <p>Your withdrawal of <strong>${params.currency} ${params.amount}</strong> has failed.</p>
        <p><strong>Reason:</strong> ${params.reason}</p>
        <p>The funds have been credited back to your balance.</p>
      `,
    });
    logger.info({ userId: params.user.id, amount: params.amount }, 'Withdrawal failed email sent');
  } catch (err) {
    logger.error({ err, userId: params.user.id }, 'Failed to send withdrawal failed email');
  }
}

export async function sendPasswordResetEmail(params: {
  user: { email: string; name: string };
  url: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: ensureFrom(),
      to: params.user.email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${params.user.name},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${params.url}">${params.url}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
    logger.info({ email: params.user.email }, 'Password reset email sent');
  } catch (err) {
    logger.error({ err }, 'Failed to send password reset email');
  }
}

export async function sendDataExport(params: {
  user: EmailUser;
  data: unknown;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: ensureFrom(),
      to: params.user.email,
      subject: 'Your data export is ready',
      html: `
        <h1>Data Export</h1>
        <p>Hi ${params.user.name},</p>
        <p>Your requested data export is attached below.</p>
        <pre>${JSON.stringify(params.data, null, 2)}</pre>
      `,
    });
    logger.info({ userId: params.user.id }, 'Data export email sent');
  } catch (err) {
    logger.error({ err, userId: params.user.id }, 'Failed to send data export email');
  }
}
