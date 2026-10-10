import React, { useEffect, useRef, useState } from 'react';

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
