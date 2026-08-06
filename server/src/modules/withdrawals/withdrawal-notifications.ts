import { db } from '../../config/db';
import { logger } from '../../config/logger';
import { sendWithdrawalCompleted, sendWithdrawalFailed } from '../../infra/email/email.service';

// Shared by both places a withdrawal can reach a terminal state: the worker
// (synchronous COMPLETED response from Afriex) and the webhook router
// (async confirmation/rejection). Async settlement is the normal case for
// Afriex disbursements, so this must not live only on the worker's
// synchronous path or most creators never hear back after "requested".
export async function notifyWithdrawalOutcome(
  creatorId: string,
  params: { amount: string; currency: string; status: 'COMPLETED' | 'FAILED'; reason?: string },
): Promise<void> {
  try {
    const creator = await db.query.creators.findFirst({
      where: (c, { eq }) => eq(c.id, creatorId),
      with: { user: true },
    });
    if (!creator?.user) return;

    const user = { id: creator.user.id, email: creator.user.email, name: creator.user.name };

    if (params.status === 'COMPLETED') {
      await sendWithdrawalCompleted({ user, amount: params.amount, currency: params.currency });
    } else if (params.status === 'FAILED' && params.reason) {
      await sendWithdrawalFailed({ user, amount: params.amount, currency: params.currency, reason: params.reason });
    }
  } catch (err) {
    logger.error({ err, creatorId }, 'Failed to send withdrawal notification email');
  }
}
