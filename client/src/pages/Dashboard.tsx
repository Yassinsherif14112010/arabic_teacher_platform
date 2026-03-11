import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Calendar, TrendingUp, DollarSign, BookOpen, Plus, Trash2, Edit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  presentToday: number;
  todayAttendance?: number;
  todayPayments?: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    presentToday: 0,
  });

  const { data: dashboardStats, isLoading } = trpc.students.getStats.useQuery();
  const { data: studyGroups = [], refetch: refetchGroups } = trpc.groups.getAll.useQuery();

  // Dialog State
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ name: "", grade: "", schedule: "", description: "" });
  const createGroupMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المجموعة بنجاح");
      setIsGroupDialogOpen(false);
      refetchGroups();
      setGroupFormData({ name: "", grade: "", schedule: "", description: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteGroupMutation = trpc.groups.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المجموعة");
      refetchGroups();
    }
  });

  useEffect(() => {
    if (dashboardStats) {
      setStats(dashboardStats);
    }
  }, [dashboardStats]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-xl animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  const attendanceRate = stats.totalStudents > 0
    ? Math.round((stats.presentToday / stats.totalStudents) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <Sidebar userName={user?.name || ""} />

      <div className="md:mr-64 relative z-10 p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 flex items-end justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">لوحة التحكم</h1>
            <p className="text-muted-foreground">مرحباً بك مجدداً يا {user?.name || "أستاذنا"}! إليك نظرة عامة على منصتك.</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="إجمالي الطلاب"
            value={stats.totalStudents}
            subtitle="طالب مسجل"
            icon={<Users className="w-5 h-5 text-blue-500" />}
            gradient="border-blue-500/20"
          />
          <StatCard
            title="حضور اليوم"
            value={stats.presentToday}
            subtitle="حاضرين حتى الآن"
            icon={<Calendar className="w-5 h-5 text-emerald-500" />}
            gradient="border-emerald-500/20"
          />
          <StatCard
            title="نسبة الحضور"
            value={`${attendanceRate}%`}
            subtitle="من الإجمالي"
            icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
            gradient="border-orange-500/20"
          />
          <StatCard
            title="الطلاب النشطين"
            value={stats.activeStudents}
            subtitle="متفاعلين هذا الشهر"
            icon={<BookOpen className="w-5 h-5 text-purple-500" />}
            gradient="border-purple-500/20"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area - Left 2 Columns */}
          <div className="xl:col-span-2 space-y-8">

            {/* Study Groups Widget */}
            <Card className="bg-card border-border shadow-2xl p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  المجموعات الدراسية المتاحة
                </h2>
                <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all rounded-full px-5">
                      <Plus className="w-4 h-4 ml-2" /> مجموعة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-center mb-4">إضافة مجموعة دراسية</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">اسم المجموعة (مثال: سبت وإثنين 4 عصراً)</Label>
                        <Input id="name" value={groupFormData.name} onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>الصف الدراسي</Label>
                        <Select onValueChange={(v) => setGroupFormData({ ...groupFormData, grade: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الصف" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="الصف الأول الثانوي">الصف الأول الثانوي</SelectItem>
                            <SelectItem value="الصف الثاني الثانوي">الصف الثاني الثانوي</SelectItem>
                            <SelectItem value="الصف الثالث الثانوي">الصف الثالث الثانوي</SelectItem>
                            <SelectItem value="الصف الأول الإعدادي">الصف الأول الإعدادي</SelectItem>
                            <SelectItem value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</SelectItem>
                            <SelectItem value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule">المواعيد (اختياري)</Label>
                        <Input id="schedule" value={groupFormData.schedule} onChange={e => setGroupFormData({ ...groupFormData, schedule: e.target.value })} />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-6 mt-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      onClick={() => createGroupMutation.mutate(groupFormData)}
                      disabled={createGroupMutation.isPending || !groupFormData.name || !groupFormData.grade}
                    >
                      حفظ المجموعة
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

              {studyGroups.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed">
                  <p className="text-muted-foreground mb-4">لا توجد مجموعات مسجلة حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyGroups.map((group: any) => (
                    <div key={group.id} className="relative group bg-muted/30 hover:bg-muted/50 border border-border/50 p-5 rounded-xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-foreground">{group.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("هل تريد تأكيد الحذف؟")) deleteGroupMutation.mutate({ id: group.id });
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium mb-3">
                        {group.grade}
                      </span>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-70" />
                        {group.schedule || "مواعيد غير محددة"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate("/students")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-8 rounded-2xl shadow-lg transition-all text-lg flex items-center justify-center gap-3"
              >
                <Users className="w-6 h-6" />
                إدارة الطلاب الشاملة
              </Button>

              <Button
                onClick={() => navigate("/attendance")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-8 rounded-2xl shadow-lg transition-all text-lg flex items-center justify-center gap-3"
              >
                <Calendar className="w-6 h-6" />
                تسجيل الحضور اليومي
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Welcome / Teacher Badge */}
          <div className="xl:col-span-1">
            <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-3xl relative h-full min-h-[400px]">
              <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
              <div className="p-8 flex flex-col items-center justify-center h-full text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-purple-500 shadow-xl shadow-primary/20">
                    <img
                      src="/logo.jpg"
                      alt="الشاعر"
                      className="w-full h-full rounded-full object-cover border-4 border-background"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-background" />
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-2">الشاعر في اللغة العربية</h2>
                <h3 className="text-primary font-medium tracking-wide mb-6">أ. محسن شاكر</h3>

                <div className="w-16 h-1 bg-border rounded-full mb-6" />

               
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper Card Component
function StatCard({ title, value, subtitle, icon, gradient }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, gradient: string }) {
  return (
    <div className={`relative overflow-hidden bg-card border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${gradient}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-muted/50 rounded-xl border border-border shadow-inner">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-extrabold text-foreground mb-1 drop-shadow-sm">{value}</h3>
        <p className="text-muted-foreground font-medium text-sm">{title}</p>
        <p className="text-muted-foreground/70 text-xs mt-2 font-light">{subtitle}</p>
      </div>
    </div>
  );
}

