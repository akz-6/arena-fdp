'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ToonButton, ToonInput, Sheet, useToast } from '@/components/ui';
import { Mascot } from '@/components/toon';

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Digite o código da sala!');
      return;
    }
    if (cleanCode.length < 4 || cleanCode.length > 8) {
      setJoinError('O código deve ter entre 4 e 8 letras/números');
      return;
    }

    setJoinError('');
    setIsJoinOpen(false);
    showToast(`Entrando na sala ${cleanCode}...`, 'info');
    router.push(`/sala/${cleanCode}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center text-center gap-6 py-2">
      {/* Elementos Decorativos Flutuantes (Cartas & Estrelas) */}
      <div className="relative w-full flex flex-col items-center">
        {/* Carta Flutuante Esquerda */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-14, -10, -14] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-2 top-0 sm:left-4 w-12 h-16 bg-white border-2 border-[#111111] rounded-[8px] shadow-[2px_2px_0px_#111111] flex flex-col items-center justify-center p-1 pointer-events-none select-none z-0"
        >
          <span className="text-xs font-bold text-[#FF3038]">♥</span>
          <span className="text-sm font-black text-[#111111]">A</span>
        </motion.div>

        {/* Carta Flutuante Direita */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [16, 20, 16] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-2 top-2 sm:right-4 w-12 h-16 bg-white border-2 border-[#111111] rounded-[8px] shadow-[2px_2px_0px_#111111] flex flex-col items-center justify-center p-1 pointer-events-none select-none z-0"
        >
          <span className="text-xs font-bold text-[#111111]">♠</span>
          <span className="text-sm font-black text-[#111111]">4</span>
        </motion.div>

        {/* LOGO OFICIAL ARENA FDP */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 260 }}
          className="relative w-44 h-44 sm:w-56 sm:h-56 mx-auto my-2 drop-shadow-[6px_6px_0px_#111111]"
        >
          <Image
            src="/logo.png"
            alt="Arena FDP Logo Oficial"
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Textos do Hero */}
        <div className="flex flex-col gap-1.5 px-2 mt-1">
          <h1 className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-heading)] text-[#111111] tracking-tight">
            ARENA <span className="text-[#35B8F4]">FDP</span>
          </h1>

          <p className="text-base sm:text-lg font-bold text-[#111111] font-[family-name:var(--font-heading)]">
            A partida só acaba quando sobra um.
          </p>

          <p className="text-xs sm:text-sm text-[#666666] font-medium max-w-sm mx-auto">
            Crie uma sala, reúna seus amigos e sobreviva até o final dessa loucura de cartas e golpes cartoon!
          </p>
        </div>
      </div>

      {/* Mascote Interativo da Home */}
      <div className="my-1">
        <Mascot size="sm" speech="Pronto pro golpe?" />
      </div>

      {/* Ações Principais da Home */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <Link href="/criar" className="w-full">
          <ToonButton variant="primary" size="lg" fullWidth>
            🎮 CRIAR SALA
          </ToonButton>
        </Link>

        <ToonButton
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => setIsJoinOpen(true)}
        >
          🔑 ENTRAR COM CÓDIGO
        </ToonButton>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <Link href="/perfil" className="w-full">
            <ToonButton variant="yellow" size="sm" fullWidth>
              👤 PERFIL
            </ToonButton>
          </Link>
          <Link href="/regras" className="w-full">
            <ToonButton variant="secondary" size="sm" fullWidth>
              📖 REGRAS
            </ToonButton>
          </Link>
        </div>
      </div>

      {/* Sheet para Entrar com Código */}
      <Sheet
        isOpen={isJoinOpen}
        onClose={() => {
          setIsJoinOpen(false);
          setJoinError('');
        }}
        title="Entrar em uma Sala"
        description="Digite o código de 6 caracteres compartilhado pelo host."
      >
        <form onSubmit={handleJoinRoom} className="flex flex-col gap-4 mt-2">
          <ToonInput
            label="Código da Sala"
            placeholder="Ex: ARENA1"
            value={roomCode}
            maxLength={8}
            showCount
            error={joinError}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              if (joinError) setJoinError('');
            }}
            autoFocus
          />

          <div className="flex gap-2 mt-2">
            <ToonButton
              type="button"
              variant="secondary"
              onClick={() => setIsJoinOpen(false)}
              className="flex-1"
            >
              Cancelar
            </ToonButton>
            <ToonButton type="submit" variant="primary" className="flex-1">
              Entrar
            </ToonButton>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
