# EyeNet Frontend Architecture

## Table of Contents
1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [UI/UX Guidelines](#uiux-guidelines)
5. [Performance Optimization](#performance-optimization)

## Overview

### Technology Stack
- React 18+
- TypeScript
- Material-UI (MUI)
- Redux Toolkit
- React Query
- Socket.IO Client
- Chart.js/D3.js
- Jest & React Testing Library

### Project Structure
```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── alerts/
│   │   └── analytics/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── utils/
├── tests/
└── config/
```

## Component Architecture

### 1. Core Components

#### Dashboard Layout
```typescript
// components/layout/DashboardLayout.tsx
interface DashboardLayoutProps {
    children: React.ReactNode;
    sidebar?: boolean;
    header?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    sidebar = true,
    header = true
}) => {
    return (
        <Box sx={{ display: 'flex' }}>
            {sidebar && <Sidebar />}
            <Box sx={{ flexGrow: 1 }}>
                {header && <Header />}
                <main>{children}</main>
            </Box>
        </Box>
    );
};
```

#### Network Topology Viewer
```typescript
// components/network/TopologyViewer.tsx
interface TopologyViewerProps {
    data: NetworkNode[];
    onNodeClick: (node: NetworkNode) => void;
    layout?: 'force' | 'hierarchical';
}

const TopologyViewer: React.FC<TopologyViewerProps> = ({
    data,
    onNodeClick,
    layout = 'force'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    
    useEffect(() => {
        if (!data || !svgRef.current) return;
        
        const simulation = d3.forceSimulation(data)
            .force('link', d3.forceLink())
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter());
            
        // Render network topology
    }, [data, layout]);
    
    return (
        <Box sx={{ height: '600px', width: '100%' }}>
            <svg ref={svgRef} />
        </Box>
    );
};
```

### 2. Feature Components

#### Device Monitoring
```typescript
// components/devices/DeviceMonitor.tsx
interface DeviceMonitorProps {
    deviceId: string;
    metrics: DeviceMetrics;
    refreshInterval?: number;
}

const DeviceMonitor: React.FC<DeviceMonitorProps> = ({
    deviceId,
    metrics,
    refreshInterval = 5000
}) => {
    const { data, isLoading } = useQuery(
        ['device', deviceId],
        () => fetchDeviceMetrics(deviceId),
        { refetchInterval: refreshInterval }
    );
    
    return (
        <Card>
            <CardHeader title="Device Metrics" />
            <CardContent>
                <MetricsChart data={data} />
                <MetricsTable data={data} />
                <AlertsList deviceId={deviceId} />
            </CardContent>
        </Card>
    );
};
```

#### Alert Management
```typescript
// components/alerts/AlertManager.tsx
interface AlertManagerProps {
    severity?: 'low' | 'medium' | 'high';
    autoRefresh?: boolean;
}

const AlertManager: React.FC<AlertManagerProps> = ({
    severity,
    autoRefresh = true
}) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const socket = useSocket();
    
    useEffect(() => {
        if (!socket) return;
        
        socket.on('alert', (newAlert: Alert) => {
            setAlerts(prev => [...prev, newAlert]);
        });
        
        return () => {
            socket.off('alert');
        };
    }, [socket]);
    
    return (
        <div>
            <AlertFilters />
            <AlertList alerts={alerts} />
            <AlertActions />
        </div>
    );
};
```

## State Management

### 1. Redux Store Configuration
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import deviceReducer from './deviceSlice';
import alertReducer from './alertSlice';
import userReducer from './userSlice';

export const store = configureStore({
    reducer: {
        devices: deviceReducer,
        alerts: alertReducer,
        user: userReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(socketMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 2. API Integration
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle token expiration
        }
        return Promise.reject(error);
    }
);
```

## UI/UX Guidelines

### 1. Theme Configuration
```typescript
// theme/index.ts
import { createTheme } from '@mui/material';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0'
        },
        secondary: {
            main: '#dc004e',
            light: '#ff4081',
            dark: '#9a0036'
        },
        error: {
            main: '#f44336'
        },
        background: {
            default: '#f5f5f5'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none'
                }
            }
        }
    }
});
```

### 2. Responsive Design
```typescript
// hooks/useResponsive.ts
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export const useResponsive = () => {
    const theme = useTheme();
    
    return {
        isMobile: useMediaQuery(theme.breakpoints.down('sm')),
        isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
        isDesktop: useMediaQuery(theme.breakpoints.up('md')),
        isLargeScreen: useMediaQuery(theme.breakpoints.up('lg'))
    };
};
```

## Performance Optimization

### 1. Code Splitting
```typescript
// App.tsx
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Devices = lazy(() => import('./pages/Devices'));
const Analytics = lazy(() => import('./pages/Analytics'));

const App: React.FC = () => {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Router>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/analytics" element={<Analytics />} />
                </Routes>
            </Router>
        </Suspense>
    );
};
```

### 2. Memoization
```typescript
// components/MetricsChart.tsx
interface MetricsChartProps {
    data: MetricData[];
    type: 'line' | 'bar';
}

const MetricsChart: React.FC<MetricsChartProps> = memo(
    ({ data, type }) => {
        const chartData = useMemo(() => 
            processChartData(data),
            [data]
        );
        
        const options = useMemo(() => 
            getChartOptions(type),
            [type]
        );
        
        return (
            <Chart
                type={type}
                data={chartData}
                options={options}
            />
        );
    },
    (prevProps, nextProps) => 
        isEqual(prevProps.data, nextProps.data) &&
        prevProps.type === nextProps.type
);
```

### 3. Virtual Lists
```typescript
// components/DeviceList.tsx
import { FixedSizeList } from 'react-window';

interface DeviceListProps {
    devices: Device[];
    onDeviceSelect: (device: Device) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({
    devices,
    onDeviceSelect
}) => {
    const Row = ({ index, style }) => (
        <div style={style}>
            <DeviceListItem
                device={devices[index]}
                onSelect={onDeviceSelect}
            />
        </div>
    );
    
    return (
        <FixedSizeList
            height={400}
            width="100%"
            itemCount={devices.length}
            itemSize={60}
        >
            {Row}
        </FixedSizeList>
    );
};
```
