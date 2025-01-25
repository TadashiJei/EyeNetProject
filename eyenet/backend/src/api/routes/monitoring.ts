import express from 'express';
import { MonitoringController } from '../../controllers/monitoringController';

const router = express.Router();
const monitoringController = new MonitoringController();

// Get current network metrics
router.get('/metrics/current', monitoringController.getCurrentMetrics);

// Get historical network metrics
router.get('/metrics/history', monitoringController.getHistoricalMetrics);

// Get all departments
router.get('/departments', monitoringController.getDepartments);

// Get all applications
router.get('/applications', monitoringController.getApplications);

// Update department bandwidth limit
router.put('/departments/:departmentId/bandwidth', monitoringController.updateDepartmentBandwidth);

// Update application priority
router.put('/applications/:applicationId/priority', monitoringController.updateApplicationPriority);

export default router;
