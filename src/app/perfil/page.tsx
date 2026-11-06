'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ToonCard, ToonButton, ToonInput, ColorPicker, useToast } from '@/components/ui';
import { Avatar } from '@/components/toon/Avatar';
import { useProfileStore } from '@/lib/client/profile-store';

export default function ProfilePage() {
  const { profile } = useProfileStore();

  return (
    <ProfileForm key={profile ? `${profile.name}-${profile.color}` : 'empty'} />
  );
}

function ProfileForm() {
  const { profile, setProfile, clearProfile } = useProfileStore();
  const { showToast } = useToast();

  const [name, setName] = useState(() => profile?.name || '');
  const [color, setColor] = useState(() => profile?.color || '#35B8F4');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 16) {
      setError('O nome deve ter entre 2 e 16 caracteres');
      return;
    }

    setError('');
    setProfile(cleanName, color);
    showToast('Perfil salvo com sucesso!', 'success');
  };

  const handleClear = () => {
    clearProfile();
    setName('');
    setColor('#35B8F4');
    setError('');
    showToast('Perfil limpo!', 'info');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-4 max-w-md mx-auto w-full gap-5">
      <div className="w-full text-center">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Meu Perfil Toon
        </h1>
        <p className="text-xs text-[#666666] font-semibold mt-1">
          Seu personagem padrão para as partidas da Arena FDP
        </p>
      </div>

      {/* Pré-visualização do Avatar */}
      <div className="flex flex-col items-center p-4 bg-[#F5F5F5] rounded-[18px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] w-full">
        <Avatar name={name || 'Seu Nome'} color={color} size="lg" />
      </div>

      {/* Formulário de Perfil */}
      <ToonCard padding="md" className="w-full">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <ToonInput
            label="Seu Apelido"
            placeholder="Ex: Pato Maluco"
            value={name}
            maxLength={16}
            showCount
            error={error}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
          />

          <ColorPicker
            selectedColor={color}
            onSelectColor={setColor}
          />

          <div className="flex gap-2.5 mt-2">
            <ToonButton type="submit" variant="primary" className="flex-1">
              💾 Salvar Perfil
            </ToonButton>
            {profile && (
              <ToonButton
                type="button"
                variant="ghost"
                onClick={handleClear}
                className="text-xs font-bold text-[#FF3038] hover:bg-[#FF3038]/10"
              >
                Limpar
              </ToonButton>
            )}
          </div>
        </form>
      </ToonCard>

      {/* Aviso sobre Modo Online */}
      <div className="w-full p-3.5 bg-[#FFC233]/20 border-2 border-[#111111] rounded-[14px] shadow-[2px_2px_0px_#111111] flex items-start gap-2.5 text-xs text-[#111111] font-medium">
        <span className="text-base select-none">💡</span>
        <p>
          <strong>Modo Local:</strong> Seu perfil fica salvo neste aparelho.
          A garantia de nome único em todo o site e o código de recuperação serão ativados com o modo online!
        </p>
      </div>

      <Link href="/" className="w-full">
        <ToonButton variant="secondary" size="md" fullWidth>
          ⬅ Voltar para o Início
        </ToonButton>
      </Link>
    </div>
  );
}
