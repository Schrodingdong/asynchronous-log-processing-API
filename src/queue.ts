import { Queue } from 'bullmq';
import { ProcessingJob } from '../generated/prisma/client';

export const QUEUE_NAME = "jobs";
const myQueue = new Queue(QUEUE_NAME);

export async function addJob(job: ProcessingJob) {
    await myQueue.add("processingjob_"+job.id, job);
}


