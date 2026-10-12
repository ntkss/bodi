import React, { useEffect } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-xl' (desktop only)
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  // Handle ESC key on desktop
  useEffect(() => {
    if (!isOpen || !isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDesktop, onClose]);

  // Prevent background scroll when open on desktop
  useEffect(() => {
    if (isOpen && isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isDesktop]);

  if (!isOpen) return null;

  // Desktop View: Centered Modal Dialog
  if (isDesktop) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`bg-white rounded-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col ${maxWidth} transform transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain pr-1 -mr-1">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Mobile View: Touch-friendly Vaul Bottom Sheet
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-20 flex max-h-[92vh] flex-col rounded-t-[28px] bg-white border-t border-slate-200 shadow-2xl outline-none">
          {/* Accessible hidden title for screen readers */}
          <Drawer.Title className="sr-only">
            {typeof title === 'string' ? title : 'แบบฟอร์ม'}
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            แบบฟอร์มบันทึกข้อมูล
          </Drawer.Description>

          {/* Drag Handle Bar */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          {/* Sheet Header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-slate-100 shrink-0">
            <div>
              <div className="text-lg font-bold text-slate-900">{title}</div>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-safe pb-8">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
