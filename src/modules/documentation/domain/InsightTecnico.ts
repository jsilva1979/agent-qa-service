import { AnaliseIA } from '../../ai-prompting/domain/entities/AnaliseIA';
import { CodeContext } from '../../github-access/domain/CodeContext';

export interface TechnicalInsight {
  id?: string;
  title: string;
  service: string;
  error: {
    type: string;
    message: string;
    stackTrace?: string;
    context?: Record<string, any>;
  };
  code?: CodeContext;
  analysis: AnaliseIA;
  recommendations: string[];
  occurrenceDate: string;
  status: 'resolved' | 'in_progress' | 'pending';
  solution?: string;
  preventiveMeasures?: string[];
} 