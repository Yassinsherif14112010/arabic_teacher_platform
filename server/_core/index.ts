import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerChatRoutes } from "./chat";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { students, studyGroups } from "../../drizzle/schema";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const app = express();
const server = createServer(app);

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Chat API with streaming and tool calling
registerChatRoutes(app);

// API route to trigger seeding on production
app.get("/api/seed", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "No database connection available" });
    }

    const groupsList = [
      { id: "group_paris", name: "سنتر باريس (3 ع)", grade: "الصف الثالث الإعدادي", schedule: "7:30 صباحاً" },
      { id: "group_majd", name: "سنتر المجد", grade: "الصف الثالث الإعدادي", schedule: "8:30 مساءً" },
    ];

    const parisStudents = [
      { name: "إياد سامح", parentPhone: "01020153411" },
      { name: "عبدالرحمن الفقي", parentPhone: "01028601171" },
      { name: "حنفي مريم", parentPhone: "01021311910" },
      { name: "مريم إبراهيم", parentPhone: "0101436644" },
      { name: "جنى أيمن سعيد", parentPhone: "01018152253" },
      { name: "أحمد ميسرة", parentPhone: "01012794457" },
      { name: "ياسمين أحمد عبدالمنعم", parentPhone: "01158156677" },
      { name: "عبدالله أبو عبدالله", parentPhone: "01060490508" },
      { name: "معاذ محمود عبد العزيز", parentPhone: "01097944496" },
      { name: "أحمد هشام مكي", parentPhone: "01007411620" },
      { name: "محمد أحمد الشمار", parentPhone: "01289188444" },
      { name: "شروق عصام", parentPhone: "01013506869" },
      { name: "محمد هاني بهجت", parentPhone: "01027372701" },
      { name: "محمد سويلم", parentPhone: "01066241957" },
      { name: "سيف خالد حجاج", parentPhone: "01026016385" },
      { name: "ندى صلاح سليم", parentPhone: "01065588752" },
      { name: "يوسف الكيلاني", parentPhone: "01067579227" },
      { name: "سما إبراهيم أحمد", parentPhone: "-" },
      { name: "يارا عماد", parentPhone: "01066812037" },
      { name: "شروق محمد", parentPhone: "01029290221" },
      { name: "جنى رضا", parentPhone: "01223622855" },
      { name: "مهند إبراهيم", parentPhone: "01004608144" },
      { name: "محمد جميل", parentPhone: "01095076901" },
      { name: "يحيى مصطفى يحيى", parentPhone: "01099383960" },
      { name: "نور أشرف", parentPhone: "01203877463" },
      { name: "لين سامح", parentPhone: "01004047534" },
      { name: "رهف مصطفى شريف", parentPhone: "01070278603" },
      { name: "أحمد بلال سعيد", parentPhone: "01002453059" },
      { name: "أحمد وائل أنور", parentPhone: "01099974258" },
    ];

    const majdStudents = [
      { name: "محمود أحمد صالح", parentPhone: "01092770125" },
      { name: "حازم هاني السمر", parentPhone: "01028601171" },
      { name: "عمر علي", parentPhone: "01011807890" },
      { name: "مريم محمد عبد الوهاب", parentPhone: "01017833341" },
      { name: "أسماء مصطفى عثمان", parentPhone: "01020712399" },
      { name: "آية حسن إبراهيم", parentPhone: "01012170153" },
      { name: "منة الله خيرت", parentPhone: "01224249624" },
      { name: "ندى أحمد", parentPhone: "01098197401" },
      { name: "مودة ربيع السيد", parentPhone: "01091565718" },
      { name: "معتز الشامي", parentPhone: "01114758575" },
      { name: "مجدي هاني", parentPhone: "01229963442" },
      { name: "معتز رجب", parentPhone: "01118956413" },
      { name: "أميرة سعيد الحواري", parentPhone: "01500322232" },
      { name: "مصطفى المرزوقي", parentPhone: "01022228059" },
    ];

    console.log("Emptying database and seeding groups & students via API...");
    
    // Clear old data (delete child tables first to avoid foreign key/referential issues)
    const { attendance, grades, payments, monthlyFees } = await import("../../drizzle/schema");
    
    await db.delete(attendance);
    await db.delete(grades);
    await db.delete(payments);
    await db.delete(monthlyFees);
    await db.delete(students);
    await db.delete(studyGroups);

    let groupsCount = 0;
    const insertedGroups: Record<string, number> = {};

    for (const group of groupsList) {
      const { id, ...groupData } = group;
      const [insertResult] = await db.insert(studyGroups).values(groupData);
      insertedGroups[group.id] = insertResult.insertId;
      groupsCount++;
    }

    let studentsCount = 0;
    
    // Seed Paris Group Students
    const parisGroupId = insertedGroups["group_paris"];
    for (const student of parisStudents) {
      const barcodeNumber = Math.floor(1000 + Math.random() * 999000).toString();
      await db.insert(students).values({
        name: student.name,
        parentPhone: student.parentPhone,
        barcodeNumber,
        status: "active",
        grade: "الصف الثالث الإعدادي",
        groupId: parisGroupId,
      });
      studentsCount++;
    }

    // Seed Majd Group Students
    const majdGroupId = insertedGroups["group_majd"];
    for (const student of majdStudents) {
      const barcodeNumber = Math.floor(1000 + Math.random() * 999000).toString();
      await db.insert(students).values({
        name: student.name,
        parentPhone: student.parentPhone,
        barcodeNumber,
        status: "active",
        grade: "الصف الثالث الإعدادي",
        groupId: majdGroupId,
      });
      studentsCount++;
    }

    return res.json({ success: true, message: `Seeded ${groupsCount} groups and ${studentsCount} students successfully` });
  } catch (error: any) {
    console.error("Seed error:", error);
    return res.status(500).json({ error: "Failed to seed data", details: error.message });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

async function startServer() {
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Only start the server if we're not running in a serverless environment like Vercel
if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}

export { app };
