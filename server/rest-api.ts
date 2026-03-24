import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import {
  getUserByUsername,
  createUser,
  updateUserLastSignIn,
  getDashboardStats,
  createStudent,
  getStudents,
  getStudentById,
  getStudentByBarcode,
  updateStudent,
  deleteStudent,
  recordAttendance,
  getTodayAttendance,
  recordGrade,
  getStudentGrades,
  recordPayment,
  getStudentPayments,
  getAllPayments,
  createStudyGroup,
  getAllStudyGroups,
  getStudyGroupsByGrade,
  updateStudyGroup,
  deleteStudyGroup,
  getAllFeeSettings,
  upsertFeeSetting,
  deleteFeeSettingById,
} from "./db";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);
const REGISTER_SECRET = process.env.REGISTER_SECRET || "teacher2025";

const restRouter = Router();

// ============ Auth Middleware ============
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const db = await getDb();
    if (db && userId) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (result[0]) {
        (req as any).user = result[0];
        return next();
      }
    }
    return res.status(401).json({ error: "غير مصرح" });
  } catch {
    return res.status(401).json({ error: "غير مصرح" });
  }
}

async function createToken(payload: {
  userId: number;
  username: string;
  role: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);
}

// ============ Auth Routes ============
restRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
    }
    const user = await getUserByUsername(username);
    if (!user) {
      return res
        .status(401)
        .json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
    await updateUserLastSignIn(user.id);
    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

restRouter.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { username, password, name, role, secretKey } = req.body;
    if (!username || !password || !name || !secretKey) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    if (secretKey !== REGISTER_SECRET) {
      return res.status(403).json({ error: "الرمز السري غير صحيح" });
    }
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: "اسم المستخدم مُستخدم بالفعل" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await createUser({
      username,
      password: hashedPassword,
      name,
      role: role || "assistant",
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

restRouter.get(
  "/auth/me",
  authMiddleware,
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    });
  }
);

restRouter.post(
  "/auth/logout",
  authMiddleware,
  async (_req: Request, res: Response) => {
    return res.json({ success: true });
  }
);

// ============ Students Routes ============
restRouter.get(
  "/students/stats",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const stats = await getDashboardStats();
      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/students",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const list = await getStudents();
      return res.json(list);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.post(
  "/students",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { name, phone, parentPhone, barcodeNumber, grade, groupId, feePaid } =
        req.body;
      if (!name || !barcodeNumber) {
        return res
          .status(400)
          .json({ error: "اسم الطالب ورقم الباركود مطلوبان" });
      }
      const result = await createStudent({
        name,
        phone,
        parentPhone,
        barcodeNumber,
        grade,
        groupId,
        feePaid,
      });
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/students/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const student = await getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: "الطالب غير موجود" });
      }
      return res.json(student);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/students/barcode/:barcodeNumber",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const student = await getStudentByBarcode(req.params.barcodeNumber);
      if (!student) {
        return res.status(404).json({ error: "الطالب غير موجود" });
      }
      return res.json(student);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.put(
  "/students/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, phone, parentPhone, groupId, feePaid, status } = req.body;
      await updateStudent(id, { name, phone, parentPhone, groupId, feePaid, status });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.delete(
  "/students/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await deleteStudent(id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============ Attendance Routes ============
restRouter.post(
  "/attendance",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId, attendanceDate, status, notes } = req.body;
      if (!studentId || !attendanceDate || !status) {
        return res.status(400).json({ error: "البيانات المطلوبة ناقصة" });
      }
      const result = await recordAttendance({
        studentId,
        attendanceDate: new Date(attendanceDate),
        status,
        notes,
      });
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/attendance/today",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const data = await getTodayAttendance();
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============ Grades Routes ============
restRouter.post(
  "/grades",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId, examType, score, maxScore, examDate, subject, notes } =
        req.body;
      if (!studentId || !examType || score === undefined || !examDate) {
        return res.status(400).json({ error: "البيانات المطلوبة ناقصة" });
      }
      const result = await recordGrade({
        studentId,
        examType,
        score: score.toString(),
        maxScore: (maxScore || 100).toString(),
        examDate: new Date(examDate),
        subject,
        notes,
      });
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/grades/student/:studentId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const data = await getStudentGrades(studentId);
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============ Payments Routes ============
restRouter.post(
  "/payments",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { studentId, amount, paymentDate, paymentMethod, month, notes } =
        req.body;
      if (!studentId || !amount || !paymentDate || !paymentMethod) {
        return res.status(400).json({ error: "البيانات المطلوبة ناقصة" });
      }
      const result = await recordPayment({
        studentId,
        amount: amount.toString(),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        month,
        notes,
      });
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/payments",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const data = await getAllPayments();
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.get(
  "/payments/student/:studentId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const data = await getStudentPayments(studentId);
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============ Groups Routes ============
restRouter.get("/groups", async (_req: Request, res: Response) => {
  try {
    const data = await getAllStudyGroups();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

restRouter.get("/groups/grade/:grade", async (req: Request, res: Response) => {
  try {
    const data = await getStudyGroupsByGrade(req.params.grade);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

restRouter.post(
  "/groups",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { name, grade, description, schedule } = req.body;
      if (!name || !grade) {
        return res.status(400).json({ error: "اسم المجموعة والصف مطلوبان" });
      }
      await createStudyGroup({ name, grade, description, schedule });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.put(
  "/groups/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, grade, description, schedule } = req.body;
      await updateStudyGroup(id, { name, grade, description, schedule });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.delete(
  "/groups/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await deleteStudyGroup(id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============ Fees Routes ============
restRouter.get(
  "/fees",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const data = await getAllFeeSettings();
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.post(
  "/fees",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { academicYear, grade, feeAmount } = req.body;
      if (!academicYear || !grade || feeAmount === undefined) {
        return res.status(400).json({ error: "البيانات المطلوبة ناقصة" });
      }
      await upsertFeeSetting({
        academicYear,
        grade,
        feeAmount: feeAmount.toString(),
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

restRouter.delete(
  "/fees/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await deleteFeeSettingById(id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============ Sync endpoint for offline-first ============
restRouter.post(
  "/sync",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { lastSyncTimestamp } = req.body;
      // Return all data that the client needs to sync
      const [studentsList, attendanceList, gradesList, paymentsList, groupsList, feesList] =
        await Promise.all([
          getStudents(),
          getTodayAttendance(),
          getAllPayments(),
          getAllPayments(),
          getAllStudyGroups(),
          getAllFeeSettings(),
        ]);

      return res.json({
        students: studentsList,
        attendance: attendanceList,
        grades: gradesList,
        payments: paymentsList,
        groups: groupsList,
        fees: feesList,
        syncTimestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export { restRouter };
