import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Edit2, Trash2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";

interface GradeForm {
  studentId: number;
  subject: string;
  score: number;
  date: string;
  type: "daily" | "monthly" | "exam";
}

export default function Grades() {
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GradeForm>({
    studentId: 0,
    subject: "اللغة العربية",
    score: 0,
    date: new Date().toISOString().split("T")[0],
    type: "daily",
  });

  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: grades = [], refetch } = trpc.students.getStudentGrades.useQuery({ studentId: 0 });
  
  const createGradeMutation = trpc.students.recordGrade.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الدرجة بنجاح!");
      setFormData({
        studentId: 0,
        subject: "اللغة العربية",
        score: 0,
        date: new Date().toISOString().split("T")[0],
        type: "daily",
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  // Delete grade mutation - placeholder for future implementation
  // const deleteGradeMutation = trpc.students.deleteGrade.useMutation({
  //   onSuccess: () => {
  //     toast.success("تم حذف الدرجة بنجاح!");
  //     refetch();
  //   },
  // });}

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.score) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    createGradeMutation.mutate({
      studentId: formData.studentId,
      examType: formData.type as any,
      score: formData.score,
      maxScore: 100,
      examDate: formData.date,
      subject: formData.subject,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "يومي";
      case "monthly":
        return "شهري";
      case "exam":
        return "امتحان";
      default:
        return type;
    }
  };

  const getStudentName = (studentId: number) => {
    return students.find((s: any) => s.id === studentId)?.name || "غير معروف";
  };

  const averageScore =
    grades.length > 0
      ? Math.round(grades.reduce((sum: number, g: any) => sum + g.score, 0) / grades.length)
      : 0;

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
              <BookOpen className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">الدرجات والامتحانات</h1>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 w-full md:w-auto"
            >
              <Plus size={18} />
              إضافة درجة جديدة
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Add Grade Form */}
          {showForm && (
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <div className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">إضافة درجة جديدة</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        اسم الطالب *
                      </label>
                      <select
                        value={formData.studentId}
                        onChange={(e) =>
                          setFormData({ ...formData, studentId: parseInt(e.target.value) })
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg"
                      >
                        <option value={0}>اختر طالب</option>
                        {students.map((student: any) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        نوع الدرجة *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value as any })
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg"
                      >
                        <option value="daily">يومي</option>
                        <option value="monthly">شهري</option>
                        <option value="exam">امتحان</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        الدرجة (0-100) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.score}
                        onChange={(e) =>
                          setFormData({ ...formData, score: parseInt(e.target.value) })
                        }
                        className="bg-white border border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        التاريخ *
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createGradeMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      {createGradeMutation.isPending ? "جاري الحفظ..." : "حفظ الدرجة"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6">
                <p className="text-gray-600 text-sm font-medium">إجمالي الدرجات</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{grades.length}</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6">
                <p className="text-gray-600 text-sm font-medium">متوسط الدرجات</p>
                <h3 className="text-3xl font-bold text-purple-600 mt-2">{averageScore}</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6">
                <p className="text-gray-600 text-sm font-medium">أعلى درجة</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">
                  {grades.length > 0 ? Math.max(...grades.map((g: any) => g.score)) : 0}
                </h3>
              </div>
            </Card>
          </div>

          {/* Grades Table */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الطالب
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden md:table-cell">
                      النوع
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الدرجة
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden lg:table-cell">
                      التاريخ
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-gray-500">
                        لا توجد درجات مسجلة
                      </td>
                    </tr>
                  ) : (
                    grades.map((grade: any) => (
                      <tr
                        key={grade.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 md:px-6 py-4 text-gray-900 font-medium text-sm">
                          {getStudentName(grade.studentId)}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 text-sm hidden md:table-cell">
                          {getTypeLabel(grade.type)}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              grade.score >= 80
                                ? "bg-green-100 text-green-700"
                                : grade.score >= 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {grade.score}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 text-sm hidden lg:table-cell">
                          {new Date(grade.date).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-all duration-200"
                              disabled
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-all duration-200"
                              disabled
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
