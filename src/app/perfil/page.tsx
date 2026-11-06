'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ToonCard, ToonButton, ToonInput, ColorPicker, useToast } from '@/components/ui';
import { Avatar } from '@/components/toon/Avatar';
import { useProfileStore } from '@/lib/client/profile-store';
import { api, ApiError } from '@/lib/client/api';

export default function ProfilePage() {
  const { profile } = useProfileStore();

  return (
    <ProfileForm key={profile ? `${profile.name}-${profile.color}-${profile.profileId || 'local'}` : 'empty'} />
  );
}

function ProfileForm() {
  const { profile, setProfile, clearProfile } = useProfileStore();
  const { showToast } = useToast();

  const [name, setName] = useState(() => profile?.name || '');
  const [color, setColor] = useState(() => profile?.color || '#35B8F4');
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Modal de Código de Recuperação
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Aba / Modo de Recuperação
  const [showRecover, setShowRecover] = useState(false);
  const [recoverName, setRecoverName] = useState('');
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);

  // Checagem em tempo real com debounce
  useEffect(() => {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 16 || clean.toLowerCase() === profile?.name.toLowerCase()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await api.checkNameAvailability(clean);
        setIsAvailable(res.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [name, profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 16) {
      setError('O nome deve ter entre 2 e 16 caracteres');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (profile?.deviceToken) {
        // Atualiza perfil existente via PATCH
        const res = await api.updateProfile(profile.deviceToken, {
          name: cleanName,
          color,
        });
        setProfile(res.name, res.color, res.profileId, profile.deviceToken);
        showToast('Perfil atualizado com sucesso!', 'success');
      } else {
        // Cria perfil novo via POST
        const res = await api.createProfile({
          name: cleanName,
          color,
        });
        setProfile(res.name, res.color, res.profileId, res.deviceToken);
        setNewRecoveryCode(res.recoveryCode);
        showToast('Perfil registrado na Arena FDP! 🌟', 'success');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('Esse nome já foi pego por outro guerreiro! Escolha outro.');
        } else {
          setError(err.message || 'Erro ao registrar perfil');
        }
      } else {
        // Se falhar rede ou estiver sem Supabase configurado, salva localmente
        setProfile(cleanName, color);
        showToast('Perfil salvo localmente neste aparelho!', 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverLoading(true);
    setError('');

    try {
      const res = await api.recoverProfile({
        name: recoverName.trim(),
        recoveryCode: recoverCode.trim().toUpperCase(),
      });

      setProfile(res.name, res.color, res.profileId, res.deviceToken);
      showToast('Perfil recuperado com sucesso! 🎉', 'success');
      setShowRecover(false);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message || 'Código ou nome incorreto', 'error');
      } else {
        showToast('Falha de conexão ao recuperar', 'error');
      }
    } finally {
      setRecoverLoading(false);
    }
  };

  const handleClear = () => {
    clearProfile();
    setName('');
    setColor('#35B8F4');
    setError('');
    showToast('Perfil limpo neste aparelho!', 'info');
  };

  const handleCopyCode = () => {
    if (newRecoveryCode) {
      navigator.clipboard.writeText(newRecoveryCode).then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-4 max-w-md mx-auto w-full gap-5">
      <div className="w-full text-center">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Meu Perfil Toon
        </h1>
        <p className="text-xs text-[#666666] font-semibold mt-1">
          Identidade única em toda a Arena FDP
        </p>
      </div>

      {/* Pré-visualização do Avatar */}
      <div className="flex flex-col items-center p-4 bg-[#F5F5F5] rounded-[18px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] w-full">
        <Avatar name={name || 'Seu Nome'} color={color} size="lg" />
      </div>

      {/* Formulário Principal de Perfil */}
      {!showRecover ? (
        <ToonCard padding="md" className="w-full">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <ToonInput
                label="Seu Apelido Global"
                placeholder="Ex: Pato Maluco"
                value={name}
                maxLength={16}
                showCount
                error={error}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsAvailable(null);
                  if (error) setError('');
                }}
              />
              <div className="mt-1 text-xs">
                {isChecking && <span className="text-gray-500 font-bold">Verificando disponibilidade...</span>}
                {!isChecking && isAvailable === true && (
                  <span className="text-green-600 font-bold">✓ Apelido disponível!</span>
                )}
                {!isChecking && isAvailable === false && (
                  <span className="text-red-600 font-bold">✕ Este apelido já está em uso na Arena</span>
                )}
              </div>
            </div>

            <ColorPicker
              selectedColor={color}
              onSelectColor={setColor}
            />

            <div className="flex gap-2.5 mt-2">
              <ToonButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Salvando...' : '💾 Salvar Perfil'}
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

            <div className="pt-2 border-t-2 border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setShowRecover(true)}
                className="text-xs font-bold text-toon-blue hover:underline cursor-pointer"
              >
                Já tem um perfil em outro aparelho? Clique para recuperar 🔑
              </button>
            </div>
          </form>
        </ToonCard>
      ) : (
        /* Formulário de Recuperação de Perfil */
        <ToonCard padding="md" className="w-full space-y-4">
          <div className="text-center">
            <h3 className="font-cartoon text-xl text-black">Recuperar Perfil</h3>
            <p className="text-xs text-gray-600">
              Digite seu apelido original e o código de recuperação gerado quando você criou o perfil.
            </p>
          </div>

          <form onSubmit={handleRecover} className="space-y-4">
            <ToonInput
              label="Seu Apelido"
              placeholder="Ex: Capivara Ninja"
              value={recoverName}
              onChange={(e) => setRecoverName(e.target.value)}
              required
            />

            <ToonInput
              label="Código de Recuperação (XXXX-XXXX)"
              placeholder="Ex: 8X2K-9P4M"
              value={recoverCode}
              onChange={(e) => setRecoverCode(e.target.value)}
              required
            />

            <div className="flex gap-2">
              <ToonButton
                type="button"
                variant="secondary"
                onClick={() => setShowRecover(false)}
                className="flex-1"
              >
                Cancelar
              </ToonButton>
              <ToonButton
                type="submit"
                variant="primary"
                disabled={recoverLoading}
                className="flex-1"
              >
                {recoverLoading ? 'Recuperando...' : '🔑 Recuperar'}
              </ToonButton>
            </div>
          </form>
        </ToonCard>
      )}

      {/* Modal de Exibição Única do Código de Recuperação */}
      {newRecoveryCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <ToonCard className="max-w-sm w-full p-6 text-center space-y-4">
            <div className="text-4xl">🔐</div>
            <h3 className="font-cartoon text-2xl text-black">GUARDE ESTE CÓDIGO!</h3>
            <p className="text-xs text-gray-700 font-bold">
              Este é o seu código de recuperação. Ele só será exibido <strong>UMA VEZ</strong>.
              Use-o se quiser acessar seu perfil em outro celular ou navegador!
            </p>

            <div className="p-3 bg-toon-yellow/20 border-2 border-black rounded-xl">
              <span className="font-cartoon text-3xl text-black tracking-widest select-all">
                {newRecoveryCode}
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <ToonButton variant="secondary" onClick={handleCopyCode} className="w-full">
                {codeCopied ? 'CÓDIGO COPIADO! ✓' : '📋 COPIAR CÓDIGO'}
              </ToonButton>
              <ToonButton
                variant="primary"
                onClick={() => setNewRecoveryCode(null)}
                className="w-full"
              >
                ENTENDI E SALVEI! 👍
              </ToonButton>
            </div>
          </ToonCard>
        </div>
      )}

      <Link href="/" className="w-full">
        <ToonButton variant="secondary" size="md" fullWidth>
          ⬅ Voltar para o Início
        </ToonButton>
      </Link>
    </div>
  );
}
