'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Fecha com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay Escuro com blur leve */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Conteúdo do Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[24px] border-t-4 sm:border-4 border-[#111111] shadow-[0_-8px_0px_#111111] sm:shadow-[8px_8px_0px_#111111] p-6 max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Barra puxadora no mobile */}
            <div className="w-12 h-1.5 bg-[#111111]/30 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Cabeçalho do Sheet */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {title && (
                  <h3 className="text-xl sm:text-2xl font-black text-[#111111] font-[family-name:var(--font-heading)]">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-[#666666] font-medium mt-1">
                    {description}
                  </p>
                )}
              </div>

              {/* Botão Fechar */}
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F5F5] hover:bg-[#FF3038] hover:text-white text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] transition-all cursor-pointer font-black text-lg select-none shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Corpo */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
