export interface AdminMetrics {
  totalWaiting: number;
  averageWaitTime: number;
  activeCounters: number;
  totalTokensServed: number;
}

export interface AnalyticsData {
  date: string;
  averageWaitTime: number;
  tokensServed: number;
  activeCounters: number;
}

export interface LocationAnalytics {
  locationId: string;
  locationName: string;
  totalTokensServed: number;
  averageWaitTime: number;
  totalWaiting: number;
  activeCounters: number;
  peakHour: string;
}
