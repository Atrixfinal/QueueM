import apiClient from './client';
import type { CreateTokenPayload, Token, QueueStatus } from '@/lib/types/queue';

export async function createToken(payload: CreateTokenPayload) {
  const { data } = await apiClient.post('/tokens', payload);
  return data as { token: Token; estimated_wait_seconds: number };
}

export async function getQueueStatus(locationId: string, serviceId: string) {
  const { data } = await apiClient.get(`/tokens/status?locationId=${locationId}&serviceId=${serviceId}`);
  return data as QueueStatus;
}

export async function getUserTokens() {
  const { data } = await apiClient.get('/tokens/my-tokens');
  return data as Token[];
}
