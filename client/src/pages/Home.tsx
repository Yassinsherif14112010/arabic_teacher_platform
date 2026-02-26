import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-orange-900 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-orange-900 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <Card className="bg-slate-900/80 backdrop-blur-md border border-cyan-400/30 shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <img
                src="/logo.jpg"
                alt="محسن شاكر"
                className="h-24 w-24 rounded-lg shadow-lg border border-cyan-400/30 mx-auto mb-4"
              />
              <h1 className="text-4xl font-bold text-white mb-2">الشاعر</h1>
              <p className="text-cyan-300 text-sm">منصة إدارة الطلاب</p>
              <p className="text-gray-400 text-xs mt-2">الشاعر في اللغة العربية</p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300 text-center text-sm mb-6">
                منصة متكاملة لإدارة الطلاب والحضور والدرجات والمصروفات
              </p>

              <a href={getLoginUrl()}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/30">
                  تسجيل الدخول
                </Button>
              </a>

              <div className="mt-8 pt-8 border-t border-cyan-400/20">
                <p className="text-gray-400 text-xs text-center">
                  منصة حديثة وآمنة لإدارة العملية التعليمية
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center text-gray-400 text-xs">
          <p>© 2026 منصة الشاعر - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
