'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion, useMotionStore } from '@/lib/client/use-reduced-motion';

interface ScreenShakeContextValue {
  shake: (intensity?: 'light' | 'medium' | 'heavy') => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

const ScreenShakeContext = createContext<ScreenShakeContextValue | null>(null);

export const useShake = () => {
  const ctx = useContext(ScreenShakeContext);
  if (!ctx) {
    return {
      shake: () => {},
      isEnabled: true,
      setIsEnabled: () => {},
    };
  }
  return ctx;
};

export const ScreenShakeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isShaking, setIsShaking] = useState(false);
  const [intensityLevel, setIntensityLevel] = useState<'light' | 'medium' | 'heavy'>('medium');
  const { reducedMotion } = useReducedMotion();

  // Inicializa o listener de preferências
  useEffect(() => {
    useMotionStore.getState().init();
  }, []);

  const isEnabled = !reducedMotion;

  const shake = useCallback(
    (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (!isEnabled) return;
      setIntensityLevel(intensity);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    },
    [isEnabled]
  );

  const getShakeOffsets = () => {
    switch (intensityLevel) {
      case 'light':
        return [0, -3, 3, -2, 2, 0];
      case 'heavy':
        return [0, -10, 10, -7, 7, -4, 4, 0];
      case 'medium':
      default:
        return [0, -6, 6, -4, 4, -2, 2, 0];
    }
  };

  return (
    <ScreenShakeContext.Provider
      value={{
        shake,
        isEnabled,
        setIsEnabled: (enabled: boolean) => {
          useMotionStore.getState().setReducedMotion(!enabled);
        },
      }}
    >
      <motion.div
        animate={
          isShaking && isEnabled
            ? { x: getShakeOffsets(), y: getShakeOffsets().map((v) => v * 0.5) }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.3 }}
        className="w-full h-full min-h-screen"
      >
        {children}
      </motion.div>
    </ScreenShakeContext.Provider>
  );
};
