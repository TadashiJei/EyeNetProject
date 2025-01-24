# EyeNet ML Integration Guide

## Table of Contents
1. [ML System Architecture](#ml-system-architecture)
2. [Model Development](#model-development)
3. [Training Pipeline](#training-pipeline)
4. [Inference Service](#inference-service)
5. [Model Management](#model-management)
6. [Performance Monitoring](#performance-monitoring)

## ML System Architecture

### 1. System Overview
```python
# ml_system/architecture.py
class MLSystemArchitecture:
    """
    ML System Architecture for EyeNet
    
    Components:
    - Data Collection & Processing
    - Feature Engineering
    - Model Training
    - Model Serving
    - Monitoring & Evaluation
    """
    def __init__(self):
        self.data_pipeline = DataPipeline()
        self.feature_engineering = FeatureEngineering()
        self.model_trainer = ModelTrainer()
        self.model_server = ModelServer()
        self.monitor = MLMonitor()

    async def initialize(self):
        """Initialize ML system components"""
        await self.data_pipeline.initialize()
        await self.feature_engineering.initialize()
        await self.model_trainer.initialize()
        await self.model_server.initialize()
        await self.monitor.initialize()
```

### 2. Data Pipeline
```python
# ml_system/data_pipeline.py
class DataPipeline:
    """
    Data Collection and Processing Pipeline
    """
    def __init__(self):
        self.config = {
            'batch_size': 64,
            'window_size': 300,  # 5 minutes in seconds
            'feature_columns': [
                'bytes_in', 'bytes_out', 'packets_in', 
                'packets_out', 'latency'
            ]
        }
        
    async def collect_network_data(self, device_id):
        """Collect network telemetry data"""
        query = {
            'device_id': device_id,
            'timestamp': {
                '$gte': datetime.now() - timedelta(
                    seconds=self.config['window_size']
                )
            }
        }
        
        data = await NetworkMetrics.find(query).to_list()
        return pd.DataFrame(data)
    
    async def preprocess_data(self, df):
        """Preprocess raw network data"""
        # Handle missing values
        df = df.fillna(method='ffill')
        
        # Normalize numerical features
        scaler = StandardScaler()
        df[self.config['feature_columns']] = scaler.fit_transform(
            df[self.config['feature_columns']]
        )
        
        return df
```

## Model Development

### 1. Feature Engineering
```python
# ml_system/feature_engineering.py
class FeatureEngineering:
    """
    Feature Engineering for Network Anomaly Detection
    """
    def __init__(self):
        self.feature_configs = {
            'statistical': [
                'mean', 'std', 'min', 'max', 'quantile_75'
            ],
            'temporal': [
                'rolling_mean_5m', 'rolling_std_5m'
            ],
            'derived': [
                'bytes_per_packet_in', 'bytes_per_packet_out'
            ]
        }
    
    def create_statistical_features(self, df):
        """Create statistical features"""
        features = {}
        
        for col in df.columns:
            for stat in self.feature_configs['statistical']:
                if stat == 'quantile_75':
                    features[f'{col}_{stat}'] = df[col].quantile(0.75)
                else:
                    features[f'{col}_{stat}'] = getattr(df[col], stat)()
        
        return pd.Series(features)
    
    def create_temporal_features(self, df):
        """Create temporal features"""
        for col in df.columns:
            df[f'{col}_rolling_mean_5m'] = df[col].rolling(
                window='5min'
            ).mean()
            df[f'{col}_rolling_std_5m'] = df[col].rolling(
                window='5min'
            ).std()
        
        return df
    
    def create_derived_features(self, df):
        """Create derived features"""
        df['bytes_per_packet_in'] = df['bytes_in'] / df['packets_in']
        df['bytes_per_packet_out'] = df['bytes_out'] / df['packets_out']
        
        return df
```

### 2. Model Architecture
```python
# ml_system/models/anomaly_detector.py
class AnomalyDetector(nn.Module):
    """
    Neural Network for Network Anomaly Detection
    """
    def __init__(self, input_size, hidden_size=64, num_layers=2):
        super().__init__()
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        # x shape: (batch_size, sequence_length, input_size)
        lstm_out, _ = self.lstm(x)
        
        # Use last LSTM output
        last_output = lstm_out[:, -1, :]
        
        # Predict anomaly probability
        anomaly_prob = self.fc(last_output)
        
        return anomaly_prob
```

## Training Pipeline

### 1. Model Training
```python
# ml_system/training/trainer.py
class ModelTrainer:
    """
    Training Pipeline for Network Anomaly Detection
    """
    def __init__(self):
        self.config = {
            'learning_rate': 1e-3,
            'batch_size': 32,
            'epochs': 100,
            'early_stopping_patience': 10
        }
        
        self.model = AnomalyDetector(
            input_size=len(FEATURE_COLUMNS)
        )
        self.optimizer = torch.optim.Adam(
            self.model.parameters(),
            lr=self.config['learning_rate']
        )
        self.criterion = nn.BCELoss()
    
    async def train(self, train_loader, val_loader):
        """Train the model"""
        best_val_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(self.config['epochs']):
            # Training phase
            self.model.train()
            train_loss = 0
            
            for batch_x, batch_y in train_loader:
                self.optimizer.zero_grad()
                
                predictions = self.model(batch_x)
                loss = self.criterion(predictions, batch_y)
                
                loss.backward()
                self.optimizer.step()
                
                train_loss += loss.item()
            
            # Validation phase
            val_loss = await self.validate(val_loader)
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                await self.save_model()
            else:
                patience_counter += 1
                
            if patience_counter >= self.config['early_stopping_patience']:
                print(f'Early stopping at epoch {epoch}')
                break
    
    async def validate(self, val_loader):
        """Validate the model"""
        self.model.eval()
        val_loss = 0
        
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                predictions = self.model(batch_x)
                loss = self.criterion(predictions, batch_y)
                val_loss += loss.item()
        
        return val_loss / len(val_loader)
    
    async def save_model(self):
        """Save model checkpoints"""
        checkpoint = {
            'model_state': self.model.state_dict(),
            'optimizer_state': self.optimizer.state_dict(),
            'config': self.config
        }
        
        await ModelRegistry.save_model(checkpoint)
```

## Inference Service

### 1. Model Serving
```python
# ml_system/serving/inference.py
class InferenceService:
    """
    Real-time Inference Service for Network Anomaly Detection
    """
    def __init__(self):
        self.model = None
        self.feature_engineering = FeatureEngineering()
        self.threshold = 0.5
    
    async def initialize(self):
        """Initialize inference service"""
        # Load latest model
        model_info = await ModelRegistry.get_latest_model()
        self.model = await self.load_model(model_info)
        
        # Warm up model
        await self.warm_up()
    
    async def predict(self, device_id):
        """Make real-time predictions"""
        try:
            # Collect recent data
            data = await DataPipeline().collect_network_data(device_id)
            
            # Feature engineering
            features = await self.prepare_features(data)
            
            # Make prediction
            self.model.eval()
            with torch.no_grad():
                prediction = self.model(features)
            
            # Process results
            is_anomaly = prediction.item() > self.threshold
            
            return {
                'is_anomaly': is_anomaly,
                'anomaly_score': prediction.item(),
                'timestamp': datetime.now()
            }
        
        except Exception as e:
            logger.error(f'Prediction failed: {str(e)}')
            raise InferenceError(f'Prediction failed: {str(e)}')
    
    async def prepare_features(self, data):
        """Prepare features for inference"""
        # Create features
        features = self.feature_engineering.create_statistical_features(data)
        features = self.feature_engineering.create_temporal_features(features)
        features = self.feature_engineering.create_derived_features(features)
        
        # Convert to tensor
        features = torch.tensor(features.values).float()
        
        return features.unsqueeze(0)  # Add batch dimension
```

## Model Management

### 1. Model Registry
```python
# ml_system/management/registry.py
class ModelRegistry:
    """
    Model Version Control and Registry
    """
    def __init__(self):
        self.storage = ModelStorage()
        self.db = MongoClient(MONGODB_URI).eyenet.models
    
    async def save_model(self, model_info):
        """Save model to registry"""
        version = await self.get_next_version()
        
        model_doc = {
            'version': version,
            'timestamp': datetime.now(),
            'metrics': model_info.get('metrics'),
            'config': model_info.get('config'),
            'status': 'staging'
        }
        
        # Save model artifacts
        artifact_path = await self.storage.save_model(
            model_info['model_state'],
            version
        )
        
        model_doc['artifact_path'] = artifact_path
        await self.db.insert_one(model_doc)
        
        return version
    
    async def get_latest_model(self):
        """Get latest production model"""
        return await self.db.find_one(
            {'status': 'production'},
            sort=[('version', -1)]
        )
    
    async def promote_to_production(self, version):
        """Promote model to production"""
        # Demote current production model
        await self.db.update_many(
            {'status': 'production'},
            {'$set': {'status': 'archived'}}
        )
        
        # Promote new model
        await self.db.update_one(
            {'version': version},
            {'$set': {'status': 'production'}}
        )
```

### 2. Model Deployment
```python
# ml_system/management/deployer.py
class ModelDeployer:
    """
    Model Deployment and Serving Management
    """
    def __init__(self):
        self.registry = ModelRegistry()
        self.inference_service = InferenceService()
    
    async def deploy_model(self, version):
        """Deploy model to production"""
        try:
            # Validate model
            await self.validate_model(version)
            
            # Promote to production
            await self.registry.promote_to_production(version)
            
            # Update inference service
            await self.inference_service.initialize()
            
            return {
                'status': 'success',
                'message': f'Model version {version} deployed'
            }
        
        except Exception as e:
            logger.error(f'Deployment failed: {str(e)}')
            raise DeploymentError(f'Deployment failed: {str(e)}')
    
    async def validate_model(self, version):
        """Validate model before deployment"""
        # Load model
        model_info = await self.registry.get_model(version)
        model = await self.load_model(model_info)
        
        # Run validation tests
        validation_results = await self.run_validation_tests(model)
        
        if not validation_results['passed']:
            raise ValidationError(
                f"Model validation failed: {validation_results['message']}"
            )
```

## Performance Monitoring

### 1. Model Monitor
```python
# ml_system/monitoring/monitor.py
class MLMonitor:
    """
    ML System Performance Monitoring
    """
    def __init__(self):
        self.metrics = {
            'prediction_latency': [],
            'feature_drift': [],
            'model_performance': []
        }
        
        self.alerts = AlertManager()
    
    async def track_prediction(self, prediction_info):
        """Track prediction metrics"""
        # Record latency
        self.metrics['prediction_latency'].append({
            'timestamp': datetime.now(),
            'latency': prediction_info['latency']
        })
        
        # Check for drift
        drift_score = await self.calculate_drift(
            prediction_info['features']
        )
        self.metrics['feature_drift'].append({
            'timestamp': datetime.now(),
            'drift_score': drift_score
        })
        
        # Check thresholds
        await self.check_thresholds()
    
    async def calculate_drift(self, features):
        """Calculate feature drift"""
        # Implementation of drift detection
        pass
    
    async def check_thresholds(self):
        """Check monitoring thresholds"""
        # Check latency threshold
        avg_latency = np.mean(
            [m['latency'] for m in self.metrics['prediction_latency'][-100:]]
        )
        if avg_latency > 100:  # 100ms threshold
            await self.alerts.send_alert(
                'High prediction latency detected',
                {'avg_latency': avg_latency}
            )
        
        # Check drift threshold
        avg_drift = np.mean(
            [m['drift_score'] for m in self.metrics['feature_drift'][-100:]]
        )
        if avg_drift > 0.3:  # 0.3 drift threshold
            await self.alerts.send_alert(
                'Significant feature drift detected',
                {'avg_drift': avg_drift}
            )
```

### 2. Performance Reporting
```python
# ml_system/monitoring/reporter.py
class PerformanceReporter:
    """
    ML Performance Reporting
    """
    def __init__(self):
        self.monitor = MLMonitor()
        self.metrics_db = MongoClient(MONGODB_URI).eyenet.ml_metrics
    
    async def generate_report(self, time_range):
        """Generate performance report"""
        metrics = await self.collect_metrics(time_range)
        
        report = {
            'timestamp': datetime.now(),
            'time_range': time_range,
            'summary': await self.calculate_summary(metrics),
            'details': metrics
        }
        
        await self.save_report(report)
        return report
    
    async def calculate_summary(self, metrics):
        """Calculate performance summary"""
        return {
            'avg_latency': np.mean(metrics['prediction_latency']),
            'p95_latency': np.percentile(metrics['prediction_latency'], 95),
            'avg_drift': np.mean(metrics['feature_drift']),
            'alert_count': len(metrics['alerts'])
        }
    
    async def save_report(self, report):
        """Save performance report"""
        await self.metrics_db.reports.insert_one(report)
```
