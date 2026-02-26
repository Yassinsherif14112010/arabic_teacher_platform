import { Link, useLocation } from "wouter";
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

interface SidebarProps {
  userName?: string;
}

export default function Sidebar({ userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation();

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
        className="fixed top-4 left-4 z-50 md:hidden bg-cyan-600 text-white p-2 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-l border-cyan-400/20 w-64 transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-cyan-400/20">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                src="/logo.jpg"
                alt="محسن شاكر"
                className="h-12 w-12 rounded-lg border border-cyan-400/30"
              />
              <div>
                <h2 className="text-xl font-bold text-white">الشاعر</h2>
                <p className="text-cyan-300 text-xs">منصة الطلاب</p>
              </div>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-cyan-400/20">
          <p className="text-gray-300 text-sm font-medium truncate">{userName}</p>
          <p className="text-gray-500 text-xs">مسؤول النظام</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-400/20"
                      : "text-gray-300 hover:bg-slate-700/50 hover:text-cyan-300"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-400/20 space-y-2">
          <Link href="/settings">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700/50 hover:text-cyan-300 transition-all duration-200 cursor-pointer">
              <Settings size={20} />
              <span className="font-medium">الإعدادات</span>
            </div>
          </Link>

          <Button
            onClick={() => logout.mutate()}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
