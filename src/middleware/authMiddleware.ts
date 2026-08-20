import type { NextFunction, Request, Response } from 'express';
import { decodeJwt, isJwtValid } from '../service/authService';

export function jwtValidation(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"];
  if (!token) {
    res.status(401).send();
    return;
  }
  if (!token.startsWith("Bearer ")) {
    res.status(401).send();
    return;
  }
  const jwt = token.substring(7, token.length);
  if (!isJwtValid(jwt)) {
    res.status(401).send()
    return;
  }
  const decodedJwt: MyJwtPayload = decodeJwt(jwt);
  req.user = {
    id: decodedJwt.id,
    username: decodedJwt.username
  };
  next();
}
