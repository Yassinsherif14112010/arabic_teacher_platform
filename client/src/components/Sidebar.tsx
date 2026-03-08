import { useLocation } from "wouter";
import {
  Users,
  Calendar,
  BarChart3,
  Menu,
  X,
  Moon,
  Sun,
  DollarSign,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  userName?: string;
}

export default function Sidebar({ userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [location, navigate] = useLocation();

  const isActive = (path: string) => location === path;

  const menuItems = [
    { path: "/dashboard", label: "لوحة التحكم", icon: BarChart3 },
    { path: "/students", label: "إدارة الطلاب", icon: Users },
    { path: "/attendance", label: "تسجيل الحضور", icon: Calendar },
    { path: "/payments", label: "المصروفات", icon: DollarSign },
    { path: "/exams", label: "الامتحانات", icon: GraduationCap },
  ];

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/login");
      toast.success("تم تسجيل الخروج", { icon: "👋" });
    },
  });

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] md:hidden bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white p-3 rounded-xl transition-all duration-300 shadow-xl"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 right-0 h-screen w-64 bg-black/40 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ease-in-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
          } md:translate-x-0 flex flex-col`}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 relative z-10">
          <button
            onClick={() => {
              navigate("/dashboard");
              setIsOpen(false);
            }}
            className="flex items-center gap-4 cursor-pointer group w-full"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all" />
              <img
                src="/logo.jpg"
                alt="الشاعر"
                className="h-14 w-14 rounded-xl border-2 border-primary/50 object-cover shadow-lg relative z-10 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-white leading-tight tracking-wide group-hover:text-primary transition-colors">
                الشاعر
              </h2>
              <p className="text-xs text-primary/80 font-medium">في اللغة العربية</p>
            </div>
          </button>
        </div>

        {/* User Info Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0 pr-1">
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-bold mb-0.5">المستخدم الحالي</p>
            <p className="font-bold text-white text-sm truncate">{userName || "أستاذنا"}</p>
          </div>
          <button
            onClick={toggleTheme}
            title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
            className="flex-shrink-0 p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:border-primary hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar relative z-10 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
                  ? "text-white"
                  : "text-white/60 hover:text-white"
                  }`}
              >
                {/* Active Indicator Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-primary/80 to-indigo-600/80 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-10"
                    }`}
                />

                {/* Active Indicator Line */}
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-white rounded-l-full transition-transform duration-300 ${active ? "scale-y-100" : "scale-y-0"
                    }`}
                />

                <div className="relative z-10 flex items-center gap-4 w-full">
                  <Icon
                    size={20}
                    className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
                  />
                  <span className={`font-bold text-right flex-1 tracking-wide ${active ? "" : ""}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 relative z-10 border-t border-white/10">
          <Button
            onClick={() => {
              if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
                logoutMutation.mutate();
              }
            }}
            variant="ghost"
            className="w-full flex items-center gap-3 justify-center py-6 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all duration-300 group"
          >
            <span className="font-bold text-lg">تسجيل الخروج</span>
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
