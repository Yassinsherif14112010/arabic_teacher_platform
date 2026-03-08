import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    GraduationCap,
    Plus,
    X,
    Check,
    Filter,
    TrendingUp,
    Award,
    BookOpen,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";

interface GradeForm {
    studentId: number;
    examType: "daily" | "monthly" | "final";
    score: number;
    maxScore: number;
    examDate: string;
    subject: string;
    notes: string;
}

const EXAM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    daily: { label: "يومي", color: "bg-blue-100 text-blue-700" },
    monthly: { label: "شهري", color: "bg-purple-100 text-purple-700" },
    final: { label: "نهائي", color: "bg-red-100 text-red-700" },
};

const GRADE_OPTIONS = [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
];

export default function Exams() {
    const { user, loading } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [filterGrade, setFilterGrade] = useState("");
    const [filterType, setFilterType] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [formData, setFormData] = useState<GradeForm>({
        studentId: 0,
        examType: "daily",
        score: 0,
        maxScore: 100,
        examDate: new Date().toISOString().split("T")[0],
        subject: "اللغة العربية",
        notes: "",
    });

    const { data: students = [] } = trpc.students.list.useQuery();
    const { data: grades = [], refetch: refetchGrades } =
        trpc.students.getStudentGrades.useQuery(
            { studentId: selectedStudentId ?? 0 },
            { enabled: selectedStudentId !== null }
        );

    const recordGradeMutation = trpc.students.recordGrade.useMutation({
        onSuccess: () => {
            toast.success("✅ تم تسجيل الدرجة بنجاح!");
            setFormData({
                studentId: 0,
                examType: "daily",
                score: 0,
                maxScore: 100,
                examDate: new Date().toISOString().split("T")[0],
                subject: "اللغة العربية",
                notes: "",
            });
            setShowForm(false);
            if (selectedStudentId) refetchGrades();
        },
        onError: (error: any) => {
            toast.error("حدث خطأ: " + error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId || formData.score === undefined) {
            toast.error("يرجى ملء جميع الحقول المطلوبة");
            return;
        }
        recordGradeMutation.mutate({
            studentId: formData.studentId,
            examType: formData.examType,
            score: formData.score,
            maxScore: formData.maxScore,
            examDate: formData.examDate,
            subject: formData.subject || undefined,
            notes: formData.notes || undefined,
        });
    };

    const getStudentName = (id: number) =>
        (students as any[]).find((s) => s.id === id)?.name || "غير معروف";

    // Filter students by grade for the grade selector
    const filteredStudents = useMemo(() => {
        let list = students as any[];
        if (filterGrade) list = list.filter((s) => s.grade === filterGrade);
        return list;
    }, [students, filterGrade]);

    // Stats per selected student
    const avgScore = useMemo(() => {
        if (!grades.length) return null;
        const total = (grades as any[]).reduce(
            (sum, g) => sum + parseFloat(g.score),
            0
        );
        return (total / (grades as any[]).length).toFixed(1);
    }, [grades]);

    const topScore = useMemo(() => {
        if (!grades.length) return null;
        return Math.max(...(grades as any[]).map((g) => parseFloat(g.score)));
    }, [grades]);

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
                            <GraduationCap className="w-6 h-6 text-purple-600" />
                            <h1 className="text-2xl font-bold text-foreground">
                                الامتحانات والدرجات
                            </h1>
                        </div>
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            تسجيل درجة جديدة
                        </Button>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {/* Add Grade Form */}
                    {showForm && (
                        <Card className="bg-card border border-border shadow-sm mb-6">
                            <div className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-foreground">
                                        تسجيل درجة امتحان
                                    </h2>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Student */}
                                        <div>
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
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
                                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-purple-500"
                                            >
                                                <option value={0}>اختر الطالب</option>
                                                {(students as any[]).map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} {s.grade ? `(${s.grade})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Exam Type */}
                                        <div>
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                                نوع الامتحان *
                                            </label>
                                            <select
                                                value={formData.examType}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        examType: e.target.value as any,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-purple-500"
                                            >
                                                <option value="daily">يومي</option>
                                                <option value="monthly">شهري</option>
                                                <option value="final">نهائي</option>
                                            </select>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                                المادة / الموضوع
                                            </label>
                                            <Input
                                                type="text"
                                                value={formData.subject}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, subject: e.target.value })
                                                }
                                                placeholder="مثال: اللغة العربية، النحو..."
                                                className="bg-background border border-border text-foreground"
                                            />
                                        </div>

                                        {/* Score */}
                                        <div>
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                                الدرجة *
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={formData.maxScore}
                                                step="0.5"
                                                value={formData.score}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        score: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                className="bg-background border border-border text-foreground"
                                            />
                                        </div>

                                        {/* Max Score */}
                                        <div>
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                                الدرجة الكاملة *
                                            </label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.maxScore}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        maxScore: parseInt(e.target.value) || 100,
                                                    })
                                                }
                                                className="bg-background border border-border text-foreground"
                                            />
                                        </div>

                                        {/* Exam Date */}
                                        <div>
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                                تاريخ الامتحان *
                                            </label>
                                            <Input
                                                type="date"
                                                value={formData.examDate}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        examDate: e.target.value,
                                                    })
                                                }
                                                className="bg-background border border-border text-foreground"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                                ملاحظات
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, notes: e.target.value })
                                                }
                                                rows={2}
                                                placeholder="ملاحظات إضافية (اختياري)"
                                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-purple-500 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Score Preview */}
                                    {formData.score > 0 && formData.maxScore > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                            <span className="text-sm text-muted-foreground">النسبة المئوية:</span>
                                            <span
                                                className={`text-lg font-bold ${(formData.score / formData.maxScore) * 100 >= 50
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                    }`}
                                            >
                                                {((formData.score / formData.maxScore) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            disabled={recordGradeMutation.isPending}
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"
                                        >
                                            <Check size={18} />
                                            {recordGradeMutation.isPending ? "جاري..." : "حفظ الدرجة"}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-6 rounded-lg"
                                        >
                                            إلغاء
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    )}

                    {/* Filters + Student Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                <Filter className="inline w-4 h-4 ml-1" />
                                تصفية بالصف
                            </label>
                            <select
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-purple-500"
                            >
                                <option value="">كل الصفوف</option>
                                {GRADE_OPTIONS.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                عرض درجات طالب
                            </label>
                            <select
                                value={selectedStudentId ?? ""}
                                onChange={(e) =>
                                    setSelectedStudentId(
                                        e.target.value ? parseInt(e.target.value) : null
                                    )
                                }
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-purple-500"
                            >
                                <option value="">اختر طالب لعرض درجاته</option>
                                {filteredStudents.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.grade ? `(${s.grade})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-muted-foreground text-sm font-medium mb-2">
                                نوع الامتحان
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-purple-500"
                            >
                                <option value="">كل الأنواع</option>
                                <option value="daily">يومي</option>
                                <option value="monthly">شهري</option>
                                <option value="final">نهائي</option>
                            </select>
                        </div>
                    </div>

                    {/* Student Stats */}
                    {selectedStudentId && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <Card className="bg-card border border-border shadow-sm">
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <BookOpen className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">عدد الامتحانات</p>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {(grades as any[]).length}
                                            </h3>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="bg-card border border-border shadow-sm">
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">متوسط الدرجات</p>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {avgScore ?? "-"}
                                            </h3>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="bg-card border border-border shadow-sm">
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Award className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">أعلى درجة</p>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {topScore ?? "-"}
                                            </h3>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Grades Table */}
                            <Card className="bg-card border border-border shadow-sm overflow-hidden">
                                <div className="px-4 md:px-6 py-3 border-b border-border bg-muted/30">
                                    <h3 className="font-bold text-foreground">
                                        درجات: {getStudentName(selectedStudentId)}
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm">
                                                    #
                                                </th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm">
                                                    المادة / الموضوع
                                                </th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm">
                                                    النوع
                                                </th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm">
                                                    الدرجة
                                                </th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm">
                                                    النسبة
                                                </th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm hidden md:table-cell">
                                                    التاريخ
                                                </th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-sm hidden md:table-cell">
                                                    ملاحظات
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(grades as any[]).length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-4 py-8 text-center text-muted-foreground"
                                                    >
                                                        لا توجد درجات مسجلة لهذا الطالب
                                                    </td>
                                                </tr>
                                            ) : (
                                                (grades as any[])
                                                    .filter((g) => !filterType || g.examType === filterType)
                                                    .map((grade: any, idx: number) => {
                                                        const pct = (
                                                            (parseFloat(grade.score) /
                                                                parseFloat(grade.maxScore)) *
                                                            100
                                                        ).toFixed(1);
                                                        const passing = parseFloat(pct) >= 50;
                                                        const typeStyle =
                                                            EXAM_TYPE_LABELS[grade.examType] || {
                                                                label: grade.examType,
                                                                color: "bg-gray-100 text-gray-700",
                                                            };
                                                        return (
                                                            <tr
                                                                key={grade.id}
                                                                className="border-b border-border hover:bg-muted/30 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 text-muted-foreground text-sm">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-4 py-3 text-foreground font-medium text-sm">
                                                                    {grade.subject || "—"}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className={`px-2 py-1 rounded-full text-xs font-bold ${typeStyle.color}`}
                                                                    >
                                                                        {typeStyle.label}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 font-bold text-foreground">
                                                                    {parseFloat(grade.score)}/{parseFloat(grade.maxScore)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className={`font-bold text-sm ${passing ? "text-green-600" : "text-red-600"
                                                                            }`}
                                                                    >
                                                                        {pct}%
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground text-sm hidden md:table-cell">
                                                                    {grade.examDate
                                                                        ? new Date(grade.examDate).toLocaleDateString("ar-EG")
                                                                        : "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground text-sm hidden md:table-cell">
                                                                    {grade.notes || "—"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}

                    {!selectedStudentId && (
                        <Card className="bg-card border border-border shadow-sm">
                            <div className="p-12 text-center">
                                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                                <p className="text-muted-foreground text-lg font-medium">
                                    اختر طالباً لعرض درجاته
                                </p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    أو سجّل درجة جديدة من زر "تسجيل درجة جديدة" في الأعلى
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
