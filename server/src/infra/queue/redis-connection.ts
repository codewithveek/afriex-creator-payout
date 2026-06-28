import IORedis from 'ioredis';
import { env } from '../../config/env';

// BullMQ requires maxRetriesPerRequest: null on the connection it's given,
// or it will fight with BullMQ's own retry/backoff handling.
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
