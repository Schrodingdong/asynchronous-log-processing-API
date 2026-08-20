import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      idemKey?: string,
      user?: {
        id: number;
        username: string;
      };
    }
  }
}
