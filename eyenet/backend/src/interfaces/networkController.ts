export interface NetworkDevice {
  id: string;
  name: string;
  type: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: Date;
}

export interface NetworkFlow {
  id: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  bytesTransferred: number;
  packetsTransferred: number;
  startTime: Date;
  endTime?: Date;
}

export interface NetworkStats {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  activeConnections: number;
  timestamp: Date;
}

export interface NetworkController {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getDevices(): Promise<NetworkDevice[]>;
  getFlows(): Promise<NetworkFlow[]>;
  getStats(): Promise<NetworkStats>;
  applyQoSPolicy(policy: QoSPolicy): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface QoSPolicy {
  id: string;
  name: string;
  targetDevice: string;
  bandwidth: {
    min: number;
    max: number;
  };
  priority: number;
  protocol?: string;
  ports?: number[];
}
