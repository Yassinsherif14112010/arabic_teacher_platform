import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Edit2, Trash2, Printer, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import BarcodeDisplay from "@/components/BarcodeDisplay";
import { toast } from "sonner";

interface StudentForm {
  name: string;
  email?: string;
  phone?: string;
  parentPhone?: string;
}

export default function Students() {
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState<StudentForm>({
    name: "",
    email: "",
    phone: "",
    parentPhone: "",
  });

  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery();
  const createStudentMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الطالب بنجاح!");
      setFormData({ name: "", email: "", phone: "", parentPhone: "" });
      setShowForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const deleteStudentMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الطالب بنجاح!");
      refetch();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("يرجى إدخال اسم الطالب");
      return;
    }
    // توليد رقم باركود فريد
    const barcodeNumber = "STU" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    createStudentMutation.mutate({
      ...formData,
      barcodeNumber,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      deleteStudentMutation.mutate({ id });
    }
  };

  if (loading || isLoading) {
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
              <Users className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">إدارة الطلاب</h1>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={18} />
              إضافة طالب جديد
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Add Student Form */}
          {showForm && (
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-400/30 backdrop-blur-sm mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">إضافة طالب جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        اسم الطالب *
                      </label>
                      <Input
                        type="text"
                        placeholder="أدخل اسم الطالب"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bg-slate-700 border-cyan-400/30 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        البريد الإلكتروني
                      </label>
                      <Input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="bg-slate-700 border-cyan-400/30 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        رقم الطالب
                      </label>
                      <Input
                        type="tel"
                        placeholder="رقم الطالب"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bg-slate-700 border-cyan-400/30 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        رقم ولي الأمر
                      </label>
                      <Input
                        type="tel"
                        placeholder="رقم ولي الأمر"
                        value={formData.parentPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, parentPhone: e.target.value })
                        }
                        className="bg-slate-700 border-cyan-400/30 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createStudentMutation.isPending}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      {createStudentMutation.isPending ? "جاري الحفظ..." : "حفظ الطالب"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* Students Table */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
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
                      الباركود
                    </th>
                    <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                      رقم الطالب
                    </th>
                    <th className="px-6 py-4 text-right text-gray-300 font-semibold">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        لا توجد طلاب مسجلين
                      </td>
                    </tr>
                  ) : (
                    students.map((student: any, index: number) => (
                      <tr
                        key={student.id}
                        className="border-b border-cyan-400/10 hover:bg-slate-700/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-gray-300">{index + 1}</td>
                        <td className="px-6 py-4 text-white font-medium">{student.name}</td>
                        <td className="px-6 py-4">
                          <span className="text-cyan-400 text-sm font-mono">
                            {student.barcodeNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {student.email || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {student.phone || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setSelectedStudent(student)}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded transition-all duration-200"
                              title="عرض البطاقة"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              onClick={() => window.print()}
                              className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded transition-all duration-200"
                              title="طباعة البطاقة"
                            >
                              <Printer size={16} />
                            </Button>
                            <Button
                              onClick={() => handleDelete(student.id)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-all duration-200"
                              title="حذف الطالب"
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

          {/* Student Card Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-400/30 max-w-md w-full">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <img
                      src="/logo.jpg"
                      alt="محسن شاكر"
                      className="h-16 w-16 rounded-lg mx-auto mb-4 border border-cyan-400/30"
                    />
                    <h2 className="text-2xl font-bold text-white">الشاعر</h2>
                    <p className="text-cyan-300 text-sm">منصة إدارة الطلاب</p>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-cyan-400/20">
                    <p className="text-gray-300 text-sm mb-2">اسم الطالب</p>
                    <p className="text-white text-lg font-bold mb-4">
                      {selectedStudent.name}
                    </p>

                    <p className="text-gray-300 text-sm mb-2">رقم الباركود</p>
                    <p className="text-cyan-400 text-sm font-mono mb-4">
                      {selectedStudent.barcodeNumber}
                    </p>

                    <BarcodeDisplay
                      value={selectedStudent.barcodeNumber}
                      format="CODE128"
                      width={2}
                      height={80}
                      displayValue={true}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.print()}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition-all duration-300"
                    >
                      <Printer size={18} className="ml-2" />
                      طباعة
                    </Button>
                    <Button
                      onClick={() => setSelectedStudent(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-all duration-300"
                    >
                      إغلاق
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
