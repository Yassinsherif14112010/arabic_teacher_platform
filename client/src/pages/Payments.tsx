import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Plus, TrendingUp, X, Check, Settings, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";

const GRADES = [
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
];

interface PaymentForm {
  studentId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "transfer" | "check";
  month?: string;
  notes?: string;
}

function getCurrentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() + 1 >= 10 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default function Payments() {
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showFeeSettings, setShowFeeSettings] = useState(false);
  const [feeForm, setFeeForm] = useState({ academicYear: getCurrentAcademicYear(), grade: GRADES[0], feeAmount: 0 });
  const [formData, setFormData] = useState<PaymentForm>({
    studentId: 0,
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    month: new Date().toISOString().split("T")[0].substring(0, 7),
  });

  const { data: students = [] } = trpc.students.list.useQuery();
  const { data: payments = [], refetch } = trpc.students.getAllPayments.useQuery();
  const { data: feeSettings = [], refetch: refetchFees } = trpc.fees.getAll.useQuery();
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStudentId, setFilterStudentId] = useState(0);

  const createPaymentMutation = trpc.students.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تسجيل الدفعة بنجاح!");
      setFormData({ studentId: 0, amount: 0, paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "cash", month: new Date().toISOString().split("T")[0].substring(0, 7) });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => toast.error("❌ حدث خطأ: " + error.message),
  });

  const upsertFeeMutation = trpc.fees.upsert.useMutation({
    onSuccess: () => { toast.success("تم حفظ إعداد الرسوم!"); refetchFees(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteFeeMutation = trpc.fees.delete.useMutation({
    onSuccess: () => { toast.success("تم الحذف"); refetchFees(); },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    createPaymentMutation.mutate({ studentId: formData.studentId, amount: formData.amount, paymentDate: formData.paymentDate, paymentMethod: formData.paymentMethod, month: formData.month, notes: formData.notes });
  };

  const getStudentName = (studentId: number) => (students as any[]).find((s: any) => s.id === studentId)?.name || "غير معروف";

  const filteredPayments = (payments as any[]).filter((p) => {
    const matchMonth = !filterMonth || (p.month && p.month.startsWith(filterMonth));
    const matchStudent = !filterStudentId || p.studentId === filterStudentId;
    return matchMonth && matchStudent;
  });

  const totalPayments = filteredPayments.reduce((sum, p: any) => sum + parseFloat(p.amount ?? "0"), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar userName={user?.name || ""} />

      <div className="md:mr-64">
        {/* Top Navbar */}
        <div className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-foreground">إدارة المصروفات والدفعات</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowFeeSettings(!showFeeSettings)} variant="outline" className="flex items-center gap-2 text-sm">
                <Settings size={16} /> رسوم السنة الدراسية
              </Button>
              <Button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                <Plus size={20} /> تسجيل دفعة جديدة
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6 space-y-4">

          {/* Fee Settings Panel */}
          {showFeeSettings && (
            <Card className="border border-orange-200 bg-orange-50/30">
              <div className="p-5">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-700">
                  <Settings size={18} /> إعداد رسوم السنة الدراسية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">السنة الدراسية</label>
                    <Input value={feeForm.academicYear} onChange={e => setFeeForm({ ...feeForm, academicYear: e.target.value })} placeholder="مثال: 2024-2025" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">الصف</label>
                    <select value={feeForm.grade} onChange={e => setFeeForm({ ...feeForm, grade: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">المبلغ (ج.م)</label>
                    <Input type="number" min="0" value={feeForm.feeAmount || ""} onChange={e => setFeeForm({ ...feeForm, feeAmount: parseFloat(e.target.value) || 0 })} placeholder="المصاريف" className="text-sm" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => upsertFeeMutation.mutate({ academicYear: feeForm.academicYear, grade: feeForm.grade, feeAmount: feeForm.feeAmount })} disabled={upsertFeeMutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                      <Check size={16} className="ml-1" /> حفظ
                    </Button>
                  </div>
                </div>
                {(feeSettings as any[]).length > 0 && (
                  <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-right font-semibold">السنة</th>
                        <th className="px-3 py-2 text-right font-semibold">الصف</th>
                        <th className="px-3 py-2 text-right font-semibold text-green-700">المبلغ</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(feeSettings as any[]).map((fs: any) => (
                        <tr key={fs.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono">{fs.academicYear}</td>
                          <td className="px-3 py-2">{fs.grade}</td>
                          <td className="px-3 py-2 font-bold text-green-700">{parseFloat(fs.feeAmount).toLocaleString("ar-EG")} ج.م</td>
                          <td className="px-3 py-2">
                            <button onClick={() => deleteFeeMutation.mutate({ id: fs.id })} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
          {showForm && (
            <Card className="bg-card border border-border shadow-sm mb-6">
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">تسجيل دفعة جديدة</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Student Selection */}
                    <div>
                      <label className="block text-muted-foreground font-bold text-sm mb-2">
                        الطالب *
                      </label>
                      <select
                        value={formData.studentId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            studentId: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-orange-500"
                      >
                        <option value={0}>اختر الطالب</option>
                        {students.map((student: any) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-muted-foreground font-bold text-sm mb-2">
                        المبلغ (بالجنيه) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="أدخل المبلغ"
                        className="bg-background border border-border text-foreground"
                      />
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-muted-foreground font-bold text-sm mb-2">
                        تاريخ الدفع *
                      </label>
                      <Input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentDate: e.target.value,
                          })
                        }
                        className="bg-background border border-border text-foreground"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-muted-foreground font-bold text-sm mb-2">
                        طريقة الدفع *
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value as "cash" | "transfer" | "check",
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-orange-500"
                      >
                        <option value="cash">نقداً</option>
                        <option value="transfer">تحويل بنكي</option>
                        <option value="check">شيك</option>
                      </select>
                    </div>

                    {/* Month */}
                    <div>
                      <label className="block text-muted-foreground font-bold text-sm mb-2">
                        الشهر
                      </label>
                      <Input
                        type="month"
                        value={formData.month || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            month: e.target.value,
                          })
                        }
                        className="bg-background border border-border text-foreground"
                      />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-muted-foreground font-bold text-sm mb-2">
                        ملاحظات
                      </label>
                      <textarea
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notes: e.target.value,
                          })
                        }
                        placeholder="أضف ملاحظات إضافية (اختياري)"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-orange-500 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={createPaymentMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
                    >
                      <Check size={18} />
                      {createPaymentMutation.isPending ? "جاري..." : "تسجيل الدفعة"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-6 rounded-lg transition-all duration-300"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <Card className="bg-card border border-border shadow-sm">
              <div className="p-4 md:p-6">
                <p className="text-muted-foreground text-sm font-medium">إجمالي الطلاب</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">{(students as any[]).length}</h3>
              </div>
            </Card>
            <Card className="bg-card border border-border shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <p className="text-muted-foreground text-sm font-medium">عدد الدفعات</p>
                </div>
                <h3 className="text-3xl font-bold text-orange-600 mt-2">
                  {filteredPayments.length}
                </h3>
              </div>
            </Card>
            <Card className="bg-card border border-border shadow-sm">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <p className="text-muted-foreground text-sm font-medium">إجمالي المبلغ</p>
                </div>
                <h3 className="text-3xl font-bold text-green-600 mt-2">
                  {totalPayments.toFixed(2)} ج.م
                </h3>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">تصفية بالطالب</label>
              <select
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-orange-500"
              >
                <option value={0}>كل الطلاب</option>
                {(students as any[]).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">تصفية بالشهر</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Payments Table */}
          <Card className="bg-card border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 md:px-6 py-4 text-right text-muted-foreground font-semibold text-sm">
                      الطالب
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-muted-foreground font-semibold text-sm hidden md:table-cell">
                      المبلغ
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-muted-foreground font-semibold text-sm hidden md:table-cell">
                      التاريخ
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-muted-foreground font-semibold text-sm hidden md:table-cell">
                      الطريقة
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-muted-foreground font-semibold text-sm">
                      الملاحظات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-muted-foreground">
                        لا توجد دفعات مسجلة
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment: any) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors duration-200"
                      >
                        <td className="px-4 md:px-6 py-4 text-foreground font-medium text-sm">
                          {getStudentName(payment.studentId)}
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell text-foreground font-bold text-sm">
                          {parseFloat(payment.amount).toFixed(2)} ج.م
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell text-muted-foreground text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${payment.paymentMethod === "cash"
                              ? "bg-green-100 text-green-700"
                              : payment.paymentMethod === "transfer"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                              }`}
                          >
                            {payment.paymentMethod === "cash"
                              ? "نقداً"
                              : payment.paymentMethod === "transfer"
                                ? "تحويل"
                                : "شيك"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-muted-foreground text-sm">
                          {payment.notes || "-"}
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
