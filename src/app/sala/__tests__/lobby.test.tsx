import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LobbyView } from '@/components/game/LobbyView';
import { JoinRoomScreen } from '@/components/game/JoinRoomScreen';
import { QrCodeModal } from '@/components/game/QrCodeModal';
import { GameState, Player } from '@/lib/engine/types';

describe('LobbyView Component (Fase 6)', () => {
  const hostPlayer: Player = {
    id: 'p-host',
    name: 'Mestre da Mesa',
    color: '#FF3038',
    role: 'player',
    status: 'alive',
    joinOrder: 1,
  };

  const guestPlayer: Player = {
    id: 'p-guest',
    name: 'Pato Maluco',
    color: '#35B8F4',
    role: 'player',
    status: 'alive',
    joinOrder: 2,
  };

  const mockRoom: GameState = {
    version: 1,
    phase: 'lobby',
    config: {
      roomName: 'Grande Torneio FDP',
      lifeVisibility: 'visible',
      lifeMode: 'fixed',
      lifeFixed: 5,
      lifeMin: 3,
      lifeMax: 7,
      lifeRandomScope: 'individual',
      hostRole: 'player',
      showHitCount: true,
      expectedPlayers: null,
      maxCardsCap: null,
      decks: 'auto',
      operatorMode: false,
    },
    players: [hostPlayer, guestPlayer],
    hostId: hostPlayer.id,
    dealerId: null,
    roundNumber: 0,
    cardsThisRound: 1,
    direction: 'up',
    pendingDamage: {},
    confirmed: [],
    lastReveal: null,
    proposals: [],
    winners: null,
    seed: 12345,
  };

  it('renderiza o cabeçalho do lobby e a lista de guerreiros', () => {
    render(
      <LobbyView
        room={mockRoom}
        me={hostPlayer}
        isHost={true}
        connectionStatus="connected"
        onStartMatch={vi.fn()}
        onKickPlayer={vi.fn()}
        onLeaveRoom={vi.fn()}
      />
    );

    expect(screen.getByText('Grande Torneio FDP')).toBeInTheDocument();
    expect(screen.getByText('Mestre da Mesa')).toBeInTheDocument();
    expect(screen.getByText('Pato Maluco')).toBeInTheDocument();
    expect(screen.getByText('AO VIVO')).toBeInTheDocument();
  });

  it('habilita "INICIAR PARTIDA" para o host quando há 2 ou mais jogadores', () => {
    const onStart = vi.fn();
    render(
      <LobbyView
        room={mockRoom}
        me={hostPlayer}
        isHost={true}
        connectionStatus="connected"
        onStartMatch={onStart}
        onKickPlayer={vi.fn()}
        onLeaveRoom={vi.fn()}
      />
    );

    const startBtn = screen.getByRole('button', { name: /INICIAR PARTIDA/i });
    expect(startBtn).not.toBeDisabled();
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('desabilita "INICIAR PARTIDA" quando há apenas 1 jogador na sala', () => {
    const singlePlayerRoom = {
      ...mockRoom,
      players: [hostPlayer],
    };

    render(
      <LobbyView
        room={singlePlayerRoom}
        me={hostPlayer}
        isHost={true}
        connectionStatus="connected"
        onStartMatch={vi.fn()}
        onKickPlayer={vi.fn()}
        onLeaveRoom={vi.fn()}
      />
    );

    const startBtn = screen.getByRole('button', { name: /INICIAR PARTIDA/i });
    expect(startBtn).toBeDisabled();
    expect(screen.getByText(/pelo menos 2 jogadores/i)).toBeInTheDocument();
  });

  it('mostra mensagem de espera para jogadores que não são o host', () => {
    render(
      <LobbyView
        room={mockRoom}
        me={guestPlayer}
        isHost={false}
        connectionStatus="connected"
        onStartMatch={vi.fn()}
        onKickPlayer={vi.fn()}
        onLeaveRoom={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Aguardando o Organizador iniciar a partida/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /INICIAR PARTIDA/i })).not.toBeInTheDocument();
  });

  it('permite que o host expulse jogadores da sala com confirmação', () => {
    const onKick = vi.fn();
    render(
      <LobbyView
        room={mockRoom}
        me={hostPlayer}
        isHost={true}
        connectionStatus="connected"
        onStartMatch={vi.fn()}
        onKickPlayer={onKick}
        onLeaveRoom={vi.fn()}
      />
    );

    const kickBtn = screen.getByTitle('Expulsar jogador');
    expect(kickBtn).toBeInTheDocument();
    fireEvent.click(kickBtn);

    expect(screen.getByText(/EXPULSAR JOGADOR\?/i)).toBeInTheDocument();
    const confirmKickBtn = screen.getByRole('button', { name: /EXPULSAR!/i });
    fireEvent.click(confirmKickBtn);

    expect(onKick).toHaveBeenCalledWith(guestPlayer.id);
  });
});

describe('JoinRoomScreen Component (Fase 6)', () => {
  it('exibe campo de senha quando a sala é protegida', () => {
    render(
      <JoinRoomScreen
        code="TEST66"
        roomName="Sala Protegida"
        hasPassword={true}
        playerCount={2}
        status="lobby"
        onJoined={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Senha da Sala/i)).toBeInTheDocument();
    expect(screen.getByText('TEST66')).toBeInTheDocument();
  });

  it('exibe aviso quando a partida já começou (entrada como espectador)', () => {
    render(
      <JoinRoomScreen
        code="TEST77"
        roomName="Partida Rolando"
        hasPassword={false}
        playerCount={3}
        status="playing"
        onJoined={vi.fn()}
      />
    );

    expect(screen.getByText(/entrará como/i)).toBeInTheDocument();
    expect(screen.getByText(/Espectador/i)).toBeInTheDocument();
  });
});

describe('QrCodeModal Component (Fase 6)', () => {
  it('renderiza o modal quando isOpen é true', () => {
    render(
      <QrCodeModal
        url="http://localhost:3000/sala/ABCD99"
        code="ABCD99"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('ENTRAR NA ARENA')).toBeInTheDocument();
    expect(screen.getByText('ABCD99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COPIAR LINK/i })).toBeInTheDocument();
  });
});
