import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";

interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  todayPayments: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  const attendanceRate = stats.totalStudents > 0
    ? Math.round((stats.todayAttendance / stats.totalStudents) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={user?.name || ""} />

      <div className="md:mr-64">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-6 py-4">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-600 text-sm mt-1">مرحباً بك في منصة الشاعر</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Total Students */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">إجمالي الطلاب</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.totalStudents}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">عدد الطلاب المسجلين</p>
              </div>
            </Card>

            {/* Today Attendance */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">الحضور اليوم</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.todayAttendance}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">عدد الطلاب الحاضرين</p>
              </div>
            </Card>

            {/* Today Payments */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">التحصيل اليوم</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">
                      {parseInt(stats.todayPayments).toLocaleString("ar-EG")}
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">جنيه مصري</p>
              </div>
            </Card>

            {/* Attendance Rate */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">نسبة الحضور</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">
                      {attendanceRate}%
                    </h3>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">من إجمالي الطلاب</p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Button
              onClick={() => navigate("/students")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              إدارة الطلاب
            </Button>

            <Button
              onClick={() => navigate("/attendance")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              تسجيل الحضور
            </Button>


          </div>

          {/* Welcome Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src="/logo.jpg"
                  alt="محسن شاكر"
                  className="h-24 w-24 md:h-32 md:w-32 rounded-lg border-4 border-blue-200"
                />
                <div className="flex-1 text-center md:text-right">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">الشاعر</h2>
                  <p className="text-blue-600 font-medium mb-4">
                    الشاعر في اللغة العربية - محسن شاكر
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    منصة متكاملة لإدارة الطلاب والحضور والدرجات والمصروفات. توفر أدوات احترافية
                    لتسهيل عملية التدريس والمتابعة الفعالة لأداء الطلاب.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
