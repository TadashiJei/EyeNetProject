import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MikroTikController } from '../../services/controllers/mikroTikController';
import { QoSPolicy } from '../../interfaces/networkController';

// Mock RouterOS API
jest.mock('node-routeros', () => ({
  RouterOSAPI: jest.fn()
}));

describe('MikroTikController', () => {
  let controller: MikroTikController;
  let mockClient: any;

  const config = {
    host: 'mikrotik.example.com',
    port: 8728,
    username: 'admin',
    password: 'password'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client instance
    mockClient = {
      connect: jest.fn(),
      close: jest.fn(),
      write: jest.fn()
    };

    // Mock RouterOSAPI constructor
    const RouterOSAPI = (jest.requireMock('node-routeros') as { RouterOSAPI: jest.Mock }).RouterOSAPI;
    RouterOSAPI.mockImplementation(() => mockClient);

    // Create controller instance
    controller = new MikroTikController(config);
  });

  describe('connect', () => {
    it('should successfully connect to the router', async () => {
      mockClient.connect.mockResolvedValueOnce(undefined);

      await expect(controller.connect()).resolves.not.toThrow();
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should throw error on connection failure', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(controller.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should successfully disconnect from the router', async () => {
      // First connect to set up the client
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Then disconnect
      mockClient.close.mockResolvedValueOnce(undefined);
      await expect(controller.disconnect()).resolves.not.toThrow();
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', async () => {
      await expect(controller.disconnect()).resolves.not.toThrow();
    });
  });

  describe('getDevices', () => {
    it('should return list of network interfaces', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Mock interface print command
      mockClient.write.mockImplementation((command: string) => {
        if (command === '/interface/print') {
          return Promise.resolve([{
            '.id': '*1',
            name: 'ether1',
            type: 'ether',
            address: '192.168.1.1'
          }]);
        } else if (command === '/ip/address/print') {
          return Promise.resolve([{
            address: '192.168.1.1/24'
          }]);
        }
        return Promise.resolve([]);
      });

      const devices = await controller.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual({
        id: '*1',
        name: 'ether1',
        type: 'ether',
        ipAddress: '192.168.1.1',
        status: 'online',
        lastSeen: expect.any(Date)
      });
    });

    it('should handle interface without IP address', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Mock interface print command
      mockClient.write.mockImplementation((command: string) => {
        if (command === '/interface/print') {
          return Promise.resolve([{
            '.id': '*1',
            name: 'ether1',
            type: 'ether'
          }]);
        }
        return Promise.resolve([]);
      });

      const devices = await controller.getDevices();
      expect(devices[0].ipAddress).toBe('unknown');
    });

    it('should throw error on API failure', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      mockClient.write.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getDevices()).rejects.toThrow('API Error');
    });
  });

  describe('getFlows', () => {
    it('should return list of network flows', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Mock connection print command
      mockClient.write.mockResolvedValueOnce([{
        '.id': '*1',
        'src-address': '192.168.1.2:80',
        'dst-address': '192.168.1.3:443',
        protocol: 'tcp',
        bytes: '1000',
        packets: '10'
      }]);

      const flows = await controller.getFlows();
      expect(flows).toHaveLength(1);
      expect(flows[0]).toEqual({
        id: '*1',
        sourceIp: '192.168.1.2',
        destinationIp: '192.168.1.3',
        sourcePort: 80,
        destinationPort: 443,
        protocol: 'tcp',
        bytesTransferred: 1000,
        packetsTransferred: 10,
        startTime: expect.any(Date),
        endTime: undefined
      });
    });

    it('should handle missing byte and packet counts', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Mock connection print command
      mockClient.write.mockResolvedValueOnce([{
        '.id': '*1',
        'src-address': '192.168.1.2:80',
        'dst-address': '192.168.1.3:443',
        protocol: 'tcp'
      }]);

      const flows = await controller.getFlows();
      expect(flows[0].bytesTransferred).toBe(0);
      expect(flows[0].packetsTransferred).toBe(0);
    });

    it('should throw error on API failure', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      mockClient.write.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getFlows()).rejects.toThrow('API Error');
    });
  });

  describe('getStats', () => {
    it('should return aggregated network statistics', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Mock interface and connection print commands
      mockClient.write.mockImplementation((command: string) => {
        if (command === '/interface/print') {
          return Promise.resolve([{
            'rx-byte': '1000',
            'tx-byte': '2000',
            'rx-packet': '100',
            'tx-packet': '200'
          }]);
        } else if (command === '/ip/firewall/connection/print') {
          return Promise.resolve({ '.count': '5' });
        }
        return Promise.resolve([]);
      });

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
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      // Mock interface and connection print commands
      mockClient.write.mockImplementation((command: string) => {
        if (command === '/interface/print') {
          return Promise.resolve([{}]);
        } else if (command === '/ip/firewall/connection/print') {
          return Promise.resolve({});
        }
        return Promise.resolve([]);
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
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      mockClient.write.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.getStats()).rejects.toThrow('API Error');
    });
  });

  describe('applyQoSPolicy', () => {
    it('should successfully apply QoS policy without ports', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      const policy: QoSPolicy = {
        id: 'qos1',
        name: 'High Priority',
        targetDevice: 'ether1',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      mockClient.write.mockResolvedValueOnce([]);

      await expect(controller.applyQoSPolicy(policy)).resolves.not.toThrow();
      expect(mockClient.write).toHaveBeenCalledWith('/queue/simple/add', expect.objectContaining({
        name: policy.name,
        target: policy.targetDevice,
        'max-limit': '100M/100M',
        'limit-at': '10M/10M',
        priority: '1'
      }));
    });

    it('should apply QoS policy with ports', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      const policy: QoSPolicy = {
        id: 'qos1',
        name: 'High Priority',
        targetDevice: 'ether1',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1,
        ports: [80, 443],
        protocol: 'tcp'
      };

      mockClient.write
        .mockResolvedValueOnce([]) // queue/simple/add
        .mockResolvedValueOnce([]) // first mangle rule
        .mockResolvedValueOnce([]); // second mangle rule

      await expect(controller.applyQoSPolicy(policy)).resolves.not.toThrow();
      expect(mockClient.write).toHaveBeenCalledWith('/ip/firewall/mangle/add', expect.objectContaining({
        chain: 'prerouting',
        'dst-port': '80',
        protocol: 'tcp'
      }));
    });

    it('should throw error on API failure', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      const policy: QoSPolicy = {
        id: 'qos1',
        name: 'High Priority',
        targetDevice: 'ether1',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      mockClient.write.mockRejectedValueOnce(new Error('API Error'));

      await expect(controller.applyQoSPolicy(policy)).rejects.toThrow('API Error');
    });
  });

  describe('healthCheck', () => {
    it('should return true when router is healthy', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      mockClient.write.mockResolvedValueOnce([]);

      const isHealthy = await controller.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when router is unhealthy', async () => {
      // First connect
      mockClient.connect.mockResolvedValueOnce(undefined);
      await controller.connect();

      mockClient.write.mockRejectedValueOnce(new Error('API Error'));

      const isHealthy = await controller.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});
