import { NetworkMetrics } from '../../models/networkMetrics';

export interface MLPrediction {
  timestamp: Date;
  value: number;
  confidence: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  details: {
    metric: string;
    contribution: number;
  }[];
}

export interface TrafficClassification {
  type: string;
  probability: number;
  features: {
    [key: string]: number;
  };
}

export interface ResourceOptimization {
  recommendations: {
    resource: string;
    currentValue: number;
    recommendedValue: number;
    impact: {
      metric: string;
      improvement: number;
    }[];
  }[];
}

export interface MLService {
  // Bandwidth prediction
  predictBandwidthUsage(
    historicalData: NetworkMetrics[],
    predictionHorizon: number
  ): Promise<MLPrediction[]>;

  // Anomaly detection
  detectAnomalies(
    currentMetrics: NetworkMetrics,
    historicalContext: NetworkMetrics[]
  ): Promise<AnomalyDetectionResult>;

  // Traffic classification
  classifyTraffic(
    trafficData: NetworkMetrics
  ): Promise<TrafficClassification>;

  // Resource optimization
  optimizeResources(
    currentState: NetworkMetrics,
    constraints: { [key: string]: number }
  ): Promise<ResourceOptimization>;

  // Model management
  trainModels(trainingData: NetworkMetrics[]): Promise<void>;
  evaluateModels(testData: NetworkMetrics[]): Promise<{
    bandwidthPrediction: {
      rmse: number;
      mae: number;
      r2: number;
    };
    anomalyDetection: {
      precision: number;
      recall: number;
      f1Score: number;
    };
    trafficClassification: {
      accuracy: number;
      confusionMatrix: number[][];
    };
  }>;
}
