# Machine Learning Service

This directory contains the TensorFlow.js-based machine learning components of the EyeNet project.

## Structure

```
mlService/
├── models/              # TensorFlow.js model definitions
│   ├── anomalyDetection.ts   # LSTM-based anomaly detection
│   ├── bandwidthPrediction.ts # Time series prediction model
│   └── networkClassifier.ts   # Traffic classification model
├── training/           # Model training scripts
│   ├── trainAnomalyDetection.ts
│   ├── trainBandwidthPrediction.ts
│   └── trainNetworkClassifier.ts
├── inference/          # Model inference endpoints
│   ├── anomalyDetection.ts
│   ├── bandwidthPrediction.ts
│   └── networkClassifier.ts
└── utils/             # ML utilities
    ├── dataPreprocessing.ts
    ├── modelEvaluation.ts
    └── featureEngineering.ts
```

## Integration Points

1. **Data Collection**
   - Network traffic data from controllers
   - Application usage patterns
   - Bandwidth utilization metrics
   - User behavior data

2. **Model Training**
   - Historical network data
   - Labeled anomalies
   - Traffic patterns
   - QoS metrics

3. **Inference**
   - Real-time anomaly detection
   - Bandwidth prediction
   - Traffic classification
   - Resource optimization

## Getting Started

1. Install TensorFlow.js dependencies:
   ```bash
   npm install @tensorflow/tfjs-node @tensorflow/tfjs-node-gpu
   ```

2. Train the models:
   ```bash
   npm run train-models
   ```

3. Run inference:
   ```bash
   npm run start-ml-service
   ```

## Model Architectures

### Bandwidth Prediction
- LSTM-based sequence model
- Input: 24-hour sequence of bandwidth usage
- Output: 6-hour bandwidth prediction
- Features: bandwidth usage, time of day, day of week

### Anomaly Detection
- Autoencoder architecture
- Input: Network metrics vector
- Output: Anomaly score and contributing features
- Real-time detection capability

### Traffic Classification
- Deep neural network
- Input: Network flow features
- Output: Traffic type probabilities
- Multi-class classification

## API Endpoints

The ML service exposes the following endpoints:

- `/api/ml/predict/bandwidth`: Predict future bandwidth usage
- `/api/ml/detect/anomalies`: Detect network anomalies
- `/api/ml/classify/traffic`: Classify network traffic
- `/api/ml/optimize/resources`: Get resource optimization recommendations

## Model Performance Metrics

Track and update model performance metrics here:

- Anomaly Detection: Precision, Recall, F1-Score
- Bandwidth Prediction: RMSE, MAE, R²
- Traffic Classification: Accuracy, Confusion Matrix

## Model Persistence

Models are saved and loaded using TensorFlow.js model format:
```typescript
// Save model
await model.save('file:///path/to/model');

// Load model
const model = await tf.loadLayersModel('file:///path/to/model');
