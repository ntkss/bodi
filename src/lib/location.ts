export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Retrieves current device GPS position with high accuracy
 */
export async function getCurrentCoordinates(): Promise<GeoLocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่ง (Geolocation)'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let msg = 'ไม่สามารถดึงตำแหน่งพิกัดได้';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'กรุณาอนุญาตให้เข้าถึงตำแหน่งที่ตั้ง (Location Permission) ในเบราว์เซอร์';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'ไม่พบสัญญาณ GPS หรือข้อมูลตำแหน่งในขณะนี้';
        } else if (error.code === error.TIMEOUT) {
          msg = 'การดึงตำแหน่งหมดเวลา กรุณาลองใหม่อีกครั้ง';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Formats coordinates for clean Thai aquaculture display
 * e.g. "13.5241, 100.7812"
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Returns Google Maps link for the pond or sample location
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
