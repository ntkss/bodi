import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Load Google Identity Services script
  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Identity Services SDK');
      if (onError) onError();
    };
    document.body.appendChild(script);

    return () => {
      // Keep script cached
    };
  }, [clientId, onError]);

  // Render Google button once script and DOM are ready
  useEffect(() => {
    if (
      !scriptLoaded ||
      !clientId ||
      !buttonRef.current ||
      !window.google?.accounts?.id
    ) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else if (onError) {
            onError();
          }
        },
      });

      // Clear previous button if any
      buttonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 280,
        locale: 'th',
      });
    } catch (err) {
      console.error('Failed to render Google button:', err);
    }
  }, [scriptLoaded, clientId, onSuccess, onError]);

  if (!clientId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm space-y-3">
        <div className="flex items-start gap-2.5 text-amber-900">
          <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-950">
              ยังไม่ได้ตั้งค่า Google Client ID
            </h4>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              กรุณาระบุ{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
                VITE_GOOGLE_CLIENT_ID
              </code>{' '}
              ในไฟล์{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> และ
              Vercel Project Settings
            </p>
          </div>
        </div>

        <div className="bg-white/80 border border-amber-200/60 rounded-lg p-3 text-xs text-slate-700 space-y-1.5">
          <p className="font-medium text-slate-900">ขั้นตอนรับ Google Client ID ฟรี:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>เข้า Google Cloud Console → เมนู Credentials</li>
            <li>สร้าง OAuth 2.0 Client ID (Web Application)</li>
            <li>
              ใส่ Authorized JavaScript origins:
              <span className="block font-mono text-[11px] text-sky-700 ml-4 mt-0.5">
                • https://bodi-farm.vercel.app
                <br />• http://localhost:5173
              </span>
            </li>
            <li>นำ Client ID มาใส่ในตัวแปรระบบ</li>
          </ol>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-medium mt-2 pt-1"
          >
            เปิด Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[44px]">
      <div ref={buttonRef} className="flex justify-center" />
      {!scriptLoaded && (
        <div className="text-xs text-slate-500 animate-pulse py-2">
          กำลังโหลดปุ่ม Google Sign-In...
        </div>
      )}
    </div>
  );
};
