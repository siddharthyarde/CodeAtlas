const { Queue } = require('bullmq');
const { getRedis } = require('../config/redis');

const repoQueue = new Queue('repo-processing', {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

/**
 * Add a repo import job to the queue.
 * @param {{ repoId: string, userId: string, url: string }} data
 * @returns {Promise<import('bullmq').Job>}
 */
async function addRepoJob(data) {
  return repoQueue.add('import', data, { jobId: data.repoId });
}

module.exports = { repoQueue, addRepoJob };
