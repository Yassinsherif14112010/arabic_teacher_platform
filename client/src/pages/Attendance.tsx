import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Check, X } from "lucide-react";
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
      refetch();
    },
    onError: (error) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar userName={user?.name || ""} />

      <div className="md:mr-64">
        {/* Top Navbar */}
        <div className="bg-slate-800 border-b border-cyan-400/20 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-orange-400" />
              <h1 className="text-2xl font-bold text-white">تسجيل الحضور</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Barcode Scanner */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-400/30 backdrop-blur-sm mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                مسح الباركود
              </h2>
              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    رقم الباركود أو الرقم التسلسلي
                  </label>
                  <Input
                    type="text"
                    placeholder="أدخل رقم الباركود"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    autoFocus
                    className="bg-slate-700 border-orange-400/30 text-white placeholder-gray-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={recordAttendanceMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 rounded-lg transition-all duration-300"
                >
                  {recordAttendanceMutation.isPending
                    ? "جاري التسجيل..."
                    : "تسجيل الحضور"}
                </Button>
              </form>
            </div>
          </Card>

          {/* Date Selector */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-400/30 backdrop-blur-sm mb-6">
            <div className="p-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                التاريخ
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-700 border-cyan-400/30 text-white"
              />
            </div>
          </Card>

          {/* Attendance List */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-400/30 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                الحضور في {selectedDate}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50 border-b border-cyan-400/20">
                      <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                        الرقم
                      </th>
                      <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                        اسم الطالب
                      </th>
                      <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                          لا توجد طلاب مسجلين
                        </td>
                      </tr>
                    ) : (
                      students.map((student: any, index: number) => {
                        const attendance = todayAttendance.find(
                          (a) => a.studentId === student.id
                        );
                        return (
                          <tr
                            key={student.id}
                            className="border-b border-cyan-400/10 hover:bg-slate-700/30 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 text-gray-300">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-white font-medium">
                              {student.name}
                            </td>
                            <td className="px-6 py-4">
                              {attendance ? (
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    attendance.status === "present"
                                      ? "bg-green-500/20 text-green-400"
                                      : attendance.status === "late"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {attendance.status === "present"
                                    ? "حاضر"
                                    : attendance.status === "late"
                                    ? "متأخر"
                                    : "غائب"}
                                </span>
                              ) : (
                                <span className="text-gray-500">لم يتم التسجيل</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleManualAttendance(student.id, "present")
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-all duration-200"
                                  title="حاضر"
                                >
                                  <Check size={16} />
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleManualAttendance(student.id, "absent")
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-all duration-200"
                                  title="غائب"
                                >
                                  <X size={16} />
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

              {/* Summary */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border border-green-400/30">
                  <div className="p-4 text-center">
                    <p className="text-green-400 text-sm">الحاضرون</p>
                    <p className="text-2xl font-bold text-white">
                      {todayAttendance.filter((a) => a.status === "present").length}
                    </p>
                  </div>
                </Card>
                <Card className="bg-yellow-500/10 border border-yellow-400/30">
                  <div className="p-4 text-center">
                    <p className="text-yellow-400 text-sm">المتأخرون</p>
                    <p className="text-2xl font-bold text-white">
                      {todayAttendance.filter((a) => a.status === "late").length}
                    </p>
                  </div>
                </Card>
                <Card className="bg-red-500/10 border border-red-400/30">
                  <div className="p-4 text-center">
                    <p className="text-red-400 text-sm">الغائبون</p>
                    <p className="text-2xl font-bold text-white">
                      {todayAttendance.filter((a) => a.status === "absent").length}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
