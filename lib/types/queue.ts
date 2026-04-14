export interface Token {
  id: string;
  user_id?: string;
  temp_user_id?: string;
  location_id: string;
  service_id: string;
  hospital_id?: string;
  token_number: number;
  status: 'waiting' | 'serving' | 'completed' | 'skipped';
  assigned_counter_id?: string;
  priority: 'normal' | 'high';
  category?: 'emergency' | 'vip' | 'regular';
  specialty?: string;
  estimated_wait_seconds?: number;
  position?: number;
  estimatedWaitTime?: number;
  number?: number;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QueueStatus {
  totalWaiting: number;
  estimatedWaitTime: number;
  activeCounters: number;
  currentToken?: Token;
}

export interface CreateTokenPayload {
  locationId: string;
  serviceId: string;
  priority?: 'normal' | 'high';
  category?: 'emergency' | 'vip' | 'regular';
  specialty?: string;
  hospitalId?: string;
}
