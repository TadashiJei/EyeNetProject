export type NetworkState = 'online' | 'offline' | 'degraded';

export interface NetworkMetrics {
  latency: number;
  packetLoss: number;
  status: NetworkState;
}

export interface BandwidthData {
  download: number;
  upload: number;
  timestamp: string;
}

export interface DepartmentUsage {
  name: string;
  usage: number;
}

export interface ApplicationUsage {
  name: string;
  type: string;
  bandwidth: number;
  status: 'normal' | 'high' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface MonitoringData {
  networkStatus: NetworkMetrics;
  bandwidth: BandwidthData;
  departments: DepartmentUsage[];
  applications: ApplicationUsage[];
}
