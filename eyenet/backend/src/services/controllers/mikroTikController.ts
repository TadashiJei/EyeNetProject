import { 
  NetworkController, 
  NetworkDevice, 
  NetworkFlow, 
  NetworkStats,
  QoSPolicy 
} from '../../interfaces/networkController';

// Import RouterOS API as a dynamic require to handle its CommonJS module
const RouterOSAPI = require('node-routeros').RouterOSAPI;

export class MikroTikController implements NetworkController {
  private client: any;
  private config: {
    host: string;
    port: number;
    username: string;
    password: string;
  };

  constructor(config: {
    host: string;
    port: number;
    username: string;
    password: string;
  }) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.client = new RouterOSAPI({
        host: this.config.host,
        user: this.config.username,
        password: this.config.password,
        port: this.config.port
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to MikroTik router:', error);
      throw new Error('Connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }

  async getDevices(): Promise<NetworkDevice[]> {
    try {
      const interfaces = await this.executeCommand('/interface/print');
      
      return interfaces.map((iface: any) => ({
        id: iface['.id'],
        name: iface.name,
        type: iface.type,
        ipAddress: this.getInterfaceIp(iface.name),
        status: iface.running ? 'online' : 'offline',
        lastSeen: new Date()
      }));
    } catch (error) {
      console.error('Failed to get interfaces from MikroTik:', error);
      throw error;
    }
  }

  private async getInterfaceIp(interfaceName: string): Promise<string> {
    try {
      const addresses = await this.executeCommand('/ip/address/print', {
        '?interface': interfaceName
      });
      return addresses[0]?.address?.split('/')[0] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async getFlows(): Promise<NetworkFlow[]> {
    try {
      const connections = await this.executeCommand('/ip/firewall/connection/print');
      
      return connections.map((conn: any) => ({
        id: conn['.id'],
        sourceIp: conn['src-address'].split(':')[0],
        destinationIp: conn['dst-address'].split(':')[0],
        sourcePort: parseInt(conn['src-address'].split(':')[1]),
        destinationPort: parseInt(conn['dst-address'].split(':')[1]),
        protocol: conn.protocol,
        bytesTransferred: parseInt(conn['bytes']) || 0,
        packetsTransferred: parseInt(conn['packets']) || 0,
        startTime: new Date(),
        endTime: undefined
      }));
    } catch (error) {
      console.error('Failed to get connections from MikroTik:', error);
      throw error;
    }
  }

  async getStats(): Promise<NetworkStats> {
    try {
      const interfaces = await this.executeCommand('/interface/print', {
        '.proplist': 'rx-byte,tx-byte,rx-packet,tx-packet'
      });

      const connections = await this.executeCommand('/ip/firewall/connection/print', {
        '.proplist': '.count'
      });

      const stats: NetworkStats = {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
        activeConnections: parseInt(connections['.count']) || 0,
        timestamp: new Date()
      };

      interfaces.forEach((iface: any) => {
        stats.bytesIn += parseInt(iface['rx-byte']) || 0;
        stats.bytesOut += parseInt(iface['tx-byte']) || 0;
        stats.packetsIn += parseInt(iface['rx-packet']) || 0;
        stats.packetsOut += parseInt(iface['tx-packet']) || 0;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get statistics from MikroTik:', error);
      throw error;
    }
  }

  async applyQoSPolicy(policy: QoSPolicy): Promise<void> {
    try {
      // Create a simple queue for the policy
      await this.executeCommand('/queue/simple/add', {
        name: policy.name,
        target: policy.targetDevice,
        'max-limit': `${policy.bandwidth.max}M/${policy.bandwidth.max}M`,
        'limit-at': `${policy.bandwidth.min}M/${policy.bandwidth.min}M`,
        priority: policy.priority.toString(),
        comment: `QoS policy ${policy.id}`
      });

      // If specific ports are defined, create firewall mangle rules
      if (policy.ports && policy.ports.length > 0) {
        for (const port of policy.ports) {
          await this.executeCommand('/ip/firewall/mangle/add', {
            chain: 'prerouting',
            'dst-port': port.toString(),
            protocol: policy.protocol || 'tcp',
            action: 'mark-connection',
            'new-connection-mark': `${policy.name}_conn`,
            comment: `QoS mark for ${policy.name}`
          });
        }
      }
    } catch (error) {
      console.error('Failed to apply QoS policy to MikroTik:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.executeCommand('/system/resource/print');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async executeCommand(command: string, params: any = {}): Promise<any> {
    if (!this.client) {
      throw new Error('Not connected to MikroTik router');
    }

    return new Promise((resolve, reject) => {
      this.client.write(command, params)
        .then((data: any) => resolve(data))
        .catch((error: any) => reject(error));
    });
  }
}
