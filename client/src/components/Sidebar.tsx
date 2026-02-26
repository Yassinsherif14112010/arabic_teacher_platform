import { useLocation } from "wouter";
import {
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SidebarProps {
  userName?: string;
}

export default function Sidebar({ userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, navigate] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج بنجاح");
      window.location.href = "/";
    },
  });

  const isActive = (path: string) => location === path;

  const menuItems = [
    { path: "/dashboard", label: "لوحة التحكم", icon: BarChart3 },
    { path: "/students", label: "إدارة الطلاب", icon: Users },
    { path: "/attendance", label: "تسجيل الحضور", icon: Calendar },
    { path: "/grades", label: "الدرجات", icon: BarChart3 },
    { path: "/payments", label: "المصروفات", icon: DollarSign },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 shadow-lg w-64 transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => {
              navigate("/dashboard");
              setIsOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.jpg"
              alt="محسن شاكر"
              className="h-12 w-12 rounded-lg border border-blue-200"
            />
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900">الشاعر</h2>
              <p className="text-blue-600 text-xs font-medium">منصة الطلاب</p>
            </div>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <p className="text-gray-600 text-sm">مرحباً بك</p>
          <p className="font-semibold text-gray-900 truncate">{userName}</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 flex-1">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-right flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              navigate("/settings");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <Settings size={20} />
            <span className="font-medium text-right flex-1">الإعدادات</span>
          </button>

          <Button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {logout.isPending ? "جاري..." : "تسجيل الخروج"}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
