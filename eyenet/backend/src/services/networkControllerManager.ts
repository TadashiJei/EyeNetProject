import { NetworkController, NetworkDevice, NetworkFlow, NetworkStats, QoSPolicy } from '../interfaces/networkController';
import { OpenDaylightController } from './controllers/openDaylightController';
import { PfSenseController } from './controllers/pfSenseController';
import { MikroTikController } from './controllers/mikroTikController';

export class NetworkControllerManager implements NetworkController {
  private controllers: NetworkController[] = [];
  private activeController: NetworkController | null = null;
  private failoverInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: {
      openDaylight?: {
        host: string;
        port: number;
        username: string;
        password: string;
      };
      pfSense?: {
        host: string;
        apiKey: string;
        apiSecret: string;
        verifySsl?: boolean;
      };
      mikroTik?: {
        host: string;
        port: number;
        username: string;
        password: string;
      };
      failoverCheckInterval?: number;
    }
  ) {
    this.initializeControllers();
    this.startFailoverCheck();
  }

  private initializeControllers() {
    if (this.config.openDaylight) {
      this.controllers.push(new OpenDaylightController(this.config.openDaylight));
    }
    if (this.config.pfSense) {
      this.controllers.push(new PfSenseController(this.config.pfSense));
    }
    if (this.config.mikroTik) {
      this.controllers.push(new MikroTikController(this.config.mikroTik));
    }
  }

  private startFailoverCheck() {
    const interval = this.config.failoverCheckInterval || 30000; // Default 30 seconds
    this.failoverInterval = setInterval(async () => {
      await this.checkAndFailover();
    }, interval);
  }

  private async checkAndFailover() {
    if (!this.activeController) {
      await this.selectActiveController();
      return;
    }

    try {
      const isHealthy = await this.activeController.healthCheck();
      if (!isHealthy) {
        console.log('Active controller is unhealthy, initiating failover...');
        await this.selectActiveController();
      }
    } catch (error) {
      console.error('Error during health check:', error);
      await this.selectActiveController();
    }
  }

  private async selectActiveController() {
    for (const controller of this.controllers) {
      try {
        const isHealthy = await controller.healthCheck();
        if (isHealthy) {
          this.activeController = controller;
          console.log('Selected new active controller:', controller.constructor.name);
          return;
        }
      } catch (error) {
        console.error('Error checking controller health:', error);
      }
    }
    throw new Error('No healthy controllers available');
  }

  async connect(): Promise<void> {
    const errors: Error[] = [];
    
    for (const controller of this.controllers) {
      try {
        await controller.connect();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    await this.selectActiveController();
    
    if (!this.activeController) {
      throw new Error(`Failed to connect to any controllers: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.failoverInterval) {
      clearInterval(this.failoverInterval);
    }

    await Promise.all(
      this.controllers.map(controller => controller.disconnect())
    );

    this.activeController = null;
  }

  private ensureActiveController() {
    if (!this.activeController) {
      throw new Error('No active controller available');
    }
  }

  async getDevices(): Promise<NetworkDevice[]> {
    this.ensureActiveController();
    return this.activeController!.getDevices();
  }

  async getFlows(): Promise<NetworkFlow[]> {
    this.ensureActiveController();
    return this.activeController!.getFlows();
  }

  async getStats(): Promise<NetworkStats> {
    this.ensureActiveController();
    return this.activeController!.getStats();
  }

  async applyQoSPolicy(policy: QoSPolicy): Promise<void> {
    this.ensureActiveController();
    return this.activeController!.applyQoSPolicy(policy);
  }

  async healthCheck(): Promise<boolean> {
    this.ensureActiveController();
    return this.activeController!.healthCheck();
  }

  getActiveControllerType(): string {
    return this.activeController ? this.activeController.constructor.name : 'None';
  }

  async getAllControllersStatus(): Promise<Array<{
    type: string;
    healthy: boolean;
    active: boolean;
  }>> {
    const statuses = await Promise.all(
      this.controllers.map(async controller => ({
        type: controller.constructor.name,
        healthy: await controller.healthCheck(),
        active: controller === this.activeController
      }))
    );

    return statuses;
  }
}
