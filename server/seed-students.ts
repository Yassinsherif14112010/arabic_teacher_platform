import "dotenv/config";
import { getDb } from "./db";
import { students } from "../drizzle/schema";

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

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection.");
    process.exit(1);
  }

  console.log("Seeding students...");
  for (const student of studentsList) {
    const barcodeNumber = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await db.insert(students).values({
      name: student.name,
      parentPhone: student.parentPhone,
      barcodeNumber,
      status: "active",
    });
  }

  console.log("Students seeded successfully!");
  process.exit(0);
}

seed().catch(console.error);
