import React, { useState } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import { Fish, Droplets, DollarSign, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithDevAccount, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSuccess = async (credential: string) => {
    setErrorMessage(null);
    const success = await loginWithGoogle(credential);
    if (!success) {
      setErrorMessage('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google กรุณาลองใหม่');
  };

  const handleDevLogin = async () => {
    setErrorMessage(null);
    const success = await loginWithDevAccount();
    if (!success) {
      setErrorMessage('เข้าสู่ระบบทดสอบไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Banner & Header */}
      <header className="bg-sky-700 text-white shadow-sm border-b border-sky-800">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/15 p-2 rounded-xl backdrop-blur-xs flex items-center justify-center">
              <Fish className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white leading-tight font-prompt">
                บ่อดี <span className="text-sky-300 font-medium text-sm">BODI</span>
              </h1>
              <p className="text-xs text-sky-100 font-light">
                รู้ทันบ่อ ดูแลง่าย ขายได้ราคา
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-6">
          {/* Welcome Message */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-50 text-sky-700 rounded-2xl mb-1">
              <Fish className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-prompt">
              เข้าสู่ระบบฟาร์มของคุณ
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              สมุดบันทึกดิจิทัลสำหรับฟาร์มกุ้ง ปู และสัตว์น้ำธรรมชาติ
              บันทึกข้อมูลปลอดภัยและเข้าถึงได้ทุกที่
            </p>
          </div>

          {/* Value Highlights */}
          <div className="bg-slate-50 rounded-xl p-3.5 text-left space-y-2.5 text-xs text-slate-700 border border-slate-100">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <span className="leading-tight">
                <strong>ตรวจค่าน้ำ & บันทึกบ่อ</strong> ทำได้ใน 10 วินาที
                รองรับบ่อธรรมชาติที่ไม่บังคับกรอกอาหาร
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="leading-tight">
                <strong>บัญชีรายรับ-รายจ่าย</strong> สรุปกำไรขาดทุนรายเดือน
                พร้อมส่งออกไฟล์ Excel/CSV ได้ทันที
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="leading-tight">
                <strong>แจ้งเตือนความเสี่ยง</strong> เตือนออกซิเจนต่ำ ค่า pH แกว่ง
                หรือกุ้งลอยหัวตามกฎที่ชัดเจน
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div className="pt-2 pb-1 space-y-3">
            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>

            {isLoading && (
              <p className="text-xs text-sky-700 animate-pulse font-medium">
                กำลังตรวจสอบข้อมูลและเชื่อมต่อฟาร์ม...
              </p>
            )}

            {import.meta.env.DEV && (
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
                    หรือ สำหรับโหมดพัฒนา (Localhost)
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <button
                  type="button"
                  id="dev-login-btn"
                  onClick={handleDevLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>🌿</span>
                  <span>เข้าสู่ระบบทดสอบ (Somchai Demo Farm)</span>
                </button>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ข้อมูลฟาร์มของคุณถูกแยกเก็บเป็นส่วนตัว 100%</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 space-y-0.5">
        <p>บ่อดี (BODI) — ระบบจัดการฟาร์มสัตว์น้ำขนาดเล็ก</p>
        <p className="text-[11px] text-slate-400 font-mono">
          v{__APP_VERSION__} ({__COMMIT_HASH__})
        </p>
      </footer>
    </div>
  );
};
