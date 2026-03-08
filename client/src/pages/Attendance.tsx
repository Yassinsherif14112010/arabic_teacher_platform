import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Check, X, Clock, Barcode, Users, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";

interface AttendanceRecord {
  id: number;
  studentId: number;
  status: "present" | "absent" | "late";
  attendanceDate: Date;
  notes?: string | null;
  createdAt?: Date;
}

const GRADE_ORDER = [
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

const STATUS_STYLES = {
  present: {
    bg: "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700",
    badge: "bg-green-500 text-white",
    label: "حاضر",
  },
  absent: {
    bg: "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700",
    badge: "bg-red-500 text-white",
    label: "غائب",
  },
  late: {
    bg: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700",
    badge: "bg-yellow-500 text-white",
    label: "متأخر",
  },
};

export default function Attendance() {
  const { user, loading } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [localStatus, setLocalStatus] = useState<
    Record<number, "present" | "absent" | "late">
  >({});
  const [expandedCard, setExpandedCard] = useState<"present" | "absent" | "late" | null>(null);

  const [selectedRollGrade, setSelectedRollGrade] = useState("");
  const [selectedRollNumber, setSelectedRollNumber] = useState("");

  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: attendanceData = [], refetch } =
    trpc.students.getTodayAttendance.useQuery();

  const recordAttendanceMutation = trpc.students.recordAttendance.useMutation({
    onSuccess: (_, vars) => {
      toast.success("✅ تم تسجيل الحضور بنجاح!");
      setBarcodeInput("");
      refetch();
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  // Build a map of studentId -> status from server data
  const serverStatusMap = useMemo(() => {
    const map: Record<number, "present" | "absent" | "late"> = {};
    for (const rec of attendanceData as AttendanceRecord[]) {
      map[rec.studentId] = rec.status;
    }
    return map;
  }, [attendanceData]);

  // Merge server + local (local overrides until next refetch)
  const statusMap = useMemo(
    () => ({ ...serverStatusMap, ...localStatus }),
    [serverStatusMap, localStatus]
  );

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      toast.error("يرجى إدخال رقم الباركود");
      return;
    }
    const student = (students as any[]).find(
      (s) => s.barcodeNumber === barcodeInput.trim()
    );
    if (!student) {
      toast.error("لم يتم العثور على الطالب");
      setBarcodeInput("");
      return;
    }
    setLocalStatus((prev) => ({ ...prev, [student.id]: "present" }));
    recordAttendanceMutation.mutate({
      studentId: student.id,
      attendanceDate: selectedDate,
      status: "present",
    });
  };

  const handleRollNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRollGrade || !selectedRollNumber) {
      toast.error("يرجى اختيار الصف وإدخال رقم الكشف");
      return;
    }
    const gradeStudents = (students as any[])
      .filter((s) => (s.grade || "بدون صف") === selectedRollGrade)
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));

    const rollIndex = parseInt(selectedRollNumber) - 1;
    const student = gradeStudents[rollIndex];
    if (!student) {
      toast.error("رقم الكشف غير موجود في هذا الصف");
      return;
    }

    // We can call recordAttendanceMutation or handleManualAttendance
    setLocalStatus((prev) => ({ ...prev, [student.id]: "present" }));
    recordAttendanceMutation.mutate({
      studentId: student.id,
      attendanceDate: selectedDate,
      status: "present",
    });
    toast.success(`تم تسجيل حضور: ${student.name}`);
    setSelectedRollNumber("");
  };

  const handleManualAttendance = (
    studentId: number,
    status: "present" | "absent" | "late"
  ) => {
    setLocalStatus((prev) => ({ ...prev, [studentId]: status }));
    recordAttendanceMutation.mutate({
      studentId,
      attendanceDate: selectedDate,
      status,
    });
  };

  // Group students by grade, ordered by GRADE_ORDER
  const studentsByGrade = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of students as any[]) {
      const grade = s.grade || "بدون صف";
      if (!map[grade]) map[grade] = [];
      map[grade].push(s);
    }

    // Sort grades
    const orderedKeys = [
      ...GRADE_ORDER.filter((g) => map[g]),
      ...Object.keys(map).filter((g) => !GRADE_ORDER.includes(g)),
    ];

    return orderedKeys.map((grade) => ({
      grade,
      students: map[grade].sort((a: any, b: any) =>
        a.name.localeCompare(b.name, "ar")
      ),
    }));
  }, [students]);

  // Stats — build lists of names per status
  const presentStudents = (students as any[]).filter((s) => statusMap[s.id] === "present");
  const lateStudents = (students as any[]).filter((s) => statusMap[s.id] === "late");
  const absentStudents = (students as any[]).filter((s) => !statusMap[s.id] || statusMap[s.id] === "absent");
  const presentCount = presentStudents.length;
  const lateCount = lateStudents.length;
  const absentCount = absentStudents.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={user?.name || ""} />

      <div className="md:mr-64">
        {/* Top Navbar */}
        <div className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-foreground">
                تسجيل الحضور والغياب
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-background border border-border text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Quick Registration Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Barcode Scanner */}
            <Card className="bg-card border border-border shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Barcode className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    تسجيل الحضور بالباركود
                  </h2>
                </div>
                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="امسح الباركود..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="bg-background border border-border text-foreground placeholder:text-muted-foreground flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={recordAttendanceMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-all"
                  >
                    {recordAttendanceMutation.isPending ? "..." : "تسجيل"}
                  </Button>
                </form>
              </div>
            </Card>

            {/* Roll Number Input */}
            <Card className="bg-card border border-border shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    تسجيل الحضور برقم الكشف
                  </h2>
                </div>
                <form onSubmit={handleRollNumberSubmit} className="flex gap-2">
                  <select
                    value={selectedRollGrade}
                    onChange={(e) => setSelectedRollGrade(e.target.value)}
                    className="bg-background border border-border text-foreground rounded-lg px-2 flex-1"
                  >
                    <option value="">اختر الصف...</option>
                    {GRADE_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="الرقم"
                    value={selectedRollNumber}
                    onChange={(e) => setSelectedRollNumber(e.target.value)}
                    className="bg-background border border-border text-foreground placeholder:text-muted-foreground w-20"
                  />
                  <Button
                    type="submit"
                    disabled={recordAttendanceMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                  >
                    {recordAttendanceMutation.isPending ? "..." : "تسجيل"}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Statistics Cards — Expandable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total */}
            <Card
              className="bg-card border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedCard(expandedCard === null ? null : null)}
            >
              <div className="p-4">
                <p className="text-muted-foreground text-xs font-medium">إجمالي الطلاب</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {(students as any[]).length}
                </h3>
              </div>
            </Card>

            {/* Present */}
            <Card
              className={`border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${expandedCard === "present"
                ? "border-green-400 bg-green-50 dark:bg-green-950/30"
                : "border-border bg-card"
                }`}
              onClick={() =>
                setExpandedCard(expandedCard === "present" ? null : "present")
              }
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="text-muted-foreground text-xs font-medium">الحاضرون</p>
                  </div>
                  {expandedCard === "present" ? (
                    <ChevronUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-3xl font-bold text-green-600 mt-1">{presentCount}</h3>
              </div>
              {expandedCard === "present" && presentStudents.length > 0 && (
                <div className="border-t border-green-200 dark:border-green-800 px-4 pb-3 max-h-48 overflow-y-auto">
                  {presentStudents.map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-green-100 dark:border-green-900 last:border-0">
                      <span className="text-green-600 font-bold text-xs w-5">{i + 1}</span>
                      <span className="text-sm text-foreground font-medium">{s.name}</span>
                      {s.grade && <span className="text-xs text-muted-foreground mr-auto">{s.grade}</span>}
                    </div>
                  ))}
                </div>
              )}
              {expandedCard === "present" && presentStudents.length === 0 && (
                <div className="border-t border-green-200 px-4 py-3 text-xs text-muted-foreground">
                  لا يوجد حاضرون بعد
                </div>
              )}
            </Card>

            {/* Absent */}
            <Card
              className={`border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${expandedCard === "absent"
                ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                : "border-border bg-card"
                }`}
              onClick={() =>
                setExpandedCard(expandedCard === "absent" ? null : "absent")
              }
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-600" />
                    <p className="text-muted-foreground text-xs font-medium">الغائبون</p>
                  </div>
                  {expandedCard === "absent" ? (
                    <ChevronUp className="w-4 h-4 text-red-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-3xl font-bold text-red-600 mt-1">{absentCount}</h3>
              </div>
              {expandedCard === "absent" && absentStudents.length > 0 && (
                <div className="border-t border-red-200 dark:border-red-800 px-4 pb-3 max-h-48 overflow-y-auto">
                  {absentStudents.map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-red-100 dark:border-red-900 last:border-0">
                      <span className="text-red-600 font-bold text-xs w-5">{i + 1}</span>
                      <span className="text-sm text-foreground font-medium">{s.name}</span>
                      {s.grade && <span className="text-xs text-muted-foreground mr-auto">{s.grade}</span>}
                    </div>
                  ))}
                </div>
              )}
              {expandedCard === "absent" && absentStudents.length === 0 && (
                <div className="border-t border-red-200 px-4 py-3 text-xs text-muted-foreground">
                  لا يوجد غائبون
                </div>
              )}
            </Card>

            {/* Late */}
            <Card
              className={`border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${expandedCard === "late"
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
                : "border-border bg-card"
                }`}
              onClick={() =>
                setExpandedCard(expandedCard === "late" ? null : "late")
              }
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-muted-foreground text-xs font-medium">المتأخرون</p>
                  </div>
                  {expandedCard === "late" ? (
                    <ChevronUp className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-3xl font-bold text-yellow-600 mt-1">{lateCount}</h3>
              </div>
              {expandedCard === "late" && lateStudents.length > 0 && (
                <div className="border-t border-yellow-200 dark:border-yellow-800 px-4 pb-3 max-h-48 overflow-y-auto">
                  {lateStudents.map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-yellow-100 dark:border-yellow-900 last:border-0">
                      <span className="text-yellow-600 font-bold text-xs w-5">{i + 1}</span>
                      <span className="text-sm text-foreground font-medium">{s.name}</span>
                      {s.grade && <span className="text-xs text-muted-foreground mr-auto">{s.grade}</span>}
                    </div>
                  ))}
                </div>
              )}
              {expandedCard === "late" && lateStudents.length === 0 && (
                <div className="border-t border-yellow-200 px-4 py-3 text-xs text-muted-foreground">
                  لا يوجد متأخرون
                </div>
              )}
            </Card>
          </div>

          {/* Grade Containers */}
          {studentsByGrade.length === 0 ? (
            <Card className="bg-card border border-border shadow-sm">
              <div className="p-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا يوجد طلاب مسجلون. أضف طلاباً من صفحة إدارة الطلاب أولاً.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {studentsByGrade.map(({ grade, students: gradeStudents }) => {
                const gradePresentCount = gradeStudents.filter(
                  (s: any) => statusMap[s.id] === "present"
                ).length;
                const gradeLateCount = gradeStudents.filter(
                  (s: any) => statusMap[s.id] === "late"
                ).length;

                return (
                  <Card
                    key={grade}
                    className="bg-card border border-border shadow-sm overflow-hidden"
                  >
                    {/* Grade Header */}
                    <div className="bg-gradient-to-l from-primary/10 to-primary/5 border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full bg-primary" />
                        <h2 className="text-lg font-bold text-foreground">
                          {grade}
                        </h2>
                        <span className="text-sm text-muted-foreground font-medium">
                          ({gradeStudents.length} طالب)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <Check className="w-4 h-4" />
                          {gradePresentCount}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                          <Clock className="w-4 h-4" />
                          {gradeLateCount}
                        </span>
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <X className="w-4 h-4" />
                          {gradeStudents.length - gradePresentCount - gradeLateCount}
                        </span>
                      </div>
                    </div>

                    {/* Students List */}
                    <div className="divide-y divide-border">
                      {gradeStudents.map((student: any, idx: number) => {
                        const rollNumber = idx + 1; // كشف يبدأ من 1 لكل صف
                        const currentStatus = statusMap[student.id];
                        const style = currentStatus
                          ? STATUS_STYLES[currentStatus]
                          : null;

                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between px-4 md:px-6 py-3 transition-colors duration-200 border-r-4 ${style
                              ? style.bg + " border-r-current"
                              : "hover:bg-muted/30 border-r-transparent"
                              }`}
                          >
                            {/* Roll number + Name */}
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-primary font-bold text-sm">
                                  {rollNumber}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {student.name}
                                </p>
                              </div>
                            </div>

                            {/* Status + Action Buttons */}
                            <div className="flex items-center gap-2">
                              {currentStatus && (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-bold ${style!.badge}`}
                                >
                                  {style!.label}
                                </span>
                              )}
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleManualAttendance(student.id, "present")
                                  }
                                  disabled={recordAttendanceMutation.isPending}
                                  title="حاضر"
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold border ${currentStatus === "present"
                                    ? "bg-green-600 text-white border-green-600"
                                    : "bg-background hover:bg-green-50 text-green-600 border-green-300"
                                    }`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleManualAttendance(student.id, "late")
                                  }
                                  disabled={recordAttendanceMutation.isPending}
                                  title="متأخر"
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold border ${currentStatus === "late"
                                    ? "bg-yellow-500 text-white border-yellow-500"
                                    : "bg-background hover:bg-yellow-50 text-yellow-600 border-yellow-300"
                                    }`}
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleManualAttendance(student.id, "absent")
                                  }
                                  disabled={recordAttendanceMutation.isPending}
                                  title="غائب"
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold border ${currentStatus === "absent"
                                    ? "bg-red-600 text-white border-red-600"
                                    : "bg-background hover:bg-red-50 text-red-600 border-red-300"
                                    }`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
