import "dotenv/config";
import { getDb } from "./db";
import { students, studyGroups } from "../drizzle/schema";

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

const groupsList = [
  { name: "مجموعة السبت والثلاثاء 4 عصراً", grade: "الصف الأول الثانوي", schedule: "السبت والثلاثاء 4:00 م" },
  { name: "مجموعة الأحد والأربعاء 6 مساءً", grade: "الصف الثاني الثانوي", schedule: "الأحد والأربعاء 6:00 م" },
  { name: "مجموعة الإثنين والخميس 5 عصراً", grade: "الصف الثالث الثانوي", schedule: "الإثنين والخميس 5:00 م" },
];

async function seed() {
  process.env.DATABASE_URL = "mysql://root:UGBhkZclXJcrEfoEMkakkuWPvOcEKiNP@mysql.railway.internal:3306/railway";
  const db = await getDb();
  if (!db) {
    console.error("No database connection.");
    process.exit(1);
  }

  console.log("Connected to the remote database.");

  console.log("Seeding study groups...");
  for (const group of groupsList) {
    await db.insert(studyGroups).values(group);
  }
  console.log("Study groups seeded.");

  console.log("Seeding students...");
  for (const student of studentsList) {
    const barcodeNumber = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await db.insert(students).values({
      name: student.name,
      parentPhone: student.parentPhone,
      barcodeNumber,
      status: "active",
      groupId: 1, // assigning to a default group for now
    });
  }
  console.log("Students seeded.");

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch(console.error);
