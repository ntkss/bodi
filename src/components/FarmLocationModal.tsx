import React, { useState, useEffect } from 'react';
import { Navigation, Save, Loader2, Info } from 'lucide-react';
import { getCurrentCoordinates } from '../lib/location';
import { FarmProfile } from '../context/AuthContext';
import { BottomSheet } from './BottomSheet';

interface FarmLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm: FarmProfile | null;
  onSave: (data: {
    province?: string;
    district?: string;
    subdistrict?: string;
    latitude?: number | null;
    longitude?: number | null;
    waterSourceCanal?: string;
    tidalInfluence?: string;
    waterPathNotes?: string;
  }) => Promise<void>;
}

export const FarmLocationModal: React.FC<FarmLocationModalProps> = ({
  isOpen,
  onClose,
  farm,
  onSave,
}) => {
  const [province, setProvince] = useState(farm?.province || 'สมุทรสงคราม');
  const [district, setDistrict] = useState(farm?.district || '');
  const [subdistrict, setSubdistrict] = useState(farm?.subdistrict || '');
  const [latitude, setLatitude] = useState<string>(
    farm?.latitude != null ? String(farm.latitude) : ''
  );
  const [longitude, setLongitude] = useState<string>(
    farm?.longitude != null ? String(farm.longitude) : ''
  );
  const [waterSourceCanal, setWaterSourceCanal] = useState(farm?.waterSourceCanal || '');
  const [tidalInfluence, setTidalInfluence] = useState(farm?.tidalInfluence || 'DIRECT');
  const [waterPathNotes, setWaterPathNotes] = useState(farm?.waterPathNotes || '');

  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (farm) {
      setProvince(farm.province || 'สมุทรสงคราม');
      setDistrict(farm.district || '');
      setSubdistrict(farm.subdistrict || '');
      setLatitude(farm.latitude != null ? String(farm.latitude) : '');
      setLongitude(farm.longitude != null ? String(farm.longitude) : '');
      setWaterSourceCanal(farm.waterSourceCanal || '');
      setTidalInfluence(farm.tidalInfluence || 'DIRECT');
      setWaterPathNotes(farm.waterPathNotes || '');
    }
  }, [farm, isOpen]);

  if (!isOpen) return null;

  const handleGetGps = async () => {
    setIsGettingGps(true);
    setGpsError(null);
    try {
      const pos = await getCurrentCoordinates();
      setLatitude(pos.latitude.toFixed(6));
      setLongitude(pos.longitude.toFixed(6));
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'ไม่สามารถดึงพิกัดได้');
    } finally {
      setIsGettingGps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        province: province.trim() || 'สมุทรสงคราม',
        district: district.trim() || undefined,
        subdistrict: subdistrict.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        waterSourceCanal: waterSourceCanal.trim() || undefined,
        tidalInfluence,
        waterPathNotes: waterPathNotes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ที่ตั้งฟาร์มและข้อมูลทางน้ำธรรมชาติ"
      subtitle="กำหนดพิกัดและคลองเชื่อมโยงเพื่อจับคู่สถานีอ้างอิงสภาพแวดล้อม"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex gap-2.5 text-xs text-amber-900 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              หากไม่มีพิกัดแน่ชัด ระบบจะไม่คาดเดาพิกัดเอง
              แต่จะใช้พื้นที่จังหวัดสมุทรสงครามเป็นสถานีอ้างอิงกว้างๆ
              ข้อมูลระดับน้ำปากอ่าวเป็นค่าทำนายทางดาราศาสตร์
              ไม่ใช่ระดับน้ำจริงในคลองของท่าน
            </p>
          </div>

          {/* Administrative Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จังหวัด
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="สมุทรสงคราม"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อำเภอ
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="เมืองสมุทรสงคราม"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตำบล
              </label>
              <input
                type="text"
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="ลาดใหญ่"
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                พิกัดฟาร์ม (WGS84 Coordinates)
              </label>
              <button
                type="button"
                onClick={handleGetGps}
                disabled={isGettingGps}
                className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-800 font-medium bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {isGettingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>ดึงพิกัดจาก GPS เครื่อง</span>
              </button>
            </div>

            {gpsError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                {gpsError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  placeholder="ละติจูด (e.g. 13.4098)"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  placeholder="ลองจิจูด (e.g. 99.9965)"
                />
              </div>
            </div>
          </div>

          {/* Water Source & Canal Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อคลองส่งน้ำธรรมชาติที่เชื่อมกับแปลงเลี้ยง
              </label>
              <input
                type="text"
                value={waterSourceCanal}
                onChange={(e) => setWaterSourceCanal(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                placeholder="เช่น คลองสุนทรวิจิตร, คลองแม่กลอง, คลองโคน"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อิทธิพลน้ำขึ้น-น้ำลงจากปากอ่าว/ทะเล
              </label>
              <select
                value={tidalInfluence}
                onChange={(e) => setTidalInfluence(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                <option value="DIRECT">น้ำขึ้น-น้ำลงโดยตรง (ใกล้ปากอ่าว/ทะเล)</option>
                <option value="INDIRECT">
                  มีอิทธิพลทางอ้อม (มีประตูน้ำทด/ระยะห่างคลอง)
                </option>
                <option value="NONE">ไม่มีอิทธิพลน้ำขึ้น-น้ำลง (น้ำจืด/บ่อบาดาล)</option>
                <option value="UNKNOWN">ไม่แน่ชัด / ยังไม่ได้ระบุ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บันทึกลักษณะทางน้ำและระยะทาง (หมายเหตุ)
              </label>
              <textarea
                rows={2}
                value={waterPathNotes}
                onChange={(e) => setWaterPathNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden resize-none"
                placeholder="เช่น ห่างจากปากอ่าวประมาณ 3 กม. มีประตูท่อระบายน้ำเปิดรับน้ำช่วงน้ำเกิด 1-3 ค่ำ"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </BottomSheet>
  );
};
