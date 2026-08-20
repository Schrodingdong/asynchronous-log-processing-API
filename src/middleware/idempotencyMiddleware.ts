import type { NextFunction, Request, Response } from 'express';
import { getJobIdOfIdemKey, isIdemKeyInCache } from '../clients/redis';

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idemKey = req.headers["x-idempotency-key"] as string;
  if (!idemKey) {
    return res.status(400).json({ error: "Missing X-Idempotency-Key header." });
  }
  if (await isIdemKeyInCache(idemKey)) {
    return res.status(429).send({ error: "Request send with an existing idempotency key" })
  }
  req.idemKey = idemKey;
  next();
}
