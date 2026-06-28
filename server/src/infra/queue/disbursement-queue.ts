import { Queue } from 'bullmq';
import { redisConnection } from './redis-connection';

// One queue for every disbursement, regardless of trigger. The withdrawal
// row's own `trigger` column (ON_DEMAND vs SCHEDULED) already records why
// the job exists; the job payload itself only needs the withdrawal ID. This
// keeps the worker's processing logic completely trigger-agnostic — it
// processes "this withdrawal", full stop.
export interface DisbursementJobPayload {
  withdrawalId: string;
}

export const disbursementQueue = new Queue<DisbursementJobPayload>('disbursements', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 }, // keep failures longer for investigation
  },
});

export async function enqueueDisbursement(withdrawalId: string): Promise<void> {
  await disbursementQueue.add(
    'disburse',
    { withdrawalId },
    // Job ID = withdrawal ID, so BullMQ itself refuses to enqueue the same
    // withdrawal twice even if the calling code somehow tried to — a second
    // layer of idempotency on top of the cooldown/balance checks already
    // done in the service.
    { jobId: withdrawalId },
  );
}
