import { WebSocket, WebSocketServer } from 'ws';
import { NetworkMetrics, DepartmentUsage, ApplicationUsage } from '../types/monitoring';

class NetworkMonitor {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;
  private monitoringInterval: NodeJS.Timeout | null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();
    this.monitoringInterval = null;
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    this.startMonitoring();
  }

  private startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      const metrics = this.collectNetworkMetrics();
      this.broadcastMetrics(metrics);
    }, 2000);
  }

  private collectNetworkMetrics() {
    // TODO: Replace with actual network monitoring logic
    return {
      networkStatus: {
        latency: Math.random() * 100,
        packetLoss: Math.random() * 2,
        status: Math.random() > 0.9 ? 'degraded' : 'online'
      },
      bandwidth: {
        download: Math.random() * 100,
        upload: Math.random() * 50,
        timestamp: new Date().toISOString()
      },
      departments: [
        { name: 'Engineering', usage: Math.random() * 100 },
        { name: 'Marketing', usage: Math.random() * 100 },
        { name: 'Sales', usage: Math.random() * 100 },
        { name: 'HR', usage: Math.random() * 100 },
        { name: 'Finance', usage: Math.random() * 100 }
      ],
      applications: [
        {
          name: 'Microsoft Teams',
          type: 'Communication',
          bandwidth: Math.random() * 100,
          status: 'normal',
          trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        // Add more applications...
      ]
    };
  }

  private broadcastMetrics(metrics: any) {
    const data = JSON.stringify(metrics);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  public stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.wss.close();
  }
}

export default NetworkMonitor;
