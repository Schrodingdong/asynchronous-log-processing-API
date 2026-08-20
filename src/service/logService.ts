import type { Request, Response } from "express";
import { getJobIdOfIdemKey, isIdemKeyInCache, putIdemKeyForJobId } from '../clients/redis';
import { prisma } from '../clients/prisma';
import minioClient, { LOG_BUCKET } from '../clients/minioClient';
import fs from 'node:fs'
import { addJob } from '../queue';

export async function uploadLog(req: Request, res: Response) {
  const idemKey = req.headers["x-idempotency-key"] as string;
  if (!idemKey) {
    return res.status(400).json({ error: "Missing X-Idempotency-Key header." });
  }
  if (await isIdemKeyInCache(idemKey)) {
    const jobId = await getJobIdOfIdemKey(idemKey);
    if (!jobId) return res.status(500).json({
      error: `Job id of the associated idempotency key is ${jobId}`
    });
    const job = await prisma.processingJob.findFirst({
      where: {
        id: jobId
      }
    })
    return res.json({ job });
  }
  await putIdemKeyForJobId(idemKey, -1);

  const logfile = req.file;
  if (!logfile) return res.send('No file uploaded.');

  try {
    // Save in minio
    if (! await minioClient.bucketExists(LOG_BUCKET)) {
      await minioClient.makeBucket(LOG_BUCKET);
    }
    await minioClient.fPutObject(LOG_BUCKET, logfile.filename, logfile.path);

    // Clear in local tmp
    fs.unlink(logfile.path, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err.message}`);
        return;
      }
      console.log('Tmp file deleted successfully');
    });
  } catch (e) {
    console.error(e)
    res.send("Error: " + e);
  }

  // State of processing == Pending
  const loggedUser = req.user;
  if (!loggedUser) {
    res.status(500).send();
    return;
  }
  const job = await prisma.processingJob.create({
    data: {
      ownerId: loggedUser.id,
      status: "PENDING",
      statistics: {},
      logPath: `${LOG_BUCKET}/${logfile.filename}`
    }
  })
  await addJob(job)
  await putIdemKeyForJobId(idemKey, job.id);

  res.send({ job });
}

export async function getJobs(req: Request, res: Response) {
  res.send(await prisma.processingJob.findMany())
}
