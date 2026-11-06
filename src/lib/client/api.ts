import {
  CreateProfileRequest,
  CreateProfileResponse,
  RecoverProfileRequest,
  RecoverProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  CheckProfileResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomStateResponse,
  RoomActionResponse,
  ApiErrorResponse,
} from '../contracts';
import { GameAction } from '../engine/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.error || `Erro HTTP ${res.status}`,
      res.status,
      errorData.code,
      errorData.details
    );
  }
  return data as T;
}

export const api = {
  // --- PERFIL ---
  async createProfile(req: CreateProfileRequest): Promise<CreateProfileResponse> {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<CreateProfileResponse>(res);
  },

  async updateProfile(token: string, req: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    });
    return handleResponse<UpdateProfileResponse>(res);
  },

  async recoverProfile(req: RecoverProfileRequest): Promise<RecoverProfileResponse> {
    const res = await fetch('/api/profile/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<RecoverProfileResponse>(res);
  },

  async checkNameAvailability(name: string): Promise<CheckProfileResponse> {
    const res = await fetch(`/api/profile/check?name=${encodeURIComponent(name)}`);
    return handleResponse<CheckProfileResponse>(res);
  },

  // --- SALAS ---
  async createRoom(req: CreateRoomRequest): Promise<CreateRoomResponse> {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<CreateRoomResponse>(res);
  },

  async joinRoom(code: string, req: JoinRoomRequest): Promise<JoinRoomResponse> {
    const res = await fetch(`/api/rooms/${code.toUpperCase()}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<JoinRoomResponse>(res);
  },

  async getRoomState(code: string, token?: string | null): Promise<RoomStateResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`/api/rooms/${code.toUpperCase()}/state`, {
      headers,
    });
    return handleResponse<RoomStateResponse>(res);
  },

  async sendRoomAction(
    code: string,
    token: string,
    action: GameAction
  ): Promise<RoomActionResponse> {
    const res = await fetch(`/api/rooms/${code.toUpperCase()}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
    return handleResponse<RoomActionResponse>(res);
  },
};

export { ApiError };
