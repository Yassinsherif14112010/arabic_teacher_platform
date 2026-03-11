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
    const { getDb } = await import("../db");
    const { students, studyGroups } = await import("../../drizzle/schema");
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "No database connection available" });
    }

    const groupsList = [
      { name: "مجموعة السبت والثلاثاء 4 عصراً", grade: "الصف الأول الثانوي", schedule: "السبت والثلاثاء 4:00 م" },
      { name: "مجموعة الأحد والأربعاء 6 مساءً", grade: "الصف الثاني الثانوي", schedule: "الأحد والأربعاء 6:00 م" },
      { name: "مجموعة الإثنين والخميس 5 عصراً", grade: "الصف الثالث الثانوي", schedule: "الإثنين والخميس 5:00 م" },
    ];

    const studentsList = [
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

    console.log("Seeding groups & students via API...");
    let groupsCount = 0;
    const insertedGroupIds: number[] = [];

    // Delete existing to allow running the API multiple times safely if requested (optional)
    // await db.delete(students);
    // await db.delete(studyGroups);

    for (const group of groupsList) {
      const [insertResult] = await db.insert(studyGroups).values(group);
      insertedGroupIds.push(insertResult.insertId);
      groupsCount++;
    }

    let studentsCount = 0;
    for (let i = 0; i < studentsList.length; i++) {
      const student = studentsList[i];
      // Distribute the 14 students evenly among the 3 groups
      const groupId = insertedGroupIds[i % insertedGroupIds.length]; 
      
      const barcodeNumber = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await db.insert(students).values({
        name: student.name,
        parentPhone: student.parentPhone,
        barcodeNumber,
        status: "active",
        groupId: groupId,
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
