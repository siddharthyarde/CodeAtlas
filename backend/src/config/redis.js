const Redis = require('ioredis');

let redis;

function getRedis() {
  if (redis) return redis;

  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    tls: process.env.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  });

  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err) => console.error('Redis error:', err.message));

  return redis;
}

module.exports = { getRedis };
