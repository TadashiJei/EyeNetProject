# Machine Learning Service

This directory contains the machine learning components of the EyeNet project.

## Structure

```
mlService/
├── models/              # ML model definitions
│   ├── anomalyDetection.ts   # Anomaly detection model
│   ├── bandwidthPrediction.ts # Bandwidth prediction model
│   └── networkClassifier.ts   # Network traffic classifier
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

1. Install required ML dependencies:
   ```bash
   npm install @tensorflow/tfjs-node scikit-learn pandas numpy
   ```

2. Set up your model training environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Train the models:
   ```bash
   npm run train-models
   ```

4. Run inference:
   ```bash
   npm run start-ml-service
   ```

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
