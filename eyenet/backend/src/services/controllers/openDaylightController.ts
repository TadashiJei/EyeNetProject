import axios, { AxiosInstance } from 'axios';
import { 
  NetworkController, 
  NetworkDevice, 
  NetworkFlow, 
  NetworkStats,
  QoSPolicy 
} from '../../interfaces/networkController';

export class OpenDaylightController implements NetworkController {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: {
    host: string;
    port: number;
    username: string;
    password: string;
  }) {
    this.baseUrl = `http://${config.host}:${config.port}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: config.username,
        password: config.password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.get('/restconf/operational/network-topology:network-topology');
    } catch (error) {
      console.error('Failed to connect to OpenDaylight controller:', error);
      throw new Error('Connection failed');
    }
  }

  async disconnect(): Promise<void> {
    // Nothing to do for REST client
  }

  async getDevices(): Promise<NetworkDevice[]> {
    try {
      const response = await this.client.get('/restconf/operational/network-topology:network-topology');
      const topology = response.data['network-topology'].topology;
      
      return topology.flatMap((topo: any) => 
        topo.node?.map((node: any) => ({
          id: node['node-id'],
          name: node['node-id'],
          type: 'OpenFlow',
          ipAddress: node['flow-node-inventory:ip-address'] || 'unknown',
          status: node['flow-node-inventory:status'] === 'UP' ? 'online' : 'offline',
          lastSeen: new Date()
        })) || []
      );
    } catch (error) {
      console.error('Failed to get devices from OpenDaylight:', error);
      throw error;
    }
  }

  async getFlows(): Promise<NetworkFlow[]> {
    try {
      const devices = await this.getDevices();
      const flows: NetworkFlow[] = [];

      for (const device of devices) {
        const response = await this.client.get(
          `/restconf/operational/opendaylight-inventory:nodes/node/${device.id}/flow-node-inventory:table/0`
        );

        const tableFlows = response.data['flow-node-inventory:table']?.[0]?.flow || [];
        
        flows.push(...tableFlows.map((flow: any) => ({
          id: flow.id,
          sourceIp: flow.match['ipv4-source'] || '',
          destinationIp: flow.match['ipv4-destination'] || '',
          sourcePort: flow.match['tcp-source-port'] || 0,
          destinationPort: flow.match['tcp-destination-port'] || 0,
          protocol: flow.match['ip-protocol'] || '',
          bytesTransferred: flow.statistics?.['byte-count'] || 0,
          packetsTransferred: flow.statistics?.['packet-count'] || 0,
          startTime: new Date(flow.statistics?.duration?.nanosecond || Date.now()),
          endTime: undefined
        })));
      }

      return flows;
    } catch (error) {
      console.error('Failed to get flows from OpenDaylight:', error);
      throw error;
    }
  }

  async getStats(): Promise<NetworkStats> {
    try {
      const devices = await this.getDevices();
      let totalStats: NetworkStats = {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
        activeConnections: 0,
        timestamp: new Date()
      };

      for (const device of devices) {
        const response = await this.client.get(
          `/restconf/operational/opendaylight-inventory:nodes/node/${device.id}/flow-node-inventory:table/0/flow-statistics`
        );

        const stats = response.data['flow-node-inventory:flow-statistics'] || {};
        totalStats.bytesIn += stats['bytes-received'] || 0;
        totalStats.bytesOut += stats['bytes-transmitted'] || 0;
        totalStats.packetsIn += stats['packets-received'] || 0;
        totalStats.packetsOut += stats['packets-transmitted'] || 0;
        totalStats.activeConnections += stats['active-flows'] || 0;
      }

      return totalStats;
    } catch (error) {
      console.error('Failed to get statistics from OpenDaylight:', error);
      throw error;
    }
  }

  async applyQoSPolicy(policy: QoSPolicy): Promise<void> {
    try {
      const flow = {
        'flow-node-inventory:flow': [{
          id: policy.id,
          table_id: 0,
          priority: policy.priority,
          match: {
            'ethernet-match': {
              'ethernet-type': {
                type: 2048 // IPv4
              }
            }
          },
          instructions: {
            instruction: [{
              order: 0,
              'apply-actions': {
                action: [{
                  order: 0,
                  'set-queue-action': {
                    'queue-id': policy.priority
                  }
                }]
              }
            }]
          }
        }]
      };

      await this.client.put(
        `/restconf/config/opendaylight-inventory:nodes/node/${policy.targetDevice}/flow-node-inventory:table/0/flow/${policy.id}`,
        flow
      );
    } catch (error) {
      console.error('Failed to apply QoS policy:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/restconf/operational/network-topology:network-topology');
      return true;
    } catch (error) {
      return false;
    }
  }
}
