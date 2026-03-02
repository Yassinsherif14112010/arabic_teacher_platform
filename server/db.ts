import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { InsertUser, users, students, InsertStudent, attendance, InsertAttendance, grades, InsertGrade, payments, InsertPayment, studyGroups, InsertStudyGroup } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Students ============
export async function createStudent(data: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(data);
  return result;
}

export async function getStudents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(students).orderBy(students.name);
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0] || null;
}

export async function getStudentByBarcode(barcodeNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(students).where(eq(students.barcodeNumber, barcodeNumber)).limit(1);
  return result[0] || null;
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(students).set(data).where(eq(students.id, id));
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(students).where(eq(students.id, id));
}

// ============ Attendance ============
export async function recordAttendance(data: InsertAttendance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(attendance).values(data);
}

export async function getTodayAttendance() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  // جلب سجلات الحضور لليوم الحالي
  const result = await db.select().from(attendance).where(
    sql`DATE(${attendance.attendanceDate}) = ${today}`
  );
  return result || [];
}

export async function getAttendanceByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(attendance).where(eq(attendance.attendanceDate, new Date(date)));
}

// ============ Grades ============
export async function recordGrade(data: InsertGrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(grades).values(data);
}

export async function getStudentGrades(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(grades).where(eq(grades.studentId, studentId)).orderBy(grades.examDate);
}

// ============ Payments ============
export async function recordPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(payments).values(data);
}

export async function getStudentPayments(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments).where(eq(payments.studentId, studentId)).orderBy(payments.paymentDate);
}

export async function getTotalPaymentsToday() {
  const db = await getDb();
  if (!db) return "0";
  const today = new Date().toISOString().split('T')[0];
  const result = await db.select().from(payments).where(eq(payments.paymentDate, new Date(today)));
  const total = result.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  return total.toString();
}

// ============ Study Groups ============
export async function createStudyGroup(data: InsertStudyGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(studyGroups).values(data);
}

export async function getStudyGroups() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studyGroups);
}

// ============ Dashboard Statistics ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalStudents: 0, todayAttendance: 0, todayPayments: "0" };
  
  const totalStudents = await db.select().from(students);
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  const todayAttendanceRecords = await db.select().from(attendance).where(eq(attendance.attendanceDate, todayDate));
  const todayPaymentsRecords = await db.select().from(payments).where(eq(payments.paymentDate, todayDate));
  
  const todayPaymentsTotal = todayPaymentsRecords.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  
  return {
    totalStudents: totalStudents.length,
    todayAttendance: todayAttendanceRecords.length,
    todayPayments: todayPaymentsTotal.toString(),
  };
}
