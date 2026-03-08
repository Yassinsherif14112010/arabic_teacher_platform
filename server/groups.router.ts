import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createStudyGroup, getAllStudyGroups, getStudyGroupsByGrade, updateStudyGroup, deleteStudyGroup } from "./db";

export const groupsRouter = router({
    // جلب جميع المجموعات
    getAll: publicProcedure.query(async () => {
        return getAllStudyGroups();
    }),

    // جلب مجموعات صف معين
    getByGrade: publicProcedure
        .input(z.object({ grade: z.string() }))
        .query(async ({ input }) => {
            return getStudyGroupsByGrade(input.grade);
        }),

    // إنشاء مجموعة جديدة
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            grade: z.string().min(1),
            description: z.string().optional(),
            schedule: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            await createStudyGroup(input);
            return { success: true };
        }),

    // تعديل مجموعة
    update: protectedProcedure
        .input(z.object({
            id: z.number(),
            name: z.string().min(1).optional(),
            grade: z.string().min(1).optional(),
            description: z.string().optional(),
            schedule: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            await updateStudyGroup(id, data);
            return { success: true };
        }),

    // حذف مجموعة
    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            await deleteStudyGroup(input.id);
            return { success: true };
        }),
});
