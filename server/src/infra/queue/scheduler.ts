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
  biweekly: '0 9 * * 1', // fires weekly; shouldRunBiweeklySweep() below skips alternate weeks
  monthly: '0 9 1 * *',
};

const BIWEEKLY_LAST_RUN_KEY = 'scheduler:biweekly:last-run-at';
// 13 days, not 14: a cron that fires a few minutes early (or a worker
// restart that reschedules slightly off-beat) must never get skipped for
// an extra week. Tracking a persisted last-run timestamp (instead of
// deriving "is this an even/odd week" from the calendar) is what makes this
// immune to year boundaries — a year with 53 ISO weeks flips calendar-week
// parity and either doubles up or skips a sweep under the old approach.
const BIWEEKLY_INTERVAL_MS = 13 * 24 * 60 * 60 * 1000;

async function shouldRunBiweeklySweep(now: Date): Promise<boolean> {
  const lastRunIso = await redisConnection.get(BIWEEKLY_LAST_RUN_KEY);
  if (!lastRunIso) return true;
  return now.getTime() - new Date(lastRunIso).getTime() >= BIWEEKLY_INTERVAL_MS;
}

async function recordBiweeklySweepRun(now: Date): Promise<void> {
  await redisConnection.set(BIWEEKLY_LAST_RUN_KEY, now.toISOString());
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
    const now = new Date();
    if (env.SCHEDULED_DISBURSEMENT_CADENCE === 'biweekly' && !(await shouldRunBiweeklySweep(now))) {
      logger.info('Biweekly cadence configured, last sweep was under 13 days ago, skipping this week');
      return;
    }

    await withdrawalsService.runScheduledSweep();

    if (env.SCHEDULED_DISBURSEMENT_CADENCE === 'biweekly') {
      await recordBiweeklySweepRun(now);
    }
  },
  { connection: redisConnection },
);

schedulerWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Scheduled sweep job failed');
});
