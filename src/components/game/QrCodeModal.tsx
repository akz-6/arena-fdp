'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ToonButton } from '../ui/ToonButton';
import { ToonCard } from '../ui/ToonCard';

interface QrCodeModalProps {
  url: string;
  code: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  url,
  code,
  isOpen,
  onClose,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && url) {
      QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#111111',
          light: '#FFFFFF',
        },
      })
        .then(setDataUrl)
        .catch((err) => console.error('Erro ao gerar QR Code:', err));
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm">
        <ToonCard className="text-center p-6 space-y-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h3 className="font-cartoon text-xl text-black">ENTRAR NA ARENA</h3>
            <button
              onClick={onClose}
              className="text-black hover:text-red-600 font-cartoon text-xl p-1"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-600">CÓDIGO DA SALA</p>
            <p className="font-cartoon text-3xl text-toon-blue tracking-widest">{code}</p>
          </div>

          <div className="flex justify-center p-2 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_#111111]">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={`QR Code para entrar na sala ${code}`} className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center font-cartoon text-sm text-gray-500">
                Gerando QR Code...
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600">
            Aponte a câmera do celular para entrar diretamente nesta sala!
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <ToonButton variant="secondary" onClick={handleCopy} className="w-full">
              {copied ? 'LINK COPIADO! ✓' : 'COPIAR LINK'}
            </ToonButton>
            <ToonButton variant="primary" onClick={onClose} className="w-full">
              FECHAR
            </ToonButton>
          </div>
        </ToonCard>
      </div>
    </div>
  );
};
