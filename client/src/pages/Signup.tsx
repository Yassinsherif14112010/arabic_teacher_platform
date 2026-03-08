import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Eye, EyeOff, BookOpen, Lock, User, UserPlus, KeyRound } from "lucide-react";

export default function Signup() {
    const [, navigate] = useLocation();
    const [form, setForm] = useState({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "assistant" as "teacher" | "assistant",
        secretKey: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const registerMutation = trpc.auth.register.useMutation({
        onSuccess: () => {
            toast.success("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.");
            navigate("/login");
        },
        onError: (err) => {
            toast.error(err.message || "حدث خطأ أثناء إنشاء الحساب");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.username || !form.password || !form.secretKey) {
            toast.error("يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }
        if (form.password !== form.confirmPassword) {
            toast.error("كلمتا المرور غير متطابقتين");
            return;
        }
        if (form.password.length < 6) {
            toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }
        registerMutation.mutate({
            name: form.name,
            username: form.username,
            password: form.password,
            role: form.role,
            secretKey: form.secretKey,
        });
    };

    const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] right-[15%] w-72 h-72 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[15%] left-[10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-[40%] left-[30%] w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '5s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & title */}
                <div className="flex flex-col items-center mb-6 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                        <img src="/logo.jpg" alt="logo" className="w-12 h-12 rounded-xl object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-white">الشاعر في اللغة العربية</h1>
                        <p className="text-purple-300 text-sm">إنشاء حساب جديد للأستاذ أو المساعد</p>
                    </div>
                </div>

                {/* Glass card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-7">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <Field label="الاسم الكامل" icon={<User size={16} />}>
                            <input
                                type="text" value={form.name}
                                onChange={e => update("name", e.target.value)}
                                placeholder="أدخل اسمك الكامل"
                                className="input-glass"
                            />
                        </Field>

                        {/* Username */}
                        <Field label="اسم المستخدم" icon={<UserPlus size={16} />}>
                            <input
                                type="text" value={form.username}
                                onChange={e => update("username", e.target.value)}
                                placeholder="اختر اسم مستخدم"
                                className="input-glass"
                            />
                        </Field>

                        {/* Role */}
                        <div>
                            <label className="text-purple-200 text-sm mb-2 block font-medium">الدور الوظيفي</label>
                            <div className="flex gap-3">
                                {[{ v: "teacher", l: "🎓 أستاذ" }, { v: "assistant", l: "👨‍💼 مساعد" }].map(({ v, l }) => (
                                    <button
                                        key={v} type="button"
                                        onClick={() => update("role", v)}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${form.role === v ? "bg-purple-600 border-purple-400 text-white shadow-lg" : "bg-white/5 border-white/20 text-white/70 hover:border-white/40"}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Password */}
                        <Field label="كلمة المرور" icon={<Lock size={16} />}>
                            <input
                                type={showPassword ? "text" : "password"} value={form.password}
                                onChange={e => update("password", e.target.value)}
                                placeholder="6 أحرف على الأقل"
                                className="input-glass !pl-10"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </Field>

                        {/* Confirm Password */}
                        <Field label="تأكيد كلمة المرور" icon={<Lock size={16} />}>
                            <input
                                type="password" value={form.confirmPassword}
                                onChange={e => update("confirmPassword", e.target.value)}
                                placeholder="أعد إدخال كلمة المرور"
                                className="input-glass"
                            />
                        </Field>

                        {/* Secret Key */}
                        <Field label="🔐 الرمز السري للمنصة" icon={<KeyRound size={16} />}>
                            <input
                                type="password" value={form.secretKey}
                                onChange={e => update("secretKey", e.target.value)}
                                placeholder="الرمز السري المخصص للمنصة"
                                className="input-glass"
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all duration-300 shadow-lg shadow-purple-900/50 disabled:opacity-60 mt-2"
                        >
                            {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-white/50 text-sm">
                            لديك حساب بالفعل؟{" "}
                            <button onClick={() => navigate("/login")}
                                className="text-purple-300 hover:text-white font-medium transition-colors underline underline-offset-2">
                                تسجيل الدخول
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        .input-glass {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 0.75rem;
          padding: 0.65rem 2.5rem 0.65rem 1rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .input-glass::placeholder { color: rgba(255,255,255,0.35); }
        .input-glass:focus { outline: none; ring: 2px; border-color: rgba(167,139,250,0.8); background: rgba(255,255,255,0.15); }
        .input-glass:hover { border-color: rgba(255,255,255,0.35); }
      `}</style>
        </div>
    );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-purple-200 text-sm mb-2 block font-medium">{label}</label>
            <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300">{icon}</span>
                {children}
            </div>
        </div>
    );
}
