import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Check, X, Clock, Barcode } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
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

export default function Attendance() {
  const { user, loading } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: attendanceData = [], refetch } =
    trpc.students.getTodayAttendance.useQuery();

  const recordAttendanceMutation = trpc.students.recordAttendance.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الحضور بنجاح!");
      setBarcodeInput("");
      // إعادة جلب البيانات وتحديث الإحصائيات
      refetch();
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  useEffect(() => {
    if (Array.isArray(attendanceData)) {
      setTodayAttendance(attendanceData);
    }
  }, [attendanceData]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      toast.error("يرجى إدخال رقم الباركود");
      return;
    }

    const student = students.find(
      (s: any) => s.barcodeNumber === barcodeInput.trim()
    );
    if (!student) {
      toast.error("لم يتم العثور على الطالب");
      setBarcodeInput("");
      return;
    }

    // تسجيل الحضور
    recordAttendanceMutation.mutate({
      studentId: student.id,
      attendanceDate: selectedDate,
      status: "present",
    });
  };

  const handleManualAttendance = (
    studentId: number,
    status: "present" | "absent" | "late"
  ) => {
    recordAttendanceMutation.mutate({
      studentId,
      attendanceDate: selectedDate,
      status,
    });
  };

  const getStudentName = (studentId: number) => {
    return students.find((s: any) => s.id === studentId)?.name || "غير معروف";
  };

  // حساب الإحصائيات - يتم تحديثها عند كل تغيير في todayAttendance
  const presentCount = todayAttendance.filter(
    (a) => a.status === "present"
  ).length;
  const absentCount = todayAttendance.filter(
    (a) => a.status === "absent"
  ).length;
  const lateCount = todayAttendance.filter(
    (a) => a.status === "late"
  ).length;
  
  // إعادة حساب الإحصائيات عند تحديث الحضور
  useEffect(() => {
    // سيتم تحديث الإحصائيات تلقائياً عند تغيير todayAttendance
  }, [todayAttendance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={user?.name || ""} />

      <div className="md:mr-64">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">تسجيل الحضور والغياب</h1>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Barcode Scanner Section */}
          <Card className="bg-white border border-gray-200 shadow-sm mb-6">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Barcode className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">ماسح الباركود</h2>
              </div>
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="أدخل رقم الباركود أو امسحه"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoFocus
                  className="bg-white border border-gray-300 text-gray-900 flex-1"
                />
                <Button
                  type="submit"
                  disabled={recordAttendanceMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                >
                  {recordAttendanceMutation.isPending ? "جاري..." : "تسجيل"}
                </Button>
              </form>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-4 md:p-6">
                <p className="text-gray-600 text-sm font-medium">إجمالي الطلاب</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{students.length}</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-gray-600 text-sm font-medium">الحاضرون</p>
                </div>
                <h3 className="text-3xl font-bold text-green-600 mt-2">{presentCount}</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  <p className="text-gray-600 text-sm font-medium">الغائبون</p>
                </div>
                <h3 className="text-3xl font-bold text-red-600 mt-2">{absentCount}</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <p className="text-gray-600 text-sm font-medium">المتأخرون</p>
                </div>
                <h3 className="text-3xl font-bold text-yellow-600 mt-2">{lateCount}</h3>
              </div>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الطالب
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden md:table-cell">
                      الحالة
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 md:px-6 py-8 text-center text-gray-500">
                        لا توجد طلاب مسجلون
                      </td>
                    </tr>
                  ) : (
                    students.map((student: any) => {
                      const attendance = todayAttendance.find(
                        (a) => a.studentId === student.id
                      );
                      return (
                        <tr
                          key={student.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-4 md:px-6 py-4 text-gray-900 font-medium text-sm">
                            {student.name}
                          </td>
                          <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                            {attendance ? (
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  attendance.status === "present"
                                    ? "bg-green-100 text-green-700"
                                    : attendance.status === "absent"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {attendance.status === "present"
                                  ? "حاضر"
                                  : attendance.status === "absent"
                                  ? "غائب"
                                  : "متأخر"}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700">
                                لم يسجل
                              </span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() =>
                                  handleManualAttendance(student.id, "present")
                                }
                                className={`px-3 py-1 rounded text-sm font-bold transition-all duration-200 ${
                                  attendance?.status === "present"
                                    ? "bg-green-600 text-white"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                }`}
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleManualAttendance(student.id, "absent")
                                }
                                className={`px-3 py-1 rounded text-sm font-bold transition-all duration-200 ${
                                  attendance?.status === "absent"
                                    ? "bg-red-600 text-white"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                              >
                                <X size={16} />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleManualAttendance(student.id, "late")
                                }
                                className={`px-3 py-1 rounded text-sm font-bold transition-all duration-200 ${
                                  attendance?.status === "late"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                }`}
                              >
                                <Clock size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
