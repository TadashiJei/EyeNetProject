import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { 
  NetworkController, 
  NetworkDevice, 
  NetworkFlow, 
  NetworkStats,
  QoSPolicy 
} from '../../interfaces/networkController';

export class PfSenseController implements NetworkController {
  private client: AxiosInstance;

  constructor(config: {
    host: string;
    apiKey: string;
    apiSecret: string;
    verifySsl?: boolean;
  }) {
    this.client = axios.create({
      baseURL: `https://${config.host}/api/v1`,
      headers: {
        'Authorization': this.generateAuthHeader(config.apiKey, config.apiSecret),
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.verifySsl ?? false
      })
    });
  }

  private generateAuthHeader(key: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Buffer.from(Math.random().toString()).toString('base64');
    const signature = this.generateSignature(key, secret, timestamp, nonce);
    return `PFSense ${key}:${timestamp}:${nonce}:${signature}`;
  }

  private generateSignature(key: string, secret: string, timestamp: number, nonce: string): string {
    const crypto = require('crypto');
    const data = `${key}${timestamp}${nonce}`;
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  async connect(): Promise<void> {
    try {
      await this.client.get('/system/status');
    } catch (error) {
      console.error('Failed to connect to pfSense:', error);
      throw new Error('Connection failed');
    }
  }

  async disconnect(): Promise<void> {
    // Nothing to do for REST client
  }

  async getDevices(): Promise<NetworkDevice[]> {
    try {
      const response = await this.client.get('/interface');
      return response.data.data.map((iface: any) => ({
        id: iface.if,
        name: iface.descr || iface.if,
        type: 'pfSense Interface',
        ipAddress: iface.ipaddr || 'unknown',
        status: iface.enable ? 'online' : 'offline',
        lastSeen: new Date()
      }));
    } catch (error) {
      console.error('Failed to get interfaces from pfSense:', error);
      throw error;
    }
  }

  async getFlows(): Promise<NetworkFlow[]> {
    try {
      const response = await this.client.get('/diagnostics/states');
      return response.data.data.map((state: any) => ({
        id: `${state.src}:${state.sport}-${state.dst}:${state.dport}`,
        sourceIp: state.src,
        destinationIp: state.dst,
        sourcePort: parseInt(state.sport),
        destinationPort: parseInt(state.dport),
        protocol: state.proto,
        bytesTransferred: parseInt(state.bytes) || 0,
        packetsTransferred: parseInt(state.packets) || 0,
        startTime: new Date(state.creation * 1000),
        endTime: state.expires ? new Date((state.creation + state.expires) * 1000) : undefined
      }));
    } catch (error) {
      console.error('Failed to get states from pfSense:', error);
      throw error;
    }
  }

  async getStats(): Promise<NetworkStats> {
    try {
      const [interfaceStats, states] = await Promise.all([
        this.client.get('/interface/stats'),
        this.client.get('/diagnostics/states/summary')
      ]);

      const stats: NetworkStats = {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
        activeConnections: states.data.total || 0,
        timestamp: new Date()
      };

      interfaceStats.data.data.forEach((iface: any) => {
        stats.bytesIn += parseInt(iface.inbytes) || 0;
        stats.bytesOut += parseInt(iface.outbytes) || 0;
        stats.packetsIn += parseInt(iface.inpkts) || 0;
        stats.packetsOut += parseInt(iface.outpkts) || 0;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get statistics from pfSense:', error);
      throw error;
    }
  }

  async applyQoSPolicy(policy: QoSPolicy): Promise<void> {
    try {
      const qosRule = {
        interface: policy.targetDevice,
        enabled: true,
        bandwidth: {
          min: policy.bandwidth.min,
          max: policy.bandwidth.max
        },
        priority: policy.priority,
        protocol: policy.protocol || 'any',
        description: policy.name,
        schedulertype: 'PRIQ',
        ackqueue: true,
        defaultqueue: false
      };

      await this.client.post('/firewall/traffic_shaper/queue', qosRule);
    } catch (error) {
      console.error('Failed to apply QoS policy to pfSense:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/system/status');
      return true;
    } catch (error) {
      return false;
    }
  }
}
