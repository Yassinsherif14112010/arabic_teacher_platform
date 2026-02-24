import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// جدول الطلاب
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  parentPhone: varchar("parentPhone", { length: 20 }),
  barcodeNumber: varchar("barcodeNumber", { length: 50 }).notNull().unique(),
  groupId: int("groupId"),
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "inactive", "graduated"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// جدول المجموعات الدراسية
export const studyGroups = mysqlTable("studyGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  schedule: text("schedule"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudyGroup = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = typeof studyGroups.$inferInsert;

// جدول الحضور
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  attendanceDate: date("attendanceDate").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// جدول الدرجات
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  examType: mysqlEnum("examType", ["daily", "monthly", "final"]).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("maxScore", { precision: 5, scale: 2 }).default("100"),
  examDate: date("examDate").notNull(),
  subject: varchar("subject", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

// جدول المصروفات والمدفوعات
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("paymentDate").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "transfer", "check"]).notNull(),
  month: varchar("month", { length: 7 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// جدول الرسوم الشهرية
export const monthlyFees = mysqlTable("monthlyFees", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  feeAmount: decimal("feeAmount", { precision: 10, scale: 2 }).notNull(),
  paid: boolean("paid").default(false),
  paidDate: date("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonthlyFee = typeof monthlyFees.$inferSelect;
export type InsertMonthlyFee = typeof monthlyFees.$inferInsert;