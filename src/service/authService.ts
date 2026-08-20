import type { Request, Response } from "express";
import type { User } from "../../generated/prisma/client";
import bcrypt from 'bcrypt';
import { prisma } from "../clients/prisma";
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET ?? "jwtsecret";

export async function register(req: Request, res: Response) {
  const { username, password } = req.body as LoginRequest;
  const existingUser = await prisma.user.findFirst({
    where: { username }
  })
  if (existingUser) {
    res.status(400).send({ message: "User already exists" })
    return;
  }

  const hashedPass = await bcrypt.hash(password, SALT_ROUNDS);
  const createdUser = await prisma.user.create({
    data: {
      username,
      password: hashedPass
    }
  });
  console.log("Created user: " + JSON.stringify(createdUser))

  return res.send({
    token: generateJwt(createdUser)
  });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginRequest;
  console.log(username + " " + password);
  const user = await prisma.user.findFirst({
    where: { username: username }
  })
  console.log(user);
  if (!user) {
    res.status(401).send();
    return;
  }

  const samePass = await bcrypt.compare(password, user.password)
  if (!samePass) {
    res.status(401).send();
    return;
  }
  const jwt = generateJwt(user);
  return res.send({
    token: jwt
  });
}

function generateJwt(user: User): string {
  const payload: MyJwtPayload = { id: user.id, username: user.username };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

export function isJwtValid(myJwt: string): boolean{
  try {
    jwt.verify(myJwt, JWT_SECRET);
    return true;
  } catch (e) {
    return false;
  }
}

export function decodeJwt(myJwt: string): MyJwtPayload {
  return jwt.decode(myJwt) as MyJwtPayload;
}
