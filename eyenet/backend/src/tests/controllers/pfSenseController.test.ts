import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import https from 'https';
import { PfSenseController } from '../../services/controllers/pfSenseController';
import { QoSPolicy } from '../../interfaces/networkController';

// Mock axios and https
jest.mock('axios');
jest.mock('https', () => ({
  Agent: jest.fn()
}));

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('PfSenseController', () => {
  let controller: PfSenseController;
  let mockClient: jest.Mocked<any>;

  const config = {
    host: 'pfsense.example.com',
    apiKey: 'test-key',
    apiSecret: 'test-secret',
    verifySsl: false
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
    controller = new PfSenseController(config);

    // Verify https.Agent was called with correct options
    expect(https.Agent).toHaveBeenCalledWith({
      rejectUnauthorized: false
    });
  });

  describe('connect', () => {
    it('should successfully connect to the controller', async () => {
      mockClient.get.mockResolvedValueOnce({});

      await expect(controller.connect()).resolves.not.toThrow();
      expect(mockClient.get).toHaveBeenCalledWith('/system/status');
    });

    it('should throw error on connection failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(controller.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('getDevices', () => {
    it('should return list of network interfaces', async () => {
      const mockResponse = {
        data: {
          data: [{
            if: 'em0',
            descr: 'WAN',
            ipaddr: '192.168.1.1',
            enable: true
          }]
        }
      };

      mockClient.get.mockResolvedValueOnce(mockResponse);

      const devices = await controller.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual({
        id: 'em0',
        name: 'WAN',
        type: 'pfSense Interface',
        ipAddress: '192.168.1.1',
        status: 'online',
        lastSeen: expect.any(Date)
      });
    });

    it('should handle interface without description', async () => {
      const mockResponse = {
        data: {
          data: [{
            if: 'em0',
            ipaddr: '192.168.1.1',
            enable: true
          }]
        }
      };

      mockClient.get.mockResolvedValueOnce(mockResponse);

      const devices = await controller.getDevices();
      expect(devices[0].name).toBe('em0');
    });

    it('should throw error on API failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getDevices()).rejects.toThrow('API Error');
    });
  });

  describe('getFlows', () => {
    it('should return list of network flows', async () => {
      const mockResponse = {
        data: {
          data: [{
            src: '192.168.1.2',
            sport: '80',
            dst: '192.168.1.3',
            dport: '443',
            proto: 'tcp',
            bytes: '1000',
            packets: '10',
            creation: 1600000000,
            expires: 3600
          }]
        }
      };

      mockClient.get.mockResolvedValueOnce(mockResponse);

      const flows = await controller.getFlows();
      expect(flows).toHaveLength(1);
      expect(flows[0]).toEqual({
        id: '192.168.1.2:80-192.168.1.3:443',
        sourceIp: '192.168.1.2',
        destinationIp: '192.168.1.3',
        sourcePort: 80,
        destinationPort: 443,
        protocol: 'tcp',
        bytesTransferred: 1000,
        packetsTransferred: 10,
        startTime: new Date(1600000000 * 1000),
        endTime: new Date((1600000000 + 3600) * 1000)
      });
    });

    it('should handle flow without expiration', async () => {
      const mockResponse = {
        data: {
          data: [{
            src: '192.168.1.2',
            sport: '80',
            dst: '192.168.1.3',
            dport: '443',
            proto: 'tcp',
            bytes: '1000',
            packets: '10',
            creation: 1600000000
          }]
        }
      };

      mockClient.get.mockResolvedValueOnce(mockResponse);

      const flows = await controller.getFlows();
      expect(flows[0].endTime).toBeUndefined();
    });

    it('should throw error on API failure', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getFlows()).rejects.toThrow('API Error');
    });
  });

  describe('getStats', () => {
    it('should return aggregated network statistics', async () => {
      const mockInterfaceStats = {
        data: {
          data: [{
            inbytes: '1000',
            outbytes: '2000',
            inpkts: '100',
            outpkts: '200'
          }]
        }
      };

      const mockStates = {
        data: {
          total: 5
        }
      };

      mockClient.get
        .mockResolvedValueOnce(mockInterfaceStats)
        .mockResolvedValueOnce(mockStates);

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

    it('should handle missing statistics', async () => {
      const mockInterfaceStats = {
        data: {
          data: [{
            inbytes: undefined,
            outbytes: undefined,
            inpkts: undefined,
            outpkts: undefined
          }]
        }
      };

      const mockStates = {
        data: {
          total: undefined
        }
      };

      mockClient.get
        .mockResolvedValueOnce(mockInterfaceStats)
        .mockResolvedValueOnce(mockStates);

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
        targetDevice: 'em0',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      mockClient.post.mockResolvedValueOnce({});

      await expect(controller.applyQoSPolicy(policy)).resolves.not.toThrow();
      expect(mockClient.post).toHaveBeenCalledWith(
        '/firewall/traffic_shaper/queue',
        expect.objectContaining({
          interface: policy.targetDevice,
          bandwidth: policy.bandwidth,
          priority: policy.priority,
          description: policy.name
        })
      );
    });

    it('should throw error on API failure', async () => {
      const policy: QoSPolicy = {
        id: 'qos1',
        name: 'High Priority',
        targetDevice: 'em0',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      mockClient.post.mockRejectedValueOnce(new Error('API Error'));

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

  describe('authentication', () => {
    it('should generate correct authorization header', () => {
      // Verify that axios.create was called with the correct headers
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^PFSense test-key:\d+:[^:]+:[a-f0-9]{64}$/),
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
});
