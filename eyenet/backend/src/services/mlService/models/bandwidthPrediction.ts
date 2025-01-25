import * as tf from '@tensorflow/tfjs-node';
import { Document } from 'mongoose';
import { NetworkState } from '../../../types/monitoring';

interface NetworkMetricsDocument extends Document {
  timestamp: Date;
  latency: number;
  packetLoss: number;
  status: 'online' | 'offline' | 'degraded';
  bandwidth: {
    download: number;
    upload: number;
  };
  departmentUsage: Array<{
    department: string;
    usage: number;
  }>;
  applicationUsage: Array<{
    application: string;
    bandwidth: number;
  }>;
}

export interface MLPrediction {
  timestamp: Date;
  value: number;
  confidence: number;
}

export class BandwidthPredictionModel {
  private model: tf.LayersModel | null = null;
  private readonly sequenceLength = 24; // 24 hours of data
  private readonly predictionSteps = 6; // Predict next 6 hours

  async buildModel(): Promise<void> {
    // Create a sequential model for time series prediction
    this.model = tf.sequential({
      layers: [
        // LSTM layer for sequence processing
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          inputShape: [this.sequenceLength, 1]
        }),
        
        // Second LSTM layer
        tf.layers.lstm({
          units: 32,
          returnSequences: false
        }),
        
        // Dense layers for prediction
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: this.predictionSteps, activation: 'linear' })
      ]
    });

    // Compile the model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
  }

  private preprocessData(data: NetworkMetricsDocument[]): {
    sequences: tf.Tensor3D;
    targets: tf.Tensor2D;
  } {
    const bandwidthValues = data.map(d => d.bandwidth.download + d.bandwidth.upload);
    const sequences = [];
    const targets = [];

    for (let i = 0; i < bandwidthValues.length - this.sequenceLength - this.predictionSteps; i++) {
      sequences.push(bandwidthValues.slice(i, i + this.sequenceLength));
      targets.push(bandwidthValues.slice(i + this.sequenceLength, i + this.sequenceLength + this.predictionSteps));
    }

    return {
      sequences: tf.tensor3d(sequences).reshape([sequences.length, this.sequenceLength, 1]),
      targets: tf.tensor2d(targets)
    };
  }

  async train(trainingData: NetworkMetricsDocument[]): Promise<void> {
    if (!this.model) {
      await this.buildModel();
    }

    const { sequences, targets } = this.preprocessData(trainingData);

    // Train the model
    await this.model!.fit(sequences, targets, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch: number, logs: tf.Logs) => {
          console.log(`Epoch ${epoch + 1} - loss: ${logs.loss.toFixed(4)} - val_loss: ${logs.val_loss.toFixed(4)}`);
        }
      }
    });

    // Clean up tensors
    sequences.dispose();
    targets.dispose();
  }

  async predict(historicalData: NetworkMetricsDocument[]): Promise<MLPrediction[]> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    // Prepare input sequence
    const recentData = historicalData.slice(-this.sequenceLength);
    const inputSequence = tf.tensor3d([recentData.map(d => d.bandwidth.download + d.bandwidth.upload)]).reshape([1, this.sequenceLength, 1]);

    // Make prediction
    const prediction = this.model.predict(inputSequence) as tf.Tensor;
    const predictionValues = await prediction.array() as number[][];

    // Clean up tensors
    inputSequence.dispose();
    prediction.dispose();

    // Format predictions
    return predictionValues[0].map((value, index) => ({
      timestamp: new Date(recentData[recentData.length - 1].timestamp.getTime() + (index + 1) * 3600000), // Add hours
      value: value,
      confidence: 0.8 // This should be calculated based on model uncertainty
    }));
  }

  async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }
    await this.model.save(`file://${path}`);
  }

  async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
  }
}
