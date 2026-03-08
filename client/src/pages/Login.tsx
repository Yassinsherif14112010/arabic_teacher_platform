import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Eye, EyeOff, BookOpen, Lock, User } from "lucide-react";

export default function Login() {
    const [, navigate] = useLocation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const utils = trpc.useUtils();
    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: async () => {
            await utils.auth.me.invalidate();
            navigate("/");
        },
        onError: (err) => {
            toast.error(err.message || "حدث خطأ أثناء تسجيل الدخول");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error("يرجى تعبئة جميع الحقول");
            return;
        }
        loginMutation.mutate({ username, password });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-[50%] right-[30%] w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '4s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & title */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                        <img src="/logo.jpg" alt="logo" className="w-14 h-14 rounded-xl object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                        <BookOpen className="w-10 h-10 text-purple-300 hidden" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-1">الشاعر في اللغة العربية</h1>
                        <p className="text-purple-300 text-sm">منصة إدارة الطلاب</p>
                    </div>
                </div>

                {/* Glass card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
                    <h2 className="text-xl font-bold text-white mb-6 text-center">تسجيل الدخول</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div className="group">
                            <label className="text-purple-200 text-sm mb-2 block font-medium">اسم المستخدم</label>
                            <div className="relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="أدخل اسم المستخدم"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-10 pl-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:border-white/40"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="group">
                            <label className="text-purple-200 text-sm mb-2 block font-medium">كلمة المرور</label>
                            <div className="relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="أدخل كلمة المرور"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-10 pl-10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:border-white/40"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all duration-300 shadow-lg shadow-purple-900/50 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-white/50 text-sm">
                            ليس لديك حساب؟{" "}
                            <button
                                onClick={() => navigate("/signup")}
                                className="text-purple-300 hover:text-white font-medium transition-colors underline underline-offset-2"
                            >
                                إنشاء حساب جديد
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
