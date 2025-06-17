export interface Alert {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  details: {
    error?: {
      type: string;
      message: string;
      stack?: string;
    };
    metrics?: {
      cpu?: number;
      memory?: number;
      latency?: number;
    };
  };
  metadata: {
    source: string;
    severity: 'low' | 'medium' | 'high';
    tags: string[];
  };
} 