import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = payload.userId as number;
      const db = await getDb();
      if (db && userId) {
        const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        user = result[0] ?? null;
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
