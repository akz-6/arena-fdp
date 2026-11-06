'use client';

import React, { useState } from 'react';
import {
  ToonButton,
  ToonCard,
  ToonInput,
  ColorPicker,
  Stepper,
  Switch,
  Segmented,
  Sheet,
  Badge,
  useToast,
} from '@/components/ui';
import { Mascot, SpeechBubble, Burst, Avatar, AvatarStatus } from '@/components/toon';

export default function DevUiClient() {
  const { showToast } = useToast();
  const [selectedColor, setSelectedColor] = useState('#35B8F4');
  const [stepperValue, setStepperValue] = useState(3);
  const [switchValue, setSwitchValue] = useState(true);
  const [segmentedValue, setSegmentedValue] = useState<'A' | 'B' | 'C'>('A');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="border-b-2 border-[#111111] pb-4">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Vitrine de Componentes Toon
        </h1>
        <p className="text-xs text-[#666666] font-bold uppercase tracking-wider mt-1">
          Rota de desenvolvimento /_dev/ui (404 em produção)
        </p>
      </div>

      {/* 1. ToonButton */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          1. Botões (ToonButton)
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          <ToonButton variant="primary">Primary (Preto)</ToonButton>
          <ToonButton variant="secondary">Secondary (Branco)</ToonButton>
          <ToonButton variant="danger">Danger (Vermelho)</ToonButton>
          <ToonButton variant="yellow">Yellow (Destaque)</ToonButton>
          <ToonButton variant="ghost">Ghost</ToonButton>
        </div>

        <div className="flex flex-wrap gap-2 items-center mt-2">
          <ToonButton size="sm" variant="primary">Small</ToonButton>
          <ToonButton size="md" variant="primary">Medium (48px)</ToonButton>
          <ToonButton size="lg" variant="primary">Large (56px)</ToonButton>
          <ToonButton isLoading variant="primary">Carregando</ToonButton>
          <ToonButton disabled variant="primary">Desabilitado</ToonButton>
        </div>
      </section>

      {/* 2. Badges */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          2. Badges / Etiquetas
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="host" />
          <Badge variant="online" />
          <Badge variant="playing" />
          <Badge variant="dead" />
          <Badge variant="winner" />
          <Badge variant="spectator" />
        </div>
      </section>

      {/* 3. ToonCard */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          3. Cards (ToonCard)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ToonCard rotate="none" padding="md">
            <h4 className="font-bold font-[family-name:var(--font-heading)]">Card Normal</h4>
            <p className="text-xs text-[#666666] mt-1">Fundo branco, contorno preto 2px, sombra sólida.</p>
          </ToonCard>
          <ToonCard rotate="left" padding="md">
            <h4 className="font-bold font-[family-name:var(--font-heading)]">Card Inclinado Esq.</h4>
            <p className="text-xs text-[#666666] mt-1">Leve rotação -1deg estilo carta física.</p>
          </ToonCard>
          <ToonCard rotate="right" interactive padding="md">
            <h4 className="font-bold font-[family-name:var(--font-heading)]">Card Interativo</h4>
            <p className="text-xs text-[#666666] mt-1">Passe o mouse ou toque para efeito hover.</p>
          </ToonCard>
        </div>
      </section>

      {/* 4. Form Controls */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          4. Entradas e Controles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ToonInput
            label="Apelido do Jogador"
            placeholder="Digite seu nome..."
            value={inputText}
            maxLength={16}
            showCount
            helperText="Entre 2 e 16 caracteres"
            onChange={(e) => setInputText(e.target.value)}
          />

          <ToonInput
            label="Campo com Erro"
            defaultValue="Nome Repetido"
            error="Esse nome já foi escolhido por outro jogador!"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <Stepper
            label="Vidas Iniciais"
            value={stepperValue}
            min={1}
            max={10}
            onChange={setStepperValue}
          />

          <Switch
            label="Vidas Visíveis"
            description="Exibe o contador de vidas para todos"
            checked={switchValue}
            onChange={setSwitchValue}
          />
        </div>

        <Segmented
          label="Modo de Jogo"
          value={segmentedValue}
          onChange={setSegmentedValue}
          options={[
            { label: 'Normal', value: 'A' },
            { label: 'Rápido', value: 'B' },
            { label: 'Caótico', value: 'C' },
          ]}
        />

        <ColorPicker
          selectedColor={selectedColor}
          takenColors={['#FF3038', '#111111']}
          onSelectColor={setSelectedColor}
        />
      </section>

      {/* 5. Toon & Personagens */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          5. Elementos Toon & Personagens
        </h2>

        <div className="flex flex-wrap items-center gap-6 justify-around bg-[#F5F5F5] p-6 rounded-[16px] border-2 border-[#111111]">
          <Mascot size="sm" speech="Olá humano!" />
          <Burst text="POW!" color="yellow" size="sm" />
          <Burst text="BANG!" color="red" size="sm" />
          <SpeechBubble position="bottom">Boa jogada!</SpeechBubble>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)]">
            Status do Avatar:
          </span>
          <div className="flex flex-wrap gap-2">
            {(['idle', 'hit', 'dead', 'win', 'away'] as AvatarStatus[]).map((st) => (
              <ToonButton
                key={st}
                size="sm"
                variant={avatarStatus === st ? 'primary' : 'secondary'}
                onClick={() => setAvatarStatus(st)}
              >
                {st}
              </ToonButton>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-6 justify-around bg-white p-6 rounded-[16px] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] mt-2">
            <Avatar
              name="Jogador 1"
              color={selectedColor}
              status={avatarStatus}
              size="sm"
              lives={3}
            />
            <Avatar
              name="Host Rei"
              color="#FFC233"
              status={avatarStatus}
              size="md"
              isHost
              lives={5}
            />
            <Avatar
              name="Gigante"
              color="#2ECC71"
              status={avatarStatus}
              size="lg"
              lives={null}
            />
          </div>
        </div>
      </section>

      {/* 6. Modais & Notificações */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          6. Sheet & Toasts
        </h2>
        <div className="flex flex-wrap gap-3">
          <ToonButton variant="primary" onClick={() => setIsSheetOpen(true)}>
            Abrir Sheet (Modal Inferior)
          </ToonButton>
          <ToonButton
            variant="secondary"
            onClick={() => showToast('Ação concluída com sucesso!', 'success')}
          >
            Toast Sucesso
          </ToonButton>
          <ToonButton
            variant="danger"
            onClick={() => showToast('Erro ao processar ação!', 'error')}
          >
            Toast Erro
          </ToonButton>
          <ToonButton
            variant="yellow"
            onClick={() => showToast('Atenção: rodada iniciando!', 'info')}
          >
            Toast Info
          </ToonButton>
        </div>

        <Sheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title="Modal Sheet Toon"
          description="Este modal desliza suavemente de baixo e fecha com ESC ou clique fora."
        >
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm text-[#111111] font-semibold">
              Componente acessível, animado com Framer Motion e contorno cartunesco.
            </p>
            <ToonButton
              variant="primary"
              fullWidth
              onClick={() => {
                setIsSheetOpen(false);
                showToast('Sheet confirmada!', 'success');
              }}
            >
              Confirmar
            </ToonButton>
          </div>
        </Sheet>
      </section>
    </div>
  );
}
