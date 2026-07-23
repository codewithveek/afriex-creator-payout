import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebhookVerifier, WEBHOOK_SIGNATURE_HEADER } from '@afriex/sdk';
import type { TransactionWebhookPayload } from '@afriex/sdk';
import { withdrawalsRepository } from '../../modules/withdrawals/withdrawals.repository';
import { creatorsRepository } from '../../modules/creators/creators.repository';
import { poolAccountsRepository } from '../../modules/pool-accounts/pool-accounts.repository';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ValidationError } from '../../shared/errors';

const webhookVerifier = new WebhookVerifier(env.AFRIEX_WEBHOOK_PUBLIC_KEY);

async function handleAfriexWebhook(
  request: FastifyRequest<{ Body: Buffer }>,
  reply: FastifyReply,
) {
  const signature = request.headers[WEBHOOK_SIGNATURE_HEADER];
  const rawBody = request.body.toString('utf8');
  const signatureStr = typeof signature === 'string' ? signature : undefined;

  if (!signatureStr || !webhookVerifier.verify(rawBody, signatureStr)) {
    throw new ValidationError('Invalid Afriex webhook signature');
  }

  const payload = JSON.parse(rawBody) as TransactionWebhookPayload;

  if (payload.event !== 'TRANSACTION.UPDATED') {
    logger.info({ event: payload.event }, 'Ignoring non-transaction webhook event');
    return reply.code(200).send({ data: { received: true } });
  }

  const { transactionId, status } = payload.data;

  const withdrawal = await withdrawalsRepository.findByAfriexTransactionId(transactionId);
  if (!withdrawal) {
    logger.warn({ transactionId }, 'Afriex webhook for unknown transaction');
    return reply.code(200).send({ data: { received: true } });
  }

  if (withdrawal.status === 'PAID' || withdrawal.status === 'FAILED') {
    logger.info({ withdrawalId: withdrawal.id }, 'Webhook for already-terminal withdrawal, ignoring');
    return reply.code(200).send({ data: { received: true } });
  }

  if (status === 'COMPLETED' || status === 'SUCCESS') {
    await withdrawalsRepository.markPaid(withdrawal.id);
    logger.info({ withdrawalId: withdrawal.id }, 'Withdrawal confirmed PAID via Afriex webhook');
  } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'REJECTED') {
    await withdrawalsRepository.markFailed(withdrawal.id, `Afriex reported ${status}`);
    await creatorsRepository.incrementBalance(
      withdrawal.creatorId,
      withdrawal.amount,
      withdrawal.currency as 'USD' | 'NGN' | 'GHS' | 'KES',
    );
    await poolAccountsRepository.incrementBalance(withdrawal.poolAccountId, withdrawal.amount);
    logger.warn({ withdrawalId: withdrawal.id }, 'Withdrawal FAILED via Afriex webhook, balances credited back');
  }

  return reply.code(200).send({ data: { received: true } });
}

export async function afriexWebhookRoutes(fastify: FastifyInstance) {
  fastify.register(async (instance) => {
    instance.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_request, body, done) => done(null, body),
    );

    instance.post('/api/webhooks/afriex', { handler: handleAfriexWebhook });
  });
}
