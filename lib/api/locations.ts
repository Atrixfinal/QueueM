import apiClient from './client';
import type { Location, LocationStatus } from '@/lib/types/location';

export async function getLocations() {
  const { data } = await apiClient.get('/locations');
  return data as Location[];
}

export async function getLocationStatus(locationId: string) {
  const { data } = await apiClient.get(`/locations/${locationId}/status`);
  return data as LocationStatus;
}
