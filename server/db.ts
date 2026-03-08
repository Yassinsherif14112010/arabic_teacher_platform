import { eq, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, students, InsertStudent, attendance, InsertAttendance, grades, InsertGrade, payments, InsertPayment, studyGroups, InsertStudyGroup, feeSettings, InsertFeeSetting } from "../drizzle/schema";

// ============ Database Initialization ============
let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not set");
    return null;
  }
  try {
    // استخدم createPool بدلاً من createConnection لتجنب سقوط الاتصال
    const pool = mysql.createPool(connectionString);
    dbInstance = drizzle(pool);
    return dbInstance;
  } catch (err) {
    console.error("Failed to initialize database:", err);
    return null;
  }
}

// ============ Users / Auth ============
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] ?? undefined;
}

export async function createUser(data: { username: string; password: string; name: string; role: "teacher" | "assistant" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({ ...data, lastSignedIn: new Date() });
}

export async function updateUserLastSignIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // إذا تم تفعيل دفع المصاريف، سجل دفعة تلقائية في جدول payments
  if (data.feePaid === true) {
    const studentResult = await db.select().from(students).where(eq(students.id, id)).limit(1);
    const student = studentResult[0];
    if (student && !student.feePaid) {
      const currentYear = getCurrentAcademicYear();
      const feeRow = await db.select().from(feeSettings)
        .where(and(eq(feeSettings.academicYear, currentYear), eq(feeSettings.grade, student.grade || "")))
        .limit(1);
      const amount = feeRow[0]?.feeAmount ?? "0";
      const today = new Date().toISOString().split("T")[0];
      await db.insert(payments).values({
        studentId: id,
        amount: amount.toString(),
        paymentDate: new Date(today),
        paymentMethod: "cash",
        month: today.slice(0, 7),
        notes: `مصاريف السنة الدراسية ${currentYear}`,
      });
    }
  }

  await db.update(students).set(data).where(eq(students.id, id));
}

// ============ Students ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalStudents: 0, activeStudents: 0, presentToday: 0 };

  const totalRes = await db.select({ count: sql<number>`count(*)` }).from(students);
  const activeRes = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, 'active'));

  const today = new Date().toISOString().split('T')[0];
  const presentRes = await db.select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(sql`DATE(attendanceDate) = ${today} AND status = 'present'`);

  return {
    totalStudents: Number(totalRes[0]?.count || 0),
    activeStudents: Number(activeRes[0]?.count || 0),
    presentToday: Number(presentRes[0]?.count || 0),
  };
}

export async function createStudent(data: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(data);
  return result;
}

export async function getStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(students);
}

export async function getAllStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(students);
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getStudentByBarcode(barcodeNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.barcodeNumber, barcodeNumber)).limit(1);
  return result[0] ?? undefined;
}



export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(students).where(eq(students.id, id));
}

// ============ Attendance ============
export async function recordAttendance(data: InsertAttendance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(attendance).values(data);
}

export async function getTodayAttendance() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  return db.select().from(attendance).where(sql`DATE(attendanceDate) = ${today}`);
}

export async function getAttendanceByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attendance).where(sql`DATE(${attendance.attendanceDate}) = ${date}`);
}

// ============ Grades ============
export async function recordGrade(data: InsertGrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(grades).values(data);
}

export async function addGrade(data: InsertGrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(grades).values(data);
}

export async function getStudentGrades(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(grades).where(eq(grades.studentId, studentId));
}

export async function getGradesByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(grades).where(eq(grades.studentId, studentId));
}

export async function getAllGrades() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(grades);
}

// ============ Payments ============
export async function recordPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(payments).values(data);
}

export async function addPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(payments).values(data);
}

export async function getStudentPayments(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.studentId, studentId));
}

export async function getPaymentsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.studentId, studentId));
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments);
}

// ============ Study Groups ============
export async function createStudyGroup(data: InsertStudyGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(studyGroups).values(data);
}

export async function getAllStudyGroups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studyGroups);
}

export async function getStudyGroupsByGrade(grade: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studyGroups).where(eq(studyGroups.grade, grade));
}

export async function updateStudyGroup(id: number, data: Partial<InsertStudyGroup>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studyGroups).set(data).where(eq(studyGroups.id, id));
}

export async function deleteStudyGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(studyGroups).where(eq(studyGroups.id, id));
}

// Re-export drizzle instance getter from here if needed safely, or remove it entirely
// export { getDb } from "./db";

// ============ Fee Settings ============
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // السنة الدراسية تبدأ في أكتوبر
  if (month >= 10) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

export async function getAllFeeSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feeSettings);
}

export async function upsertFeeSetting(data: { academicYear: string; grade: string; feeAmount: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(feeSettings)
    .where(and(eq(feeSettings.academicYear, data.academicYear), eq(feeSettings.grade, data.grade)))
    .limit(1);
  if (existing[0]) {
    await db.update(feeSettings).set({ feeAmount: data.feeAmount }).where(eq(feeSettings.id, existing[0].id));
  } else {
    await db.insert(feeSettings).values(data);
  }
}

export async function deleteFeeSettingById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(feeSettings).where(eq(feeSettings.id, id));
}
