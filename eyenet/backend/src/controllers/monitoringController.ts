import { Request, Response } from 'express';
import { networkMonitoringService } from '../services/networkMonitoringService';
import { Department } from '../models/department';
import { Application } from '../models/application';

export class MonitoringController {
  async getCurrentMetrics(req: Request, res: Response) {
    try {
      const metrics = await networkMonitoringService.getLatestMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching current metrics:', error);
      res.status(500).json({ error: 'Failed to fetch current metrics' });
    }
  }

  async getHistoricalMetrics(req: Request, res: Response) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const metrics = await networkMonitoringService.getHistoricalMetrics(startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching historical metrics:', error);
      res.status(500).json({ error: 'Failed to fetch historical metrics' });
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const departments = await Department.find()
        .populate('users', 'firstName lastName email');
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  }

  async getApplications(req: Request, res: Response) {
    try {
      const applications = await Application.find()
        .populate('departments', 'name');
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  }

  async updateDepartmentBandwidth(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;
      const { bandwidthLimit } = req.body;

      if (!bandwidthLimit || typeof bandwidthLimit !== 'number') {
        return res.status(400).json({ error: 'Invalid bandwidth limit' });
      }

      const department = await Department.findByIdAndUpdate(
        departmentId,
        { bandwidthLimit },
        { new: true }
      );

      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      res.json(department);
    } catch (error) {
      console.error('Error updating department bandwidth:', error);
      res.status(500).json({ error: 'Failed to update department bandwidth' });
    }
  }

  async updateApplicationPriority(req: Request, res: Response) {
    try {
      const { applicationId } = req.params;
      const { priority } = req.body;

      if (!priority || typeof priority !== 'number' || priority < 1 || priority > 5) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }

      const application = await Application.findByIdAndUpdate(
        applicationId,
        { priority },
        { new: true }
      );

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      console.error('Error updating application priority:', error);
      res.status(500).json({ error: 'Failed to update application priority' });
    }
  }
}
