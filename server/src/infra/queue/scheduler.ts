import { Queue, Worker } from 'bullmq';
import { redisConnection } from './redis-connection';
import { withdrawalsService } from '../../modules/withdrawals/withdrawals.service';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

// Cron expressions for each supported cadence. "weekly" runs every Monday
// at 09:00 UTC; "biweekly" is approximated as every other Monday by gating
// inside the job itself (BullMQ's repeat option doesn't natively express
// "every 2 weeks" as a single cron string); "monthly" runs on the 1st.
const CADENCE_CRON: Record<typeof env.SCHEDULED_DISBURSEMENT_CADENCE, string> = {
  weekly: '0 9 * * 1',
  biweekly: '0 9 * * 1', // fires weekly; isBiweeklyWindow() below skips alternate weeks
  monthly: '0 9 1 * *',
};

function isBiweeklyWindow(date: Date): boolean {
  // ISO week number parity determines whether this Monday counts as a
  // "biweekly" disbursement week. Simple and deterministic — no external
  // state needed to track which week was last run.
  const firstJanFour = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const dayDiff = (date.getTime() - firstJanFour.getTime()) / 86_400_000;
  const week = 1 + Math.round((dayDiff - ((firstJanFour.getUTCDay() + 6) % 7)) / 7);
  return week % 2 === 0;
}

const SCHEDULER_QUEUE_NAME = 'scheduled-disbursement-sweep';

export const schedulerQueue = new Queue(SCHEDULER_QUEUE_NAME, { connection: redisConnection });

export async function registerScheduledSweep(): Promise<void> {
  const cron = CADENCE_CRON[env.SCHEDULED_DISBURSEMENT_CADENCE];

  await schedulerQueue.upsertJobScheduler('scheduled-sweep', { pattern: cron, tz: 'UTC' }, {
    name: 'sweep',
  });

  logger.info(
    { cadence: env.SCHEDULED_DISBURSEMENT_CADENCE, cron },
    'Scheduled disbursement sweep registered',
  );
}

// Runs in the same process as the disbursement worker (infra/queue/worker.ts
// imports this module too), since both are background/cron-style processes
// that should never run inside the request-handling Fastify server.
export const schedulerWorker = new Worker(
  SCHEDULER_QUEUE_NAME,
  async () => {
    if (env.SCHEDULED_DISBURSEMENT_CADENCE === 'biweekly' && !isBiweeklyWindow(new Date())) {
      logger.info('Biweekly cadence configured, this week is off-cycle, skipping sweep');
      return;
    }
    await withdrawalsService.runScheduledSweep();
  },
  { connection: redisConnection },
);

schedulerWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Scheduled sweep job failed');
});
