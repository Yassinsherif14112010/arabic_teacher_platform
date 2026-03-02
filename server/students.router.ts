import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createStudent,
  getStudents,
  getStudentById,
  getStudentByBarcode,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  recordAttendance,
  getTodayAttendance,
  recordGrade,
  getStudentGrades,
  recordPayment,
  getStudentPayments,
  createStudyGroup,
  getStudyGroups,
} from "./db";

export const studentsRouter = router({
  // Dashboard
  getStats: protectedProcedure.query(async () => {
    return await getDashboardStats();
  }),

  // Students
  list: protectedProcedure.query(async () => {
    return await getStudents();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "اسم الطالب مطلوب"),
        phone: z.string().optional(),
        parentPhone: z.string().optional(),
        barcodeNumber: z.string().min(1, "رقم الباركود مطلوب"),
        groupId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createStudent({
        name: input.name,
        phone: input.phone,
        parentPhone: input.parentPhone,
        barcodeNumber: input.barcodeNumber,
        groupId: input.groupId,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getStudentById(input.id);
    }),

  getByBarcode: protectedProcedure
    .input(z.object({ barcodeNumber: z.string() }))
    .query(async ({ input }) => {
      return await getStudentByBarcode(input.barcodeNumber);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        parentPhone: z.string().optional(),
        groupId: z.number().optional(),
        status: z.enum(["active", "inactive", "graduated"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateStudent(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteStudent(input.id);
    }),

  updatePayment: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        hasPaidFees: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateStudent(input.studentId, { hasPaidFees: input.hasPaidFees });
    }),

  // Attendance
  recordAttendance: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        attendanceDate: z.string(),
        status: z.enum(["present", "absent", "late"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await recordAttendance({
        studentId: input.studentId,
        attendanceDate: new Date(input.attendanceDate),
        status: input.status,
        notes: input.notes,
      });
    }),

  getTodayAttendance: protectedProcedure.query(async () => {
    return await getTodayAttendance();
  }),

  // Grades
  recordGrade: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        examType: z.enum(["daily", "monthly", "final"]),
        score: z.number().min(0),
        maxScore: z.number().min(1).default(100),
        examDate: z.string(),
        subject: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await recordGrade({
        studentId: input.studentId,
        examType: input.examType,
        score: input.score.toString(),
        maxScore: input.maxScore.toString(),
        examDate: new Date(input.examDate),
        subject: input.subject,
        notes: input.notes,
      });
    }),

  getStudentGrades: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      return await getStudentGrades(input.studentId);
    }),

  // Payments
  recordPayment: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        amount: z.number().min(0),
        paymentDate: z.string(),
        paymentMethod: z.enum(["cash", "transfer", "check"]),
        month: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await recordPayment({
        studentId: input.studentId,
        amount: input.amount.toString(),
        paymentDate: new Date(input.paymentDate),
        paymentMethod: input.paymentMethod,
        month: input.month,
        notes: input.notes,
      });
    }),

  getStudentPayments: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      return await getStudentPayments(input.studentId);
    }),

  // Study Groups
  createStudyGroup: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        schedule: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createStudyGroup(input);
    }),

  listStudyGroups: protectedProcedure.query(async () => {
    return await getStudyGroups();
  }),
});
