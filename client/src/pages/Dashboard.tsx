import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Link } from "wouter";

interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  todayPayments: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todayAttendance: 0,
    todayPayments: "0",
  });

  const { data: dashboardStats, isLoading } = trpc.students.getStats.useQuery();

  useEffect(() => {
    if (dashboardStats) {
      setStats(dashboardStats);
    }
  }, [dashboardStats]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-orange-900 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-orange-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-black/40 backdrop-blur-md border-b border-cyan-400/20 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.jpg"
                alt="محسن شاكر"
                className="h-16 w-16 rounded-lg shadow-lg border border-cyan-400/30"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">الشاعر</h1>
                <p className="text-cyan-300 text-sm">منصة إدارة الطلاب</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm">مرحباً</p>
              <p className="text-gray-400 text-xs">الشاعر في اللغة العربية</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-400/30 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-300 text-sm font-medium">إجمالي الطلاب</h3>
                  <div className="p-3 bg-cyan-400/20 rounded-lg">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {stats.totalStudents}
                </div>
                <p className="text-cyan-300/70 text-xs">عدد الطلاب المسجلين</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-400/30 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-300 text-sm font-medium">الحضور اليوم</h3>
                  <div className="p-3 bg-orange-400/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {stats.todayAttendance}
                </div>
                <p className="text-orange-300/70 text-xs">عدد الطلاب الحاضرين</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-400/30 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-300 text-sm font-medium">التحصيل اليوم</h3>
                  <div className="p-3 bg-cyan-400/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {parseInt(stats.todayPayments)}
                </div>
                <p className="text-cyan-300/70 text-xs">جنيه مصري</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Link href="/students">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold py-6 rounded-lg">
                <Users className="w-5 h-5 ml-2" />
                إدارة الطلاب
              </Button>
            </Link>

            <Link href="/attendance">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-6 rounded-lg">
                <Calendar className="w-5 h-5 ml-2" />
                تسجيل الحضور
              </Button>
            </Link>

            <Link href="/grades">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold py-6 rounded-lg">
                <BarChart3 className="w-5 h-5 ml-2" />
                الدرجات
              </Button>
            </Link>

            <Link href="/payments">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-6 rounded-lg">
                <DollarSign className="w-5 h-5 ml-2" />
                المصروفات
              </Button>
            </Link>
          </div>

          <Card className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border border-cyan-400/30 backdrop-blur-sm">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">أهلاً وسهلاً</h2>
              <p className="text-gray-300 mb-4">منصة متكاملة لإدارة الطلاب</p>
              <p className="text-cyan-300 text-sm">الشاعر في اللغة العربية</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
