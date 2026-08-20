import { Job, Worker } from 'bullmq';
import { QUEUE_NAME } from './queue';
import IORedis from 'ioredis';
import { ProcessingJob } from '../generated/prisma/client';
import minioClient from './clients/minioClient';
import { prisma } from './clients/prisma';

const connection = new IORedis({ maxRetriesPerRequest: null });

const WORKER_COUNT = 5;
const workers = [];

export function initializeWorkers() {
    for (let i = 0; i < WORKER_COUNT; i++) {
        const worker = new Worker(QUEUE_NAME, handleJob, { connection });
        workers.push(worker);
    }
}

async function handleJob(job: Job) {
    const j = job.data as ProcessingJob;
    await prisma.processingJob.update({
        where: { id: j.id },
        data: { status: "INITIALIZING" },
    })
    const [bucket, filename] = j.logPath.split('/');
    const logfile = await minioClient.getObject(bucket, filename)

    // Read file
    const chunks: Buffer[] = []
    for await (const chunk of logfile) {
        chunks.push(Buffer.from(chunk));
    }
    const text = Buffer.concat(chunks).toString('utf-8');
    console.log(text)

    await prisma.processingJob.update({
        where: { id: j.id },
        data: { status: "PROCESSING" },
    })
}
