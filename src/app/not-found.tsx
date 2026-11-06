import React from 'react';
import Link from 'next/link';
import { ToonCard } from '@/components/ui/ToonCard';
import { ToonButton } from '@/components/ui/ToonButton';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <ToonCard className="max-w-md w-full p-8 space-y-6">
        <div className="text-6xl animate-bounce">🃏💥</div>
        <div className="space-y-2">
          <h1 className="font-cartoon text-5xl text-black">404</h1>
          <h2 className="font-cartoon text-2xl text-toon-red">
            PÁGINA FORA DA ARENA!
          </h2>
          <p className="text-sm text-gray-600 font-bold">
            Essa carta não existe no baralho ou o jogador foi arremessado para longe da mesa.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <ToonButton variant="primary" size="lg" className="w-full text-xl">
              VOLTAR PARA O LOBBY 🏠
            </ToonButton>
          </Link>
        </div>
      </ToonCard>
    </div>
  );
}
