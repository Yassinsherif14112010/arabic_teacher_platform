import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getAllFeeSettings, upsertFeeSetting, deleteFeeSettingById } from "./db";

export const feesRouter = router({
    getAll: protectedProcedure.query(async () => {
        return await getAllFeeSettings();
    }),

    upsert: protectedProcedure
        .input(z.object({
            academicYear: z.string().min(7),
            grade: z.string().min(1),
            feeAmount: z.number().min(0),
        }))
        .mutation(async ({ input }) => {
            await upsertFeeSetting({
                academicYear: input.academicYear,
                grade: input.grade,
                feeAmount: input.feeAmount.toString(),
            });
            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            await deleteFeeSettingById(input.id);
            return { success: true };
        }),
});
