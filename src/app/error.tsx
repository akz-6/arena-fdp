'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ToonCard } from '@/components/ui/ToonCard';
import { ToonButton } from '@/components/ui/ToonButton';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro capturado pelo ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <ToonCard className="max-w-md w-full p-8 space-y-6">
        <div className="text-6xl animate-pulse">🔨💥</div>
        <div className="space-y-2">
          <h2 className="font-cartoon text-3xl text-toon-red">
            UMA BIGORNA CAIU NO SERVIDOR!
          </h2>
          <p className="text-sm text-gray-600 font-bold">
            Aconteceu um imprevisto cartoon durante a partida.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <ToonButton
            variant="primary"
            size="lg"
            onClick={() => reset()}
            className="w-full text-xl"
          >
            TENTAR NOVAMENTE 🔄
          </ToonButton>
          <Link href="/" className="block">
            <ToonButton variant="secondary" className="w-full">
              Voltar ao Início
            </ToonButton>
          </Link>
        </div>
      </ToonCard>
    </div>
  );
}
