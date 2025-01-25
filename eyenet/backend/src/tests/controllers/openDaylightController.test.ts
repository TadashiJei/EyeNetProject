import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import { OpenDaylightController } from '../../services/controllers/openDaylightController';
import { QoSPolicy } from '../../interfaces/networkController';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('OpenDaylightController', () => {
  let controller: OpenDaylightController;
  let mockClient: jest.Mocked<any>;

  const config = {
    host: 'test.example.com',
    port: 8181,
    username: 'admin',
    password: 'admin'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios client
    mockClient = {
      get: jest.fn(),
      put: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    };

    // Mock axios.create to return our mock client
    mockAxios.create.mockReturnValue(mockClient);

    // Create controller instance
    controller = new OpenDaylightController(config);
  });

  describe('connect', () => {
    it('should successfully connect to the controller', async () => {
      mockClient.get.mockResolvedValueOnce({});

      await expect(controller.connect()).resolves.not.toThrow();
      expect(mockClient.get).toHaveBeenCalledWith('/restconf/operational/network-topology:network-topology');
    });

    it('should throw error on connection failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(controller.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('getDevices', () => {
    it('should return list of network devices', async () => {
      const mockResponse = {
        data: {
          'network-topology': {
            topology: [{
              node: [{
                'node-id': 'openflow:1',
                'flow-node-inventory:ip-address': '192.168.1.1',
                'flow-node-inventory:status': 'UP'
              }]
            }]
          }
        }
      };

      mockClient.get.mockResolvedValueOnce(mockResponse);

      const devices = await controller.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual({
        id: 'openflow:1',
        name: 'openflow:1',
        type: 'OpenFlow',
        ipAddress: '192.168.1.1',
        status: 'online',
        lastSeen: expect.any(Date)
      });
    });

    it('should handle empty topology response', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          'network-topology': {
            topology: []
          }
        }
      });

      const devices = await controller.getDevices();
      expect(devices).toHaveLength(0);
    });

    it('should throw error on API failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getDevices()).rejects.toThrow('API Error');
    });
  });

  describe('getFlows', () => {
    it('should return list of network flows', async () => {
      // Mock getDevices response
      const mockDevicesResponse = {
        data: {
          'network-topology': {
            topology: [{
              node: [{
                'node-id': 'openflow:1'
              }]
            }]
          }
        }
      };

      // Mock flow table response
      const mockFlowResponse = {
        data: {
          'flow-node-inventory:table': [{
            flow: [{
              id: 'flow1',
              match: {
                'ipv4-source': '192.168.1.1',
                'ipv4-destination': '192.168.1.2',
                'tcp-source-port': 80,
                'tcp-destination-port': 443,
                'ip-protocol': 'TCP'
              },
              statistics: {
                'byte-count': 1000,
                'packet-count': 10,
                duration: {
                  nanosecond: Date.now()
                }
              }
            }]
          }]
        }
      };

      mockClient.get
        .mockResolvedValueOnce(mockDevicesResponse)
        .mockResolvedValueOnce(mockFlowResponse);

      const flows = await controller.getFlows();
      expect(flows).toHaveLength(1);
      expect(flows[0]).toEqual({
        id: 'flow1',
        sourceIp: '192.168.1.1',
        destinationIp: '192.168.1.2',
        sourcePort: 80,
        destinationPort: 443,
        protocol: 'TCP',
        bytesTransferred: 1000,
        packetsTransferred: 10,
        startTime: expect.any(Date),
        endTime: undefined
      });
    });

    it('should handle empty flow table response', async () => {
      mockClient.get
        .mockResolvedValueOnce({
          data: {
            'network-topology': {
              topology: [{
                node: [{
                  'node-id': 'openflow:1'
                }]
              }]
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            'flow-node-inventory:table': [{}]
          }
        });

      const flows = await controller.getFlows();
      expect(flows).toHaveLength(0);
    });

    it('should throw error on API failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getFlows()).rejects.toThrow('API Error');
    });
  });

  describe('getStats', () => {
    it('should return aggregated network statistics', async () => {
      // Mock getDevices response
      const mockDevicesResponse = {
        data: {
          'network-topology': {
            topology: [{
              node: [{
                'node-id': 'openflow:1'
              }]
            }]
          }
        }
      };

      // Mock flow statistics response
      const mockStatsResponse = {
        data: {
          'flow-node-inventory:flow-statistics': {
            'bytes-received': 1000,
            'bytes-transmitted': 2000,
            'packets-received': 100,
            'packets-transmitted': 200,
            'active-flows': 5
          }
        }
      };

      mockClient.get
        .mockResolvedValueOnce(mockDevicesResponse)
        .mockResolvedValueOnce(mockStatsResponse);

      const stats = await controller.getStats();
      expect(stats).toEqual({
        bytesIn: 1000,
        bytesOut: 2000,
        packetsIn: 100,
        packetsOut: 200,
        activeConnections: 5,
        timestamp: expect.any(Date)
      });
    });

    it('should handle empty statistics response', async () => {
      mockClient.get
        .mockResolvedValueOnce({
          data: {
            'network-topology': {
              topology: [{
                node: [{
                  'node-id': 'openflow:1'
                }]
              }]
            }
          }
        })
        .mockResolvedValueOnce({
          data: {}
        });

      const stats = await controller.getStats();
      expect(stats).toEqual({
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
        activeConnections: 0,
        timestamp: expect.any(Date)
      });
    });

    it('should throw error on API failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getStats()).rejects.toThrow('API Error');
    });
  });

  describe('applyQoSPolicy', () => {
    it('should successfully apply QoS policy', async () => {
      const policy: QoSPolicy = {
        id: 'qos1',
        name: 'High Priority',
        targetDevice: 'openflow:1',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      mockClient.put.mockResolvedValueOnce({});

      await expect(controller.applyQoSPolicy(policy)).resolves.not.toThrow();
      expect(mockClient.put).toHaveBeenCalledWith(
        `/restconf/config/opendaylight-inventory:nodes/node/${policy.targetDevice}/flow-node-inventory:table/0/flow/${policy.id}`,
        expect.objectContaining({
          'flow-node-inventory:flow': expect.arrayContaining([
            expect.objectContaining({
              id: policy.id,
              priority: policy.priority
            })
          ])
        })
      );
    });

    it('should throw error on API failure', async () => {
      const policy: QoSPolicy = {
        id: 'qos1',
        name: 'High Priority',
        targetDevice: 'openflow:1',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      mockClient.put.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.applyQoSPolicy(policy)).rejects.toThrow('API Error');
    });
  });

  describe('healthCheck', () => {
    it('should return true when controller is healthy', async () => {
      mockClient.get.mockResolvedValueOnce({});

      const isHealthy = await controller.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when controller is unhealthy', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('API Error'));

      const isHealthy = await controller.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});
