import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";

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
            <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">{user?.name}</p>
                <p className="text-gray-400 text-xs">الشاعر في اللغة العربية</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Students */}
            <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-400/30 backdrop-blur-sm hover:border-cyan-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">إجمالي الطلاب</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {stats.totalStudents}
                    </h3>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Users className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <p className="text-cyan-400/70 text-xs">عدد الطلاب المسجلين</p>
              </div>
            </Card>

            {/* Today Attendance */}
            <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-400/30 backdrop-blur-sm hover:border-orange-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">الحضور اليوم</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {stats.todayAttendance}
                    </h3>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Calendar className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <p className="text-orange-400/70 text-xs">عدد الطلاب الحاضرين</p>
              </div>
            </Card>

            {/* Today Payments */}
            <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-400/30 backdrop-blur-sm hover:border-cyan-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">التحصيل اليوم</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {parseInt(stats.todayPayments).toLocaleString("ar-EG")}
                    </h3>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <DollarSign className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <p className="text-cyan-400/70 text-xs">جنيه مصري</p>
              </div>
            </Card>

            {/* Performance */}
            <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-400/30 backdrop-blur-sm hover:border-orange-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">نسبة الحضور</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {stats.totalStudents > 0
                        ? Math.round(
                            (stats.todayAttendance / stats.totalStudents) * 100
                          )
                        : 0}
                      %
                    </h3>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <p className="text-orange-400/70 text-xs">من إجمالي الطلاب</p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/students">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/30">
                <Users className="w-5 h-5 ml-2" />
                إدارة الطلاب
              </Button>
            </Link>

            <Link href="/attendance">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/30">
                <Calendar className="w-5 h-5 ml-2" />
                تسجيل الحضور
              </Button>
            </Link>

            <Link href="/grades">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/30">
                <BarChart3 className="w-5 h-5 ml-2" />
                الدرجات
              </Button>
            </Link>

            <Link href="/payments">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/30">
                <DollarSign className="w-5 h-5 ml-2" />
                المصروفات
              </Button>
            </Link>
          </div>

          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border border-cyan-400/30 backdrop-blur-sm">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                أهلاً وسهلاً بك في منصة الشاعر
              </h2>
              <p className="text-gray-300 mb-4">
                منصة متكاملة لإدارة الطلاب والحضور والدرجات والمصروفات
              </p>
              <p className="text-cyan-300 text-sm">
                الشاعر في اللغة العربية - محسن شاكر
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
