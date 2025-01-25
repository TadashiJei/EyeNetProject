import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NetworkControllerManager } from '../services/networkControllerManager';
import { OpenDaylightController } from '../services/controllers/openDaylightController';
import { PfSenseController } from '../services/controllers/pfSenseController';
import { MikroTikController } from '../services/controllers/mikroTikController';
import { NetworkDevice, NetworkFlow, NetworkStats, QoSPolicy } from '../interfaces/networkController';

// Mock the controllers to avoid actual network calls
jest.mock('../services/controllers/openDaylightController');
jest.mock('../services/controllers/pfSenseController');
jest.mock('../services/controllers/mikroTikController');

describe('NetworkControllerManager', () => {
  let manager: NetworkControllerManager;
  let mockODLConnect: jest.MockedFunction<() => Promise<void>>;
  let mockODLDisconnect: jest.MockedFunction<() => Promise<void>>;
  let mockODLGetDevices: jest.MockedFunction<() => Promise<NetworkDevice[]>>;
  let mockODLGetFlows: jest.MockedFunction<() => Promise<NetworkFlow[]>>;
  let mockODLGetStats: jest.MockedFunction<() => Promise<NetworkStats>>;
  let mockODLApplyQoSPolicy: jest.MockedFunction<(policy: QoSPolicy) => Promise<void>>;
  let mockODLHealthCheck: jest.MockedFunction<() => Promise<boolean>>;

  let mockPFSConnect: jest.MockedFunction<() => Promise<void>>;
  let mockPFSDisconnect: jest.MockedFunction<() => Promise<void>>;
  let mockPFSGetDevices: jest.MockedFunction<() => Promise<NetworkDevice[]>>;
  let mockPFSGetFlows: jest.MockedFunction<() => Promise<NetworkFlow[]>>;
  let mockPFSGetStats: jest.MockedFunction<() => Promise<NetworkStats>>;
  let mockPFSApplyQoSPolicy: jest.MockedFunction<(policy: QoSPolicy) => Promise<void>>;
  let mockPFSHealthCheck: jest.MockedFunction<() => Promise<boolean>>;

  let mockMTConnect: jest.MockedFunction<() => Promise<void>>;
  let mockMTDisconnect: jest.MockedFunction<() => Promise<void>>;
  let mockMTGetDevices: jest.MockedFunction<() => Promise<NetworkDevice[]>>;
  let mockMTGetFlows: jest.MockedFunction<() => Promise<NetworkFlow[]>>;
  let mockMTGetStats: jest.MockedFunction<() => Promise<NetworkStats>>;
  let mockMTApplyQoSPolicy: jest.MockedFunction<(policy: QoSPolicy) => Promise<void>>;
  let mockMThealthCheck: jest.MockedFunction<() => Promise<boolean>>;

  const config = {
    openDaylight: {
      host: 'odl.example.com',
      port: 8181,
      username: 'admin',
      password: 'admin'
    },
    pfSense: {
      host: 'pfsense.example.com',
      apiKey: 'test-key',
      apiSecret: 'test-secret'
    },
    mikroTik: {
      host: 'mikrotik.example.com',
      port: 8728,
      username: 'admin',
      password: 'admin'
    },
    failoverCheckInterval: 100 // Reduce interval for faster tests
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock functions with proper types for OpenDaylight
    mockODLConnect = jest.fn<() => Promise<void>>();
    mockODLDisconnect = jest.fn<() => Promise<void>>();
    mockODLGetDevices = jest.fn<() => Promise<NetworkDevice[]>>();
    mockODLGetFlows = jest.fn<() => Promise<NetworkFlow[]>>();
    mockODLGetStats = jest.fn<() => Promise<NetworkStats>>();
    mockODLApplyQoSPolicy = jest.fn<(policy: QoSPolicy) => Promise<void>>();
    mockODLHealthCheck = jest.fn<() => Promise<boolean>>();

    // Create mock functions with proper types for pfSense
    mockPFSConnect = jest.fn<() => Promise<void>>();
    mockPFSDisconnect = jest.fn<() => Promise<void>>();
    mockPFSGetDevices = jest.fn<() => Promise<NetworkDevice[]>>();
    mockPFSGetFlows = jest.fn<() => Promise<NetworkFlow[]>>();
    mockPFSGetStats = jest.fn<() => Promise<NetworkStats>>();
    mockPFSApplyQoSPolicy = jest.fn<(policy: QoSPolicy) => Promise<void>>();
    mockPFSHealthCheck = jest.fn<() => Promise<boolean>>();

    // Create mock functions with proper types for MikroTik
    mockMTConnect = jest.fn<() => Promise<void>>();
    mockMTDisconnect = jest.fn<() => Promise<void>>();
    mockMTGetDevices = jest.fn<() => Promise<NetworkDevice[]>>();
    mockMTGetFlows = jest.fn<() => Promise<NetworkFlow[]>>();
    mockMTGetStats = jest.fn<() => Promise<NetworkStats>>();
    mockMTApplyQoSPolicy = jest.fn<(policy: QoSPolicy) => Promise<void>>();
    mockMThealthCheck = jest.fn<() => Promise<boolean>>();

    // Set default implementations for OpenDaylight
    mockODLConnect.mockResolvedValue();
    mockODLDisconnect.mockResolvedValue();
    mockODLGetDevices.mockResolvedValue([]);
    mockODLGetFlows.mockResolvedValue([]);
    mockODLGetStats.mockResolvedValue({
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      activeConnections: 0,
      timestamp: new Date()
    });
    mockODLApplyQoSPolicy.mockResolvedValue();
    mockODLHealthCheck.mockResolvedValue(true);

    // Set default implementations for pfSense
    mockPFSConnect.mockResolvedValue();
    mockPFSDisconnect.mockResolvedValue();
    mockPFSGetDevices.mockResolvedValue([]);
    mockPFSGetFlows.mockResolvedValue([]);
    mockPFSGetStats.mockResolvedValue({
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      activeConnections: 0,
      timestamp: new Date()
    });
    mockPFSApplyQoSPolicy.mockResolvedValue();
    mockPFSHealthCheck.mockResolvedValue(true);

    // Set default implementations for MikroTik
    mockMTConnect.mockResolvedValue();
    mockMTDisconnect.mockResolvedValue();
    mockMTGetDevices.mockResolvedValue([]);
    mockMTGetFlows.mockResolvedValue([]);
    mockMTGetStats.mockResolvedValue({
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      activeConnections: 0,
      timestamp: new Date()
    });
    mockMTApplyQoSPolicy.mockResolvedValue();
    mockMThealthCheck.mockResolvedValue(true);

    // Set up mock implementations
    const MockOpenDaylightController = OpenDaylightController as jest.MockedClass<typeof OpenDaylightController>;
    const MockPfSenseController = PfSenseController as jest.MockedClass<typeof PfSenseController>;
    const MockMikroTikController = MikroTikController as jest.MockedClass<typeof MikroTikController>;

    // Create a mock constructor for OpenDaylight
    (MockOpenDaylightController as jest.Mock).mockImplementation(function (this: any) {
      this.constructor = { name: 'OpenDaylightController' };
      this.connect = mockODLConnect;
      this.disconnect = mockODLDisconnect;
      this.getDevices = mockODLGetDevices;
      this.getFlows = mockODLGetFlows;
      this.getStats = mockODLGetStats;
      this.applyQoSPolicy = mockODLApplyQoSPolicy;
      this.healthCheck = mockODLHealthCheck;
      return this;
    });

    // Create a mock constructor for pfSense
    (MockPfSenseController as jest.Mock).mockImplementation(function (this: any) {
      this.constructor = { name: 'PfSenseController' };
      this.connect = mockPFSConnect;
      this.disconnect = mockPFSDisconnect;
      this.getDevices = mockPFSGetDevices;
      this.getFlows = mockPFSGetFlows;
      this.getStats = mockPFSGetStats;
      this.applyQoSPolicy = mockPFSApplyQoSPolicy;
      this.healthCheck = mockPFSHealthCheck;
      return this;
    });

    // Create a mock constructor for MikroTik
    (MockMikroTikController as jest.Mock).mockImplementation(function (this: any) {
      this.constructor = { name: 'MikroTikController' };
      this.connect = mockMTConnect;
      this.disconnect = mockMTDisconnect;
      this.getDevices = mockMTGetDevices;
      this.getFlows = mockMTGetFlows;
      this.getStats = mockMTGetStats;
      this.applyQoSPolicy = mockMTApplyQoSPolicy;
      this.healthCheck = mockMThealthCheck;
      return this;
    });

    // Create manager instance
    manager = new NetworkControllerManager(config);
  });

  afterEach(async () => {
    await manager.disconnect();
  });

  describe('Initialization and Connection', () => {
    it('should initialize with all configured controllers', async () => {
      const status = await manager.getAllControllersStatus();
      expect(status).toHaveLength(3);
    });

    it('should connect to available controllers', async () => {
      await manager.connect();
      const status = await manager.getAllControllersStatus();
      expect(status.some(s => s.active)).toBeTruthy();
    });
  });

  describe('Failover', () => {
    it('should switch to a healthy controller when active controller fails', async () => {
      // Set up health check responses
      mockODLHealthCheck
        .mockResolvedValueOnce(true)   // Initial health check during connect
        .mockResolvedValueOnce(false)  // First failover check - fail
        .mockResolvedValue(false);     // Subsequent checks - unhealthy

      mockPFSHealthCheck.mockResolvedValue(true); // PfSense is always healthy

      // Connect to establish initial controller
      await manager.connect();
      const initialController = manager.getActiveControllerType();
      expect(initialController).toBe('OpenDaylightController');

      // Wait for two failover check intervals
      await new Promise(resolve => setTimeout(resolve, 250));

      // Verify controller has switched
      const newController = manager.getActiveControllerType();
      expect(mockODLHealthCheck.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(newController).toBe('PfSenseController');
    });
  });

  describe('Network Operations', () => {
    beforeEach(async () => {
      await manager.connect();
    });

    it('should get devices from active controller', async () => {
      const mockDevices: NetworkDevice[] = [{
        id: 'test-device',
        name: 'Test Device',
        type: 'test',
        ipAddress: '192.168.1.1',
        status: 'online',
        lastSeen: new Date()
      }];

      mockODLGetDevices.mockResolvedValue(mockDevices);

      const devices = await manager.getDevices();
      expect(devices).toEqual(mockDevices);
      expect(mockODLGetDevices).toHaveBeenCalled();
    });

    it('should get flows from active controller', async () => {
      const mockFlows: NetworkFlow[] = [{
        id: 'test-flow',
        sourceIp: '192.168.1.2',
        destinationIp: '192.168.1.3',
        sourcePort: 80,
        destinationPort: 443,
        protocol: 'TCP',
        bytesTransferred: 1000,
        packetsTransferred: 10,
        startTime: new Date(),
        endTime: undefined
      }];

      mockODLGetFlows.mockResolvedValue(mockFlows);

      const flows = await manager.getFlows();
      expect(flows).toEqual(mockFlows);
      expect(mockODLGetFlows).toHaveBeenCalled();
    });

    it('should get stats from active controller', async () => {
      const mockStats: NetworkStats = {
        bytesIn: 1000,
        bytesOut: 2000,
        packetsIn: 100,
        packetsOut: 200,
        activeConnections: 5,
        timestamp: new Date()
      };

      mockODLGetStats.mockResolvedValue(mockStats);

      const stats = await manager.getStats();
      expect(stats).toEqual(mockStats);
      expect(mockODLGetStats).toHaveBeenCalled();
    });

    it('should apply QoS policy through active controller', async () => {
      const policy: QoSPolicy = {
        id: 'test-policy',
        name: 'Test Policy',
        targetDevice: 'test-device',
        bandwidth: {
          min: 10,
          max: 100
        },
        priority: 1
      };

      await manager.applyQoSPolicy(policy);
      expect(mockODLApplyQoSPolicy).toHaveBeenCalledWith(policy);
    });
  });
});
