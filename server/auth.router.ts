import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createUser, getUserByUsername, updateUserLastSignIn } from "./db";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");
// Secret key required to register new accounts (teachers/assistants only)
const REGISTER_SECRET = process.env.REGISTER_SECRET || "teacher2025";

async function createToken(payload: { userId: number; username: string; role: string }) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("365d")
        .sign(JWT_SECRET);
}

export const authRouter = router({
    // تسجيل الدخول
    login: publicProcedure
        .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            const user = await getUserByUsername(input.username);
            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
            }
            const isValid = await bcrypt.compare(input.password, user.password);
            if (!isValid) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
            }
            await updateUserLastSignIn(user.id);
            const token = await createToken({ userId: user.id, username: user.username, role: user.role });
            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
            return { success: true, user: { id: user.id, name: user.name, username: user.username, role: user.role } };
        }),

    // إنشاء حساب جديد (يتطلب رمزاً سرياً)
    register: publicProcedure
        .input(z.object({
            username: z.string().min(3).max(64),
            password: z.string().min(6),
            name: z.string().min(2),
            role: z.enum(["teacher", "assistant"]).default("assistant"),
            secretKey: z.string(),
        }))
        .mutation(async ({ input }) => {
            if (input.secretKey !== REGISTER_SECRET) {
                throw new TRPCError({ code: "FORBIDDEN", message: "الرمز السري غير صحيح" });
            }
            const existing = await getUserByUsername(input.username);
            if (existing) {
                throw new TRPCError({ code: "CONFLICT", message: "اسم المستخدم مُستخدم بالفعل" });
            }
            const hashedPassword = await bcrypt.hash(input.password, 12);
            await createUser({
                username: input.username,
                password: hashedPassword,
                name: input.name,
                role: input.role,
            });
            return { success: true };
        }),

    // الحصول على بيانات المستخدم الحالي
    me: publicProcedure.query(opts => opts.ctx.user),

    // تسجيل الخروج
    logout: publicProcedure.mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
    }),
});
