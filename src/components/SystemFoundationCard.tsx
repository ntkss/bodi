import React, { useState } from 'react';
import { Server, Database, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface HealthResponse {
  status: string;
  app: string;
  version: string;
  timezone: string;
  serverTime: string;
  database: {
    status?: string;
    configured?: boolean;
    error?: string | null;
  };
}

export const SystemFoundationCard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ Server API ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 mb-6 shadow-md border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Milestone 1 — App Foundation
            </h3>
            <p className="text-xs text-slate-300">
              สถาปัตยกรรมระบบ React + Vite + Tailwind + Prisma + Vercel
            </p>
          </div>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          type="button"
          className="self-start sm:self-center px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'กำลังตรวจสอบ...' : 'ทดสอบเรียก /api/health'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Frontend</span>
          </div>
          <span className="font-semibold text-slate-200">React 19 + Vite</span>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Design</span>
          </div>
          <span className="font-semibold text-slate-200">Tailwind CSS v4</span>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>ORM & DB</span>
          </div>
          <span className="font-semibold text-slate-200">PostgreSQL + Prisma</span>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>Deployment</span>
          </div>
          <span className="font-semibold text-slate-200">Vercel Serverless</span>
        </div>
      </div>

      {/* Health Response Display */}
      {healthData && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-medium mb-1">
            <span>
              ผลการเรียก API:{' '}
              {healthData.status === 'ok' ? 'เชื่อมต่อสำเร็จ' : 'สถานะผิดปกติ'}
            </span>
            <span>{healthData.serverTime}</span>
          </div>
          <div className="text-slate-300 space-y-0.5">
            <p>
              ระบบ: {healthData.app} ({healthData.version})
            </p>
            <p>เขตเวลา: {healthData.timezone}</p>
            <p>
              ฐานข้อมูล:{' '}
              {healthData.database?.configured
                ? 'กำหนดค่าเรียบร้อย (DATABASE_URL configured)'
                : healthData.database?.status || 'พร้อมใช้งานตามค่าคอนฟิก'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
