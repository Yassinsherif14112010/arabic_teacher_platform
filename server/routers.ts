import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./auth.router";
import { studentsRouter } from "./students.router";
import { groupsRouter } from "./groups.router";
import { feesRouter } from "./fees.router";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  students: studentsRouter,
  groups: groupsRouter,
  fees: feesRouter,
});

export type AppRouter = typeof appRouter;
