export interface Location {
  id: string;
  hospital_id?: string;
  name: string;
  address: string;
  type?: 'hospital' | 'bank' | 'govt';
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  api_endpoint?: string;
  is_active: boolean;
}

export type CrowdStatus = 'low' | 'medium' | 'high';

export interface LocationStatus {
  locationId: string;
  totalWaiting: number;
  estimatedWaitTime: number;
  activeCounters: number;
  crowdStatus: CrowdStatus;
}
