import type { ProcessingJob } from '../generated/prisma/client';
import { Queue } from 'bullmq';

export const QUEUE_NAME = "jobs";
const myQueue = new Queue(QUEUE_NAME);

export async function addJob(job: ProcessingJob) {
    await myQueue.add("processingjob_"+job.id, job);
}
