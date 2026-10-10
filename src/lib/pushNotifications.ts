/**
 * Web Push and Notification Helper for BODI PWA
 */

export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Registers the Service Worker for PWA offline capabilities and Push Notifications
 */
export async function registerBodiServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Requests Notification permission from the user
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      // Send welcoming confirmation notification
      await sendBodiNotification({
        title: '🔔 บ่อดี: เปิดการแจ้งเตือนสำเร็จ',
        body: 'ระบบพร้อมแจ้งเตือนสภาวะออกซิเจนต่ำ ค่า pH และสุขภาพสัตว์น้ำในฟาร์มของคุณ',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

/**
 * Dispatches a notification via Service Worker or fallback Notification constructor
 */
export async function sendBodiNotification(
  options: NotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await (reg.showNotification as (title: string, options?: unknown) => Promise<void>)(
        options.title,
        {
          body: options.body,
          icon: options.icon || '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200],
          tag: options.tag || 'bodi-alert',
        }
      );
      return true;
    }

    new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.svg',
    });
    return true;
  } catch (err) {
    console.error('Failed to trigger notification:', err);
    return false;
  }
}
