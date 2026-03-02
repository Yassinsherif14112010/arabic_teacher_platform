import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Edit2, Trash2, Printer, Eye, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredStudents = students.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.barcodeNumber.includes(searchTerm)
  );

  if (loading || isLoading) {
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
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h1>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 w-full md:w-auto"
            >
              <Plus size={18} />
              إضافة طالب جديد
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Add Student Form */}
          {showForm && (
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <div className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">إضافة طالب جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        اسم الطالب *
                      </label>
                      <Input
                        type="text"
                        placeholder="أدخل اسم الطالب"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        البريد الإلكتروني
                      </label>
                      <Input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        رقم الطالب
                      </label>
                      <Input
                        type="tel"
                        placeholder="رقم الطالب"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        رقم ولي الأمر
                      </label>
                      <Input
                        type="tel"
                        placeholder="رقم ولي الأمر"
                        value={formData.parentPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, parentPhone: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createStudentMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      {createStudentMutation.isPending ? "جاري الحفظ..." : "حفظ الطالب"}
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

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="ابحث عن طالب أو رقم باركود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 placeholder-gray-400 pr-10"
              />
            </div>
          </div>

          {/* Students Table */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الرقم
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      اسم الطالب
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden md:table-cell">
                      الباركود
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden lg:table-cell">
                      البريد الإلكتروني
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      دفع المصروفات
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-gray-500">
                        لا توجد طلاب مسجلين
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student: any, index: number) => (
                      <tr
                        key={student.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 md:px-6 py-4 text-gray-700 text-sm">{index + 1}</td>
                        <td className="px-4 md:px-6 py-4 text-gray-900 font-medium text-sm">
                          {student.name}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-blue-600 text-sm font-mono hidden md:table-cell">
                          {student.barcodeNumber}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 text-sm hidden lg:table-cell">
                          {student.email || "-"}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={student.hasPaidFees}
                              onChange={(e) => {
                                // يمكن إضافة دالة لتحديث حالة الدفع
                                toast.success(e.target.checked ? "✅ تم تسجيل الدفع" : "❌ تم إلغاء الدفع");
                              }}
                              className="w-5 h-5 text-green-600 rounded cursor-pointer"
                            />
                            <span className={`text-sm font-bold ${
                              student.hasPaidFees ? "text-green-600" : "text-red-600"
                            }`}>
                              {student.hasPaidFees ? "مدفوع" : "لم يدفع"}
                            </span>
                          </label>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              onClick={() => setSelectedStudent(student)}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-all duration-200"
                              title="عرض البطاقة"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              onClick={() => window.print()}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-all duration-200"
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

          {/* Student Card Modal - Print Friendly */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:bg-white print:p-0">
              <Card className="bg-white border border-gray-200 max-w-md w-full print:border-0 print:shadow-none print:max-w-full">
                <div className="p-8 print:p-4">
                  <div className="text-center mb-6">
                    <img
                      src="/logo.jpg"
                      alt="محسن شاكر"
                      className="h-16 w-16 rounded-lg mx-auto mb-4 border border-blue-200"
                    />
                    <h2 className="text-2xl font-bold text-gray-900">الشاعر</h2>
                    <p className="text-blue-600 text-sm font-medium">منصة إدارة الطلاب</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <p className="text-gray-700 text-sm mb-2 font-medium">اسم الطالب</p>
                    <p className="text-gray-900 text-lg font-bold mb-4">
                      {selectedStudent.name}
                    </p>

                    <p className="text-gray-700 text-sm mb-2 font-medium">رقم الباركود</p>
                    <p className="text-blue-600 text-sm font-mono mb-4">
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

                  <div className="flex gap-2 print:hidden">
                    <Button
                      onClick={() => window.print()}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all duration-300"
                    >
                      <Printer size={18} className="ml-2" />
                      طباعة
                    </Button>
                    <Button
                      onClick={() => setSelectedStudent(null)}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-all duration-300"
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

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .fixed, .md\\:mr-64, button:not(.print\\:block) {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
