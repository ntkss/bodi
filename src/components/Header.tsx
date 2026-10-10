import React from 'react';
import { Waves, Calendar } from 'lucide-react';
import { formatThaiDate } from '../lib/date';

interface HeaderProps {
  farmName: string;
}

export const Header: React.FC<HeaderProps> = ({ farmName }) => {
  const todayStr = formatThaiDate(new Date());

  return (
    <header className="bg-sky-700 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-sky-700 flex items-center justify-center shadow-inner flex-shrink-0">
              <Waves className="w-7 h-7 text-sky-600 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-none">
                  บ่อดี
                </h1>
                <span className="text-xs font-semibold uppercase tracking-wider bg-sky-800 text-sky-200 px-2 py-0.5 rounded border border-sky-600">
                  BODI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-sky-100 font-light mt-0.5">
                รู้ทันบ่อ ดูแลง่าย ขายได้ราคา
              </p>
            </div>
          </div>

          {/* Farm & Date Context */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm bg-sky-800/80 sm:bg-transparent p-2 sm:p-0 rounded-lg">
            <div className="text-left sm:text-right">
              <span className="block font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                {farmName}
              </span>
              <div className="flex items-center sm:justify-end gap-1.5 text-sky-200 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayStr}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
