import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Plus, Trash2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";

interface PaymentForm {
  studentId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "transfer" | "check";
  month?: string;
  notes?: string;
}

export default function Payments() {
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PaymentForm>({
    studentId: 0,
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    month: new Date().toISOString().split("T")[0].substring(0, 7),
  });

  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: payments = [], refetch } = trpc.students.getStudentPayments.useQuery({ studentId: 0 });

  const createPaymentMutation = trpc.students.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح!");
      setFormData({
        studentId: 0,
        amount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "cash",
        month: new Date().toISOString().split("T")[0].substring(0, 7),
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    createPaymentMutation.mutate({
      studentId: formData.studentId,
      amount: formData.amount,
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod,
      month: formData.month,
      notes: formData.notes,
    });
  };

  const getStudentName = (studentId: number) => {
    return students.find((s: any) => s.id === studentId)?.name || "غير معروف";
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "نقداً";
      case "transfer":
        return "تحويل بنكي";
      case "check":
        return "شيك";
      default:
        return method;
    }
  };

  const totalCollected = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const averagePayment = payments.length > 0 ? Math.round(totalCollected / payments.length) : 0;

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
              <DollarSign className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">المصروفات والمدفوعات</h1>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 w-full md:w-auto"
            >
              <Plus size={18} />
              إضافة دفعة جديدة
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Add Payment Form */}
          {showForm && (
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <div className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">إضافة دفعة جديدة</h2>
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
                        المبلغ (ج.م) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) })
                        }
                        className="bg-white border border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        طريقة الدفع *
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentMethod: e.target.value as any })
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg"
                      >
                        <option value="cash">نقداً</option>
                        <option value="transfer">تحويل بنكي</option>
                        <option value="check">شيك</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        تاريخ الدفع *
                      </label>
                      <Input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentDate: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        الشهر
                      </label>
                      <Input
                        type="month"
                        value={formData.month}
                        onChange={(e) =>
                          setFormData({ ...formData, month: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        ملاحظات
                      </label>
                      <Input
                        type="text"
                        placeholder="ملاحظات إضافية"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="bg-white border border-gray-300 text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createPaymentMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      {createPaymentMutation.isPending ? "جاري الحفظ..." : "حفظ الدفعة"}
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
                <p className="text-gray-600 text-sm font-medium">إجمالي الدفعات</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{payments.length}</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6">
                <p className="text-gray-600 text-sm font-medium">المبلغ المتحصل</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">{totalCollected} ج.م</h3>
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6">
                <p className="text-gray-600 text-sm font-medium">متوسط الدفعة</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-2">{averagePayment} ج.م</h3>
              </div>
            </Card>
          </div>

          {/* Payments Table */}
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm">
                      الطالب
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden md:table-cell">
                      المبلغ
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-gray-700 font-semibold text-sm hidden lg:table-cell">
                      الطريقة
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
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-gray-500">
                        لا توجد دفعات مسجلة
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment: any) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 md:px-6 py-4 text-gray-900 font-medium text-sm">
                          {getStudentName(payment.studentId)}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 text-sm hidden md:table-cell">
                          <span className="font-bold text-green-600">{payment.amount} ج.م</span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 text-sm hidden lg:table-cell">
                          {getMethodLabel(payment.paymentMethod)}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 text-sm hidden lg:table-cell">
                          {new Date(payment.paymentDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-all duration-200"
                            disabled
                          >
                            <Trash2 size={16} />
                          </Button>
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
