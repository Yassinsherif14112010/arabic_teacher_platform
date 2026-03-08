import React from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, Printer, Eye, Search, CheckCircle2, XCircle, Edit2, X, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import BarcodeDisplay from "@/components/BarcodeDisplay";
import { toast } from "sonner";

interface StudentForm {
  name: string;
  phone: string;
  parentPhone: string;
  grade: string;
  groupId: number | null;
  feePaid: boolean;
}

const GRADES = [
  { label: "🏫 الصف الأول الإعدادي", value: "الصف الأول الإعدادي" },
  { label: "🏫 الصف الثاني الإعدادي", value: "الصف الثاني الإعدادي" },
  { label: "🏫 الصف الثالث الإعدادي", value: "الصف الثالث الإعدادي" },
  { label: "🎓 الصف الأول الثانوي", value: "الصف الأول الثانوي" },
  { label: "🎓 الصف الثاني الثانوي", value: "الصف الثاني الثانوي" },
  { label: "🎓 الصف الثالث الثانوي", value: "الصف الثالث الثانوي" },
];

const empty: StudentForm = { name: "", phone: "", parentPhone: "", grade: "", groupId: null, feePaid: false };

export default function Students() {
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState<Partial<StudentForm>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<StudentForm>(empty);

  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery();
  const { data: studyGroups = [] } = trpc.groups.getAll.useQuery();

  const createStudentMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الطالب بنجاح!");
      setFormData(empty);
      setShowForm(false);
      refetch();
    },
    onError: (error) => toast.error("حدث خطأ: " + error.message),
  });

  const updateStudentMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("تم تعديل بيانات الطالب!");
      setEditingStudent(null);
      refetch();
    },
    onError: (error) => toast.error("حدث خطأ: " + error.message),
  });

  const deleteStudentMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الطالب بنجاح!");
      refetch();
    },
    onError: (error) => toast.error("حدث خطأ: " + error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast.error("يرجى إدخال اسم الطالب"); return; }
    const barcodeNumber = String(Date.now()).slice(-8);
    createStudentMutation.mutate({
      name: formData.name,
      barcodeNumber,
      phone: formData.phone || undefined,
      parentPhone: formData.parentPhone || undefined,
      grade: formData.grade || undefined,
      groupId: formData.groupId || undefined,
      feePaid: formData.feePaid,
    });
  };

  const startEdit = (student: any) => {
    setEditingStudent(student.id);
    setEditForm({
      name: student.name,
      phone: student.phone || "",
      parentPhone: student.parentPhone || "",
      grade: student.grade || "",
      groupId: student.groupId || null,
      feePaid: student.feePaid || false,
    });
  };

  const saveEdit = () => {
    if (!editingStudent) return;
    updateStudentMutation.mutate({
      id: editingStudent,
      name: editForm.name,
      phone: editForm.phone || undefined,
      parentPhone: editForm.parentPhone || undefined,
      groupId: editForm.groupId || undefined,
      feePaid: editForm.feePaid,
      status: (editForm as any).status,
    });
  };

  const toggleFeePaid = (student: any) => {
    updateStudentMutation.mutate({
      id: student.id,
      feePaid: !student.feePaid,
    });
  };

  const filteredStudents = students.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.barcodeNumber.includes(searchTerm)
  );

  const studentsByGrade = React.useMemo(() => {
    const grouped = filteredStudents.reduce((acc: any, student: any) => {
      const grade = student.grade || "بدون صف";
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(student);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([grade, sts]) => ({ grade, students: sts as any[] }))
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [filteredStudents]);

  const groupsForGrade = (grade: string) => studyGroups.filter((g: any) => g.grade === grade);

  if (loading || isLoading) {
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
        {/* Navbar */}
        <div className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">إدارة الطلاب</h1>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{students.length} طالب</span>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2">
              <Plus size={18} /> إضافة طالب جديد
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Add Form */}
          {showForm && (
            <Card className="border border-border shadow-sm">
              <div className="p-5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-primary" /> إضافة طالب جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">اسم الطالب *</label>
                      <Input placeholder="الاسم بالكامل" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">رقم الطالب</label>
                      <Input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">رقم ولي الأمر</label>
                      <Input type="tel" placeholder="رقم الهاتف" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الصف الدراسي</label>
                      <select value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value, groupId: null })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                        <option value="">اختر الصف</option>
                        {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    {formData.grade && (
                      <div>
                        <label className="block text-sm font-medium mb-1">المجموعة الدراسية</label>
                        <select value={formData.groupId || ""} onChange={e => setFormData({ ...formData, groupId: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                          <option value="">بدون مجموعة حالياً</option>
                          {groupsForGrade(formData.grade).map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name}{g.schedule ? ` — ${g.schedule}` : ""}</option>
                          ))}
                        </select>
                        {groupsForGrade(formData.grade).length === 0 && (
                          <p className="text-xs text-orange-500 mt-1">لا توجد مجموعات لهذا الصف. يمكنك إضافتها من لوحة التحكم.</p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2">
                      <input type="checkbox" id="feePaid" checked={formData.feePaid} onChange={e => setFormData({ ...formData, feePaid: e.target.checked })} className="w-4 h-4" />
                      <label htmlFor="feePaid" className="text-sm font-medium cursor-pointer">دفع المصاريف ✓</label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={createStudentMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-lg">
                      {createStudentMutation.isPending ? "جاري الحفظ..." : "حفظ الطالب"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-3 text-muted-foreground" size={18} />
            <Input placeholder="ابحث عن طالب أو باركود..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
          </div>

          {/* Tables by Grade */}
          {studentsByGrade.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border border-dashed">لا توجد طلاب مسجلين</Card>
          ) : (
            studentsByGrade.map(({ grade, students: gradeStudents }) => (
              <Card key={grade} className="border border-border shadow-sm overflow-hidden">
                <div className="bg-muted border-b border-border px-4 py-3 border-r-4 border-r-primary flex justify-between items-center">
                  <h3 className="font-bold text-lg">{grade}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-600 font-medium">
                      دفع: {gradeStudents.filter((s: any) => s.feePaid).length}
                    </span>
                    <span className="text-xs text-red-500 font-medium">
                      لم يدفع: {gradeStudents.filter((s: any) => !s.feePaid).length}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                      {gradeStudents.length} طالب
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground">
                        <th className="px-4 py-3 text-right">#</th>
                        <th className="px-4 py-3 text-right">اسم الطالب</th>
                        <th className="px-4 py-3 text-right hidden md:table-cell">الباركود</th>
                        <th className="px-4 py-3 text-right hidden lg:table-cell">المجموعة</th>
                        <th className="px-4 py-3 text-center">المصاريف</th>
                        <th className="px-4 py-3 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeStudents.map((student: any, index: number) => {
                        const isEditing = editingStudent === student.id;
                        const studentGroups = groupsForGrade(student.grade || "");
                        return (
                          <tr key={student.id} className={`border-b border-border transition-colors ${isEditing ? "bg-primary/5" : "hover:bg-muted/40"}`}>
                            <td className="px-4 py-3 text-muted-foreground font-bold">{index + 1}</td>
                            <td className="px-4 py-3 font-medium">
                              {isEditing
                                ? <Input value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm" />
                                : student.name
                              }
                            </td>
                            <td className="px-4 py-3 text-blue-600 font-mono hidden md:table-cell">{student.barcodeNumber}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <select
                                value={student.groupId || ""}
                                onChange={e => updateStudentMutation.mutate({ id: student.id, groupId: e.target.value ? parseInt(e.target.value) : undefined })}
                                disabled={updateStudentMutation.isPending}
                                className="w-full px-2 py-1.5 border border-border rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                              >
                                <option value="">بدون مجموعة</option>
                                {groupsForGrade(student.grade || "").map((g: any) => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <input type="checkbox" checked={!!editForm.feePaid} onChange={e => setEditForm({ ...editForm, feePaid: e.target.checked })} className="w-4 h-4" />
                              ) : (
                                <button
                                  onClick={() => toggleFeePaid(student)}
                                  disabled={updateStudentMutation.isPending}
                                  title={student.feePaid ? "دفع المصاريف — اضغط للتغيير" : "لم يدفع — اضغط للتغيير"}
                                  className="mx-auto flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  {student.feePaid
                                    ? <CheckCircle2 size={20} className="text-green-500" />
                                    : <XCircle size={20} className="text-red-400" />}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5 flex-wrap">
                                {isEditing ? (
                                  <>
                                    <Button onClick={saveEdit} disabled={updateStudentMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white p-1.5 h-8 rounded" title="حفظ"><Save size={15} /></Button>
                                    <Button variant="outline" onClick={() => setEditingStudent(null)} className="p-1.5 h-8 rounded" title="إلغاء"><X size={15} /></Button>
                                  </>
                                ) : (
                                  <>
                                    <Button onClick={() => setSelectedStudent(student)} className="bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 h-8 rounded" title="عرض البطاقة"><Eye size={15} /></Button>
                                    <Button onClick={() => startEdit(student)} className="bg-amber-500 hover:bg-amber-600 text-white p-1.5 h-8 rounded" title="تعديل"><Edit2 size={15} /></Button>
                                    <Button onClick={() => { if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) deleteStudentMutation.mutate({ id: student.id }); }} className="bg-red-600 hover:bg-red-700 text-white p-1.5 h-8 rounded" title="حذف"><Trash2 size={15} /></Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Student Card Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <div className="p-6">
              <div className="text-center mb-5">
                <img src="/logo.jpg" alt="logo" className="h-14 w-14 rounded-lg mx-auto mb-3 border border-border" onError={(e: any) => e.target.style.display = "none"} />
                <h2 className="text-xl font-bold">الشاعر في اللغة العربية</h2>
                <p className="text-sm text-muted-foreground">أ. محسن شاكر</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border space-y-2 text-sm">
                <div><span className="text-muted-foreground">الاسم: </span><span className="font-bold">{selectedStudent.name}</span></div>
                <div><span className="text-muted-foreground">الصف: </span><span>{selectedStudent.grade || "—"}</span></div>
                <div><span className="text-muted-foreground">الباركود: </span><span className="font-mono text-primary">{selectedStudent.barcodeNumber}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">المصاريف: </span>
                  {selectedStudent.feePaid
                    ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={14} /> مدفوعة</span>
                    : <span className="text-red-500 font-medium flex items-center gap-1"><XCircle size={14} /> غير مدفوعة</span>
                  }
                </div>
                <div className="pt-2">
                  <BarcodeDisplay value={selectedStudent.barcodeNumber} format="CODE128" width={2} height={70} displayValue={true} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => window.print()} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                  <Printer size={16} className="ml-2" /> طباعة
                </Button>
                <Button variant="outline" onClick={() => setSelectedStudent(null)} className="flex-1 rounded-lg">إغلاق</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
